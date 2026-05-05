import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  GoalPriority,
  NotificationStatus,
  NotificationType,
  Prisma,
  PrismaClient,
  TaskStatus,
} from '@prisma/client';
import {
  buildDailyTaskNotificationBody,
  expandTasksForRange,
  getPriorityRank,
  getIncompleteUnscheduledTasksForDay,
  resolveTaskPriority,
  startOfDay,
} from '@packages/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

const DAILY_SWEEP_INTERVAL_MS = 60 * 60 * 1000;
const STREAK_MILESTONES = new Set([3, 7, 14, 30, 60, 100]);
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';
const PLANNER_HIGH_PRIORITY_CHANNEL_ID = 'planner-high-priority';
const PLANNER_REMINDERS_CHANNEL_ID = 'planner-reminders';
const PLANNER_LOW_PRIORITY_CHANNEL_ID = 'planner-low-priority';
const DAILY_TASKS_NOTIFICATION_KIND = 'daily_tasks';
const EXPO_PUSH_MAX_MESSAGES_PER_REQUEST = 100;
const DAILY_TASKS_RESEND_COOLDOWN_MS = 4 * 60 * 60 * 1000;
const HIGH_PRIORITY_REMINDER_RESEND_MS = 15 * 60 * 1000;
const MEDIUM_PRIORITY_REMINDER_RESEND_MS = 60 * 60 * 1000;
const EMPTY_PUSH_RESULT = {
  attemptedCount: 0,
  deliveredCount: 0,
  invalidTokens: [] as string[],
};

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private dailySweepInterval: ReturnType<typeof setInterval> | null = null;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  onModuleInit() {
    void this.runDailySweep();
    this.dailySweepInterval = setInterval(() => {
      void this.runDailySweep();
    }, DAILY_SWEEP_INTERVAL_MS);
    const intervalWithUnref = this.dailySweepInterval as { unref?: () => void } | null;
    if (intervalWithUnref?.unref) {
      intervalWithUnref.unref();
    }
  }

  onModuleDestroy() {
    if (this.dailySweepInterval) {
      clearInterval(this.dailySweepInterval);
    }
  }

  async list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  async getSummary(userId: string) {
    const context = await this.getUserRetentionContext(userId, new Date(), this.prisma);
    return buildNotificationSummary(context.expandedTasks, context.unreadCount);
  }

  async generateForUser(userId: string, now = new Date(), prismaClient: PrismaClientLike = this.prisma) {
    const context = await this.getUserRetentionContext(userId, now, prismaClient);
    const generated = [];
    let pushesAttempted = 0;

    if (context.dueScheduledTask) {
      const effectivePriority = resolveEffectivePriority(context.dueScheduledTask);
      const scheduledReminder = buildScheduledReminderCopy(context.dueScheduledTask, effectivePriority);
      const result = await this.createNotification(prismaClient, {
        userId,
        type: NotificationType.reminder,
        dedupeKey: `${userId}:scheduled:${context.dueScheduledTask.seriesId ?? context.dueScheduledTask.id}:${toDayKey(context.dueScheduledTask.occurrenceDate ?? context.dueScheduledTask.plannedDate)}`,
        title: scheduledReminder.title,
        body: scheduledReminder.body,
        metadata: {
          goalId: context.dueScheduledTask.goalId,
          taskId: context.dueScheduledTask.seriesId ?? context.dueScheduledTask.id,
          occurrenceDate: (context.dueScheduledTask.occurrenceDate ?? context.dueScheduledTask.plannedDate).toISOString(),
          priority: effectivePriority,
        },
        resendAfterMs: getReminderResendDelayMs(effectivePriority),
      });

      pushesAttempted += result.pushResults.attemptedCount;

      if (result.notification) {
        generated.push(result.notification);
      }
    }

    if (context.unscheduledDailyTasks.length > 0) {
      const firstDailyTask = context.unscheduledDailyTasks[0];
      const dailyTasksNotificationKey = buildDailyTasksNotificationKey(userId, context.dayKey);
      const dailyTaskItems = context.unscheduledDailyTasks.slice(0, 3).map((task) => ({
        id: task.seriesId ?? task.id,
        label: task.title,
        occurrenceDate: (task.occurrenceDate ?? task.plannedDate).toISOString(),
      }));
      await this.clearNotificationByDedupeKey(
        prismaClient,
        buildLegacyDailyTasksNotificationKey(userId, context.dayKey),
      );
      const result = await this.createNotification(prismaClient, {
        userId,
        type: NotificationType.system,
        dedupeKey: dailyTasksNotificationKey,
        title: 'Daily Tasks',
        body: buildDailyTaskNotificationBody(context.unscheduledDailyTasks),
        metadata: {
          taskId: firstDailyTask.id,
          firstTaskId: firstDailyTask.seriesId ?? firstDailyTask.id,
          taskIds: context.unscheduledDailyTasks
            .slice(0, 3)
            .map((task) => task.seriesId ?? task.id),
          notificationKind: DAILY_TASKS_NOTIFICATION_KIND,
          occurrenceDate: (firstDailyTask.occurrenceDate ?? firstDailyTask.plannedDate).toISOString(),
          plannerDate: context.dayKey,
          notificationKey: dailyTasksNotificationKey,
          taskItems: dailyTaskItems,
          moreCount: Math.max(0, context.unscheduledDailyTasks.length - dailyTaskItems.length),
        },
        resendAfterMs: DAILY_TASKS_RESEND_COOLDOWN_MS,
      });

      pushesAttempted += result.pushResults.attemptedCount;

      if (result.notification) {
        generated.push(result.notification);
      }
    } else {
      const clearedDailyNotifications = await this.clearNotificationByDedupeKey(
        prismaClient,
        buildDailyTasksNotificationKey(userId, context.dayKey),
      );
      await this.clearNotificationByDedupeKey(
        prismaClient,
        buildLegacyDailyTasksNotificationKey(userId, context.dayKey),
      );

      if (clearedDailyNotifications > 0) {
        pushesAttempted += await this.sendDailyTasksSyncPush(userId, {
          notificationKey: buildDailyTasksNotificationKey(userId, context.dayKey),
          plannerDate: context.dayKey,
          mode: 'cancel',
        });
      }
    }

    if (context.missedTasksCount > 0) {
      const missedPriority = context.firstMissedTask
        ? resolveEffectivePriority(context.firstMissedTask)
        : GoalPriority.medium;
      const missedCopy = buildMissedTaskCopy(context.firstMissedTask?.title, missedPriority, context.missedTasksCount);
      const result = await this.createNotification(prismaClient, {
        userId,
        type: NotificationType.missed_task,
        dedupeKey: `${userId}:missed:${context.dayKey}`,
        title: missedCopy.title,
        body: missedCopy.body,
        metadata: {
          goalId: context.firstMissedTask?.goalId,
          taskId: context.firstMissedTask ? (context.firstMissedTask.seriesId ?? context.firstMissedTask.id) : undefined,
          occurrenceDate: context.firstMissedTask
            ? (context.firstMissedTask.occurrenceDate ?? context.firstMissedTask.plannedDate).toISOString()
            : undefined,
          priority: missedPriority,
          missedTasksCount: context.missedTasksCount,
        },
      });

      pushesAttempted += result.pushResults.attemptedCount;

      if (result.notification) {
        generated.push(result.notification);
      }
    }

    if (context.behindGoalsCount > 0 || context.aheadGoalsCount > 0 || context.onTrackGoalsCount > 0) {
      const isBehind = context.behindGoalsCount > 0;
      const hasAheadGoal = context.aheadGoalsCount > 0;
      const progressGoalId = isBehind
        ? context.firstBehindGoalId
        : hasAheadGoal
          ? context.firstAheadGoalId
          : context.firstOnTrackGoalId;
      const result = await this.createNotification(prismaClient, {
        userId,
        type: NotificationType.progress_feedback,
        dedupeKey: `${userId}:progress:${context.dayKey}:${isBehind ? 'behind' : hasAheadGoal ? 'ahead' : 'on-track'}`,
        title: isBehind ? 'You are falling behind' : 'You are on track',
        body: isBehind
          ? 'Your goal timeline moved later. Complete today\'s tasks to recover.'
          : 'Good progress. Your goal is still on schedule.',
        metadata: {
          goalId: progressGoalId,
          behindGoalsCount: context.behindGoalsCount,
          aheadGoalsCount: context.aheadGoalsCount,
          onTrackGoalsCount: context.onTrackGoalsCount,
        },
      });

      pushesAttempted += result.pushResults.attemptedCount;

      if (result.notification) {
        generated.push(result.notification);
      }
    }

    if (context.todayScheduledTasksCount === 0 && context.unscheduledDailyTasks.length === 0) {
      const result = await this.createNotification(prismaClient, {
        userId,
        type: NotificationType.system,
        dedupeKey: `${userId}:plan-day:${context.dayKey}`,
        title: 'Plan your day',
        body: 'Open your planner and schedule today\'s tasks.',
      });

      pushesAttempted += result.pushResults.attemptedCount;

      if (result.notification) {
        generated.push(result.notification);
      }
    }

    return {
      generatedCount: generated.length,
      pushesAttempted,
      notifications: generated,
      summary: buildNotificationSummary(context.expandedTasks, context.unreadCount + generated.length),
    };
  }

  async handleTaskStatusChange(userId: string, now = new Date(), prismaClient: PrismaClientLike = this.prisma) {
    const context = await this.getUserRetentionContext(userId, now, prismaClient);

    if (STREAK_MILESTONES.has(context.currentStreak)) {
      await this.createNotification(prismaClient, {
        userId,
        type: NotificationType.streak_reward,
        dedupeKey: `${userId}:streak:${context.currentStreak}`,
        title: `${context.currentStreak}-day streak`,
        body: `You have completed tasks ${context.currentStreak} day${pluralize(context.currentStreak)} in a row.`,
        metadata: {
          currentStreak: context.currentStreak,
          bestStreak: context.bestStreak,
        },
      });
    }
  }

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    await this.prisma.userDevice.upsert({
      where: { token: dto.token },
      update: {
        userId,
        platform: dto.platform,
      },
      create: {
        userId,
        token: dto.token,
        platform: dto.platform,
      },
    });

    return {
      status: 'ok' as const,
      registered: true,
    };
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.read,
        readAt: new Date(),
      },
    });
  }

  async runSweep(now = new Date()) {
    const users = await this.prisma.user.findMany({
      select: { id: true },
    });
    let processedUsers = 0;
    let notificationsCreated = 0;
    let pushesAttempted = 0;

    for (const user of users) {
      try {
        const generated = await this.generateForUser(user.id, now);
        notificationsCreated += generated.generatedCount;
        pushesAttempted += generated.pushesAttempted;
        processedUsers += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown notification sweep error';
        this.logger.error(`Notification sweep failed for user ${user.id}: ${message}`);
      }
    }

    return {
      status: 'ok',
      processedUsers,
      notificationsCreated,
      pushesAttempted,
    };
  }

  async sendTestPush(userId: string) {
    const devices = await this.prisma.userDevice.findMany({
      where: { userId },
      select: {
        token: true,
      },
    });

    const expoTokens = devices
      .map((device) => device.token)
      .filter((token) => isExpoPushToken(token));

    if (expoTokens.length === 0) {
      return {
        status: 'ok',
        deviceCount: 0,
        pushesAttempted: 0,
        sentCount: 0,
        invalidTokenCount: 0,
      };
    }

    const pushResults = await this.dispatchExpoPushMessages(
        expoTokens.map((token) => ({
          token,
          message: {
            kind: 'standard',
            title: 'Planner test push',
            body: 'Push notifications are working on this device.',
            type: NotificationType.system,
            channelId: PLANNER_REMINDERS_CHANNEL_ID,
          },
        })),
    );

    if (pushResults.invalidTokens.length > 0) {
      await this.prisma.userDevice.deleteMany({
        where: {
          token: {
            in: pushResults.invalidTokens,
          },
        },
      });
    }

    return {
      status: 'ok',
      deviceCount: expoTokens.length,
      pushesAttempted: pushResults.attemptedCount,
      sentCount: pushResults.deliveredCount,
      invalidTokenCount: pushResults.invalidTokens.length,
    };
  }

  private async runDailySweep(now = new Date()) {
    await this.runSweep(now);
  }

  private async getUserRetentionContext(
    userId: string,
    now: Date,
    prismaClient: PrismaClientLike,
  ) {
    const tasks = await prismaClient.task.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        goalId: true,
        priority: true,
        status: true,
        type: true,
        plannedDate: true,
        startTime: true,
        endTime: true,
        estimatedMinutes: true,
        targetValue: true,
        completedValue: true,
        source: true,
        order: true,
        createdAt: true,
        recurrenceType: true,
        recurrenceDaysOfWeek: true,
        recurrenceEndDate: true,
        occurrences: {
          select: {
            id: true,
            taskId: true,
            occurrenceDate: true,
            status: true,
            completionPercent: true,
            completedValue: true,
            note: true,
            completedDate: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        progressLogs: {
          select: {
            status: true,
            occurrenceDate: true,
            loggedAt: true,
          },
        },
        goal: {
          select: {
            title: true,
            targetDate: true,
            projectedDate: true,
            priority: true,
          },
        },
      },
    });
    const normalizedTasks = tasks.map((task) => ({
      ...task,
      goalPriority: task.goal?.priority ?? null,
    }));
    const today = startOfDay(now);
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - 30);
    const expandedTasks = expandTasksForRange(normalizedTasks, rangeStart, today) as unknown as RetentionTask[];
    const unscheduledDailyTasks = getIncompleteUnscheduledTasksForDay(normalizedTasks, today) as unknown as RetentionTask[];

    const unreadCount = await prismaClient.notification.count({
      where: {
        userId,
        status: NotificationStatus.unread,
      },
    });

    const summary = buildNotificationSummary(expandedTasks, unreadCount, now);

    return {
      tasks: normalizedTasks,
      expandedTasks,
      unreadCount,
      unscheduledDailyTasks,
      ...summary,
      dayKey: toDayKey(now),
    };
  }

  private async createNotification(
    prismaClient: PrismaClientLike,
    input: {
      userId: string;
      type: NotificationType;
      title: string;
      body: string;
      dedupeKey: string;
      metadata?: Record<string, unknown>;
      resendAfterMs?: number;
    },
  ) {
    const existingNotification = input.dedupeKey
      ? await prismaClient.notification.findUnique({
          where: { dedupeKey: input.dedupeKey },
        })
      : null;
    const metadata = toPrismaJson(input.metadata);
    const contentChanged = Boolean(
      existingNotification && (
        existingNotification.title !== input.title ||
        existingNotification.body !== input.body ||
        JSON.stringify(existingNotification.metadata ?? null) !== JSON.stringify(metadata ?? null)
      ),
    );
    const resendAfterMs = input.resendAfterMs ?? 0;
    const shouldResendUnchanged = Boolean(
      existingNotification &&
      resendAfterMs > 0 &&
      Date.now() - existingNotification.updatedAt.getTime() >= resendAfterMs,
    );
    const shouldUpdateExisting = Boolean(
      existingNotification && (contentChanged || shouldResendUnchanged),
    );
    const shouldSendPush = !existingNotification || contentChanged || shouldResendUnchanged;

    const notification = existingNotification
      ? shouldUpdateExisting
        ? await prismaClient.notification.update({
            where: { id: existingNotification.id },
            data: {
              title: input.title,
              body: input.body,
              metadata,
              status: NotificationStatus.unread,
              readAt: null,
            },
          })
        : existingNotification
      : await prismaClient.notification.create({
          data: {
            userId: input.userId,
            type: input.type,
            title: input.title,
            body: input.body,
            dedupeKey: input.dedupeKey,
            metadata,
            status: NotificationStatus.unread,
          },
        });

    return {
      notification,
      pushResults: shouldSendPush
        ? await this.sendPushNotification(input.userId, notification)
        : EMPTY_PUSH_RESULT,
    };
  }

  private async clearNotificationByDedupeKey(
    prismaClient: PrismaClientLike,
    dedupeKey: string,
  ) {
    const result = await prismaClient.notification.updateMany({
      where: {
        dedupeKey,
        status: NotificationStatus.unread,
      },
      data: {
        status: NotificationStatus.read,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  private async sendPushNotification(userId: string, notification: {
    id: string;
    title: string;
    body: string;
    type: NotificationType;
    dedupeKey?: string | null;
    metadata?: Prisma.JsonValue | null;
  }) {
    const devices = await this.prisma.userDevice.findMany({
      where: {
        userId,
      },
      select: {
        token: true,
      },
    });

    const expoDevices = devices.filter((device) => isExpoPushToken(device.token));

    if (expoDevices.length === 0) {
      return EMPTY_PUSH_RESULT;
    }

    try {
      const pushResults = await this.dispatchExpoPushMessages(
        expoDevices.map((device) => ({
          token: device.token,
          message: buildPushMessageInput(notification),
        })),
      );

      if (pushResults.invalidTokens.length > 0) {
        await this.prisma.userDevice.deleteMany({
          where: {
            token: {
              in: pushResults.invalidTokens,
            },
          },
        });
      }

      return pushResults;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Expo push send error';
      this.logger.warn(`Expo push delivery failed for user ${userId}: ${message}`);
      return {
        attemptedCount: expoDevices.length,
        deliveredCount: 0,
        invalidTokens: [],
      };
    }
  }

  private async dispatchExpoPushMessages(
    deliveries: Array<{
      token: string;
      message: ExpoPushMessageInput;
    }>,
  ) {
    const invalidTokens = new Set<string>();
    const attemptedCount = deliveries.length;
    let deliveredCount = 0;

    for (const batch of chunk(deliveries, EXPO_PUSH_MAX_MESSAGES_PER_REQUEST)) {
      const messages = batch.map((delivery) => buildExpoPushMessage(delivery.token, delivery.message));

      try {
        const response = await fetch(EXPO_PUSH_API_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messages),
        });

        const payload = await parseExpoPushResponse(response);

        if (!response.ok) {
          this.logger.warn(`Expo push send failed with status ${response.status}`);
        }

        const ticketData = Array.isArray(payload?.data) ? payload.data : [];

        batch.forEach((delivery, index) => {
          const ticket = ticketData[index];

          if (isExpoTicketOk(ticket)) {
            deliveredCount += 1;
            return;
          }

          if (!ticket) {
            this.logger.warn('Expo push ticket missing for device token');
            return;
          }

          const providerError = extractExpoTicketError(ticket);

          if (providerError) {
            this.logger.warn(`Expo push ticket error for device token: ${providerError}`);
          }

          if (isInvalidExpoTokenError(ticket)) {
            invalidTokens.add(delivery.token);
          }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown push send error';
        this.logger.warn(`Expo push send error: ${message}`);
      }
    }

    return {
      attemptedCount,
      deliveredCount,
      invalidTokens: Array.from(invalidTokens),
    };
  }

  private async sendDailyTasksSyncPush(
    userId: string,
    input: {
      notificationKey: string;
      plannerDate: string;
      mode: 'cancel';
    },
  ) {
    const devices = await this.prisma.userDevice.findMany({
      where: { userId },
      select: { token: true },
    });

    const expoTokens = devices
      .map((device) => device.token)
      .filter((token) => isExpoPushToken(token));

    if (expoTokens.length === 0) {
      return 0;
    }

    try {
      const pushResults = await this.dispatchExpoPushMessages(
        expoTokens.map((token) => ({
          token,
          message: {
            kind: 'daily_tasks_sync',
            notificationKind: DAILY_TASKS_NOTIFICATION_KIND,
            notificationKey: input.notificationKey,
            displayTitle: 'Daily Tasks',
            tasks: [],
            moreCount: 0,
            plannerDate: input.plannerDate,
            mode: input.mode,
          },
        })),
      );

      if (pushResults.invalidTokens.length > 0) {
        await this.prisma.userDevice.deleteMany({
          where: {
            token: {
              in: pushResults.invalidTokens,
            },
          },
        });
      }

      return pushResults.attemptedCount;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Expo push send error';
      this.logger.warn(`Expo push delivery failed for daily-task sync ${userId}: ${message}`);
      return 0;
    }
  }
}

type PrismaClientLike = PrismaService | Prisma.TransactionClient | PrismaClient;

type RetentionTask = {
  id: string;
  userId: string;
  title: string;
  goalId?: string | null;
  priority?: GoalPriority | null;
  goalPriority?: GoalPriority | null;
  status: TaskStatus;
  plannedDate: Date;
  seriesId?: string;
  occurrenceDate?: Date;
  startTime?: string | null;
  endTime?: string | null;
  estimatedMinutes: number | null;
  targetValue: number | null;
  completedValue?: number | null;
  createdAt?: Date;
  progressLogs: Array<{
    status: TaskStatus;
    occurrenceDate?: Date | null;
    loggedAt: Date;
  }>;
  goal?: {
    title: string;
    targetDate: Date;
    projectedDate: Date;
    priority: GoalPriority;
  } | null;
};

type ExpoPushMessageInput =
  | {
      kind: 'standard';
      title: string;
      body: string;
      type: NotificationType;
      channelId: string;
      notificationId?: string;
      routeData?: Record<string, string | string[]>;
      notificationTag?: string;
    }
  | {
      kind: 'daily_tasks_sync';
      notificationKind: typeof DAILY_TASKS_NOTIFICATION_KIND;
      notificationKey: string;
      displayTitle: string;
      tasks: Array<{
        id: string;
        label: string;
        occurrenceDate: string;
      }>;
      moreCount: number;
      plannerDate: string;
      mode: 'upsert' | 'cancel';
    };

function buildNotificationSummary(
  tasks: RetentionTask[],
  unreadCount: number,
  now = new Date(),
) {
  const todayKey = toDayKey(now);
  const todayTasks = tasks.filter((task) => toDayKey(task.occurrenceDate ?? task.plannedDate) === todayKey);
  const todayScheduledTasks = todayTasks.filter((task) => Boolean(task.startTime && task.endTime));
  const dueScheduledTasks = todayScheduledTasks
    .filter((task) => !isTaskCompleted(task.status) && isScheduledTaskDue(task, now))
    .sort(compareTasksForReminder);
  const todayCompletedTasks = todayTasks.filter((task) => task.status === TaskStatus.done).length;
  const todayTotalTasks = todayTasks.length;
  const todayScheduledTasksCount = todayScheduledTasks.length;
  const missedTasksCount = tasks.filter(
    (task) => toDayKey(task.occurrenceDate ?? task.plannedDate) < todayKey && !isTaskCompleted(task.status),
  ).length;
  const nextScheduledTask = todayScheduledTasks
    .filter((task) => !isTaskCompleted(task.status))
    .sort(compareTasksForReminder)[0];
  const firstMissedTask = tasks
    .filter((task) => toDayKey(task.occurrenceDate ?? task.plannedDate) < todayKey && !isTaskCompleted(task.status))
    .sort(compareMissedTasks)[0];
  const goalStates = new Map<string, { targetDate: Date; projectedDate: Date; title: string }>();

  for (const task of tasks) {
    if (task.goalId && task.goal) {
      goalStates.set(task.goalId, task.goal);
    }
  }

  let behindGoalsCount = 0;
  let aheadGoalsCount = 0;
  let onTrackGoalsCount = 0;
  let firstBehindGoalId: string | undefined;
  let firstAheadGoalId: string | undefined;
  let firstOnTrackGoalId: string | undefined;

  for (const [goalId, goal] of goalStates.entries()) {
    if (goal.projectedDate.getTime() > goal.targetDate.getTime()) {
      behindGoalsCount += 1;
      firstBehindGoalId ??= goalId;
    } else if (goal.projectedDate.getTime() < goal.targetDate.getTime()) {
      aheadGoalsCount += 1;
      firstAheadGoalId ??= goalId;
    } else {
      onTrackGoalsCount += 1;
      firstOnTrackGoalId ??= goalId;
    }
  }

  const doneDaySet = new Set<string>();

  for (const task of tasks) {
    for (const log of task.progressLogs) {
      if (log.status === TaskStatus.done) {
        doneDaySet.add(toDayKey(log.occurrenceDate ?? log.loggedAt));
      }
    }

    if (task.status === TaskStatus.done && task.progressLogs.length === 0) {
      doneDaySet.add(toDayKey(task.occurrenceDate ?? task.plannedDate));
    }
  }

  const { currentStreak, bestStreak } = calculateStreak(Array.from(doneDaySet));

  return {
    currentStreak,
    bestStreak,
    todayCompletionRate: todayTotalTasks > 0 ? todayCompletedTasks / todayTotalTasks : 0,
    todayCompletedTasks,
    todayTotalTasks,
    todayScheduledTasksCount,
    dueScheduledTask: dueScheduledTasks[0],
    missedTasksCount,
    behindGoalsCount,
    aheadGoalsCount,
    onTrackGoalsCount,
    firstBehindGoalId,
    firstAheadGoalId,
    firstOnTrackGoalId,
    nextScheduledTask,
    firstMissedTask,
    unreadCount,
  };
}

function calculateStreak(dayKeys: string[]) {
  if (dayKeys.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const sortedDays = dayKeys
    .map((day) => new Date(day))
    .sort((left, right) => left.getTime() - right.getTime());

  let bestStreak = 1;
  let currentRun = 1;

  for (let index = 1; index < sortedDays.length; index += 1) {
    const previous = sortedDays[index - 1];
    const current = sortedDays[index];
    const diffInDays = Math.round((current.getTime() - previous.getTime()) / DAY_IN_MS);

    if (diffInDays === 1) {
      currentRun += 1;
      bestStreak = Math.max(bestStreak, currentRun);
    } else if (diffInDays > 1) {
      currentRun = 1;
    }
  }

  let currentStreak = 0;
  const availableDays = new Set(dayKeys);
  let pointer = startOfUtcDay(new Date());

  while (availableDays.has(pointer.toISOString())) {
    currentStreak += 1;
    pointer = new Date(pointer.getTime() - DAY_IN_MS);
  }

  return {
    currentStreak,
    bestStreak,
  };
}

function isTaskCompleted(status: TaskStatus) {
  return status === TaskStatus.done;
}

function compareTasksForReminder(left: RetentionTask, right: RetentionTask) {
  const priorityDiff = getPriorityRank(resolveEffectivePriority(right)) - getPriorityRank(resolveEffectivePriority(left));

  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  if (left.startTime && right.startTime) {
    const timeDiff = left.startTime.localeCompare(right.startTime);

    if (timeDiff !== 0) {
      return timeDiff;
    }
  }

  const dateDiff = (left.occurrenceDate ?? left.plannedDate).getTime()
    - (right.occurrenceDate ?? right.plannedDate).getTime();

  if (dateDiff !== 0) {
    return dateDiff;
  }

  return (left.createdAt?.getTime() ?? 0) - (right.createdAt?.getTime() ?? 0);
}

function compareMissedTasks(left: RetentionTask, right: RetentionTask) {
  const priorityDiff = getPriorityRank(resolveEffectivePriority(right)) - getPriorityRank(resolveEffectivePriority(left));

  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  return (right.occurrenceDate ?? right.plannedDate).getTime() - (left.occurrenceDate ?? left.plannedDate).getTime();
}

function isScheduledTaskDue(task: RetentionTask, now: Date) {
  if (!task.startTime || !task.endTime) {
    return false;
  }

  const taskStart = combineDateAndTime(task.occurrenceDate ?? task.plannedDate, task.startTime);
  return taskStart.getTime() <= now.getTime();
}

function combineDateAndTime(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map((value) => Number.parseInt(value, 10));
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
}

function resolveEffectivePriority(task: Pick<RetentionTask, 'priority' | 'goalPriority'>) {
  return resolveTaskPriority({
    priority: task.priority ?? undefined,
    goalPriority: task.goalPriority ?? undefined,
  }) as GoalPriority;
}

function getReminderResendDelayMs(priority: GoalPriority) {
  switch (priority) {
    case GoalPriority.high:
      return HIGH_PRIORITY_REMINDER_RESEND_MS;
    case GoalPriority.medium:
      return MEDIUM_PRIORITY_REMINDER_RESEND_MS;
    case GoalPriority.low:
    default:
      return 0;
  }
}

function buildScheduledReminderCopy(task: RetentionTask, priority: GoalPriority) {
  switch (priority) {
    case GoalPriority.high:
      return {
        title: 'High priority task now',
        body: `"${task.title}" needs attention now.`,
      };
    case GoalPriority.low:
      return {
        title: 'Low priority task',
        body: `"${task.title}" is ready when you are.`,
      };
    case GoalPriority.medium:
    default:
      return {
        title: 'Task time',
        body: `"${task.title}" is scheduled now.`,
      };
  }
}

function buildMissedTaskCopy(taskTitle: string | undefined, priority: GoalPriority, missedTasksCount: number) {
  if (taskTitle) {
    switch (priority) {
      case GoalPriority.high:
        return {
          title: 'High priority task missed',
          body: `You missed "${taskTitle}". Replan it as soon as possible.`,
        };
      case GoalPriority.low:
        return {
          title: 'Low priority task missed',
          body: `You missed "${taskTitle}". Reschedule it when needed.`,
        };
      case GoalPriority.medium:
      default:
        return {
          title: 'Task missed',
          body: `You missed "${taskTitle}".`,
        };
    }
  }

  return {
    title: priority === GoalPriority.high ? 'High priority tasks missed' : 'Task missed',
    body: `${missedTasksCount} missed task${pluralize(missedTasksCount)} still need attention.`,
  };
}

function toDayKey(date: Date) {
  return startOfUtcDay(date).toISOString();
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function pluralize(value: number) {
  return value === 1 ? '' : 's';
}

function isExpoPushToken(token: string) {
  return token.startsWith('ExpoPushToken[') || token.startsWith('ExponentPushToken[');
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function extractNotificationPushData(metadata: Prisma.JsonValue | null | undefined) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const metadataRecord = metadata as Record<string, unknown>;
  const routeData: Record<string, string | string[]> = {};

  if (typeof metadataRecord.goalId === 'string') {
    routeData.goalId = metadataRecord.goalId;
  }

  if (typeof metadataRecord.taskId === 'string') {
    routeData.taskId = metadataRecord.taskId;
  }

  if (typeof metadataRecord.firstTaskId === 'string') {
    routeData.firstTaskId = metadataRecord.firstTaskId;
  }

  if (
    Array.isArray(metadataRecord.taskIds) &&
    metadataRecord.taskIds.every((value) => typeof value === 'string')
  ) {
    routeData.taskIds = metadataRecord.taskIds as string[];
  }

  if (typeof metadataRecord.occurrenceDate === 'string') {
    routeData.occurrenceDate = metadataRecord.occurrenceDate;
  }

  if (typeof metadataRecord.notificationKind === 'string') {
    routeData.notificationKind = metadataRecord.notificationKind;
  }

  if (typeof metadataRecord.plannerDate === 'string') {
    routeData.plannerDate = metadataRecord.plannerDate;
  }

  return routeData;
}

function extractNotificationPushTag(
  dedupeKey: string | null | undefined,
  metadata: Prisma.JsonValue | null | undefined,
) {
  if (
    metadata &&
    typeof metadata === 'object' &&
    !Array.isArray(metadata) &&
    'notificationKind' in metadata &&
    metadata.notificationKind === DAILY_TASKS_NOTIFICATION_KIND &&
    typeof dedupeKey === 'string'
  ) {
    return dedupeKey;
  }

  return undefined;
}

function buildPushMessageInput(notification: {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  dedupeKey?: string | null;
  metadata?: Prisma.JsonValue | null;
}): ExpoPushMessageInput {
  const type = resolvePushNotificationType(notification.type, notification.metadata);

  if (type === DAILY_TASKS_NOTIFICATION_KIND) {
    return buildDailyTasksSyncMessage(notification);
  }

  return {
    kind: 'standard',
    title: notification.title,
    body: notification.body,
    type,
    channelId: resolveNotificationChannelId(notification.type, notification.metadata),
    notificationId: notification.id,
    routeData: extractNotificationPushData(notification.metadata),
    notificationTag: extractNotificationPushTag(notification.dedupeKey, notification.metadata),
  };
}

function buildDailyTasksSyncMessage(notification: {
  id: string;
  dedupeKey?: string | null;
  metadata?: Prisma.JsonValue | null;
}): ExpoPushMessageInput {
  const metadata = notification.metadata && typeof notification.metadata === 'object' && !Array.isArray(notification.metadata)
    ? notification.metadata as Record<string, unknown>
    : {};
  const tasks = Array.isArray(metadata.taskItems)
    ? metadata.taskItems.flatMap((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return [];
        }

        const task = item as Record<string, unknown>;
        const id = typeof task.id === 'string' ? task.id : null;
        const label = typeof task.label === 'string' ? task.label : null;
        const occurrenceDate = typeof task.occurrenceDate === 'string' ? task.occurrenceDate : null;

        if (!id || !label || !occurrenceDate) {
          return [];
        }

        return [{
          id,
          label,
          occurrenceDate,
        }];
      })
    : [];

  return {
    kind: 'daily_tasks_sync',
    notificationKind: DAILY_TASKS_NOTIFICATION_KIND,
    notificationKey: typeof metadata.notificationKey === 'string'
      ? metadata.notificationKey
      : (notification.dedupeKey ?? ''),
    displayTitle: 'Daily Tasks',
    tasks,
    moreCount: typeof metadata.moreCount === 'number' ? metadata.moreCount : 0,
    plannerDate: typeof metadata.plannerDate === 'string' ? metadata.plannerDate : toDayKey(new Date()),
    mode: 'upsert',
  };
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function buildExpoPushMessage(
  token: string,
  input: ExpoPushMessageInput,
) {
  if (input.kind === 'daily_tasks_sync') {
    return {
      to: token,
      priority: 'high',
      ttl: 60,
      _contentAvailable: true,
      data: {
        notificationKind: input.notificationKind,
        notificationKey: input.notificationKey,
        displayTitle: input.displayTitle,
        tasks: input.tasks,
        moreCount: input.moreCount,
        plannerDate: input.plannerDate,
        mode: input.mode,
      },
    };
  }

  return {
    to: token,
    title: input.title,
    body: input.body,
    sound: 'default',
    priority: input.channelId === PLANNER_LOW_PRIORITY_CHANNEL_ID ? 'default' : 'high',
    channelId: input.channelId,
    ...(input.notificationTag
      ? {
          tag: input.notificationTag,
          collapseId: input.notificationTag,
        }
      : {}),
    data: {
      ...(input.notificationId ? { notificationId: input.notificationId } : {}),
      type: input.type,
      ...(input.routeData ?? {}),
    },
  };
}

function buildDailyTasksNotificationKey(userId: string, dayKey: string) {
  return `daily_tasks_${userId}_${dayKey.slice(0, 10)}`;
}

function buildLegacyDailyTasksNotificationKey(userId: string, dayKey: string) {
  return `${userId}:daily-tasks:${dayKey}`;
}

function resolvePushNotificationType(
  type: NotificationType,
  metadata: Prisma.JsonValue | null | undefined,
) {
  if (
    metadata &&
    typeof metadata === 'object' &&
    !Array.isArray(metadata) &&
    'notificationKind' in metadata &&
    metadata.notificationKind === DAILY_TASKS_NOTIFICATION_KIND
  ) {
    return DAILY_TASKS_NOTIFICATION_KIND;
  }

  return type;
}

function resolveNotificationChannelId(
  type: NotificationType,
  metadata: Prisma.JsonValue | null | undefined,
) {
  const priority = extractNotificationPriority(metadata);

  if (type !== NotificationType.reminder && type !== NotificationType.missed_task) {
    return PLANNER_REMINDERS_CHANNEL_ID;
  }

  switch (priority) {
    case GoalPriority.high:
      return PLANNER_HIGH_PRIORITY_CHANNEL_ID;
    case GoalPriority.low:
      return PLANNER_LOW_PRIORITY_CHANNEL_ID;
    case GoalPriority.medium:
    default:
      return PLANNER_REMINDERS_CHANNEL_ID;
  }
}

function extractNotificationPriority(metadata: Prisma.JsonValue | null | undefined) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return GoalPriority.medium;
  }

  const rawPriority = metadata.priority;

  if (
    rawPriority === GoalPriority.low ||
    rawPriority === GoalPriority.medium ||
    rawPriority === GoalPriority.high
  ) {
    return rawPriority;
  }

  return GoalPriority.medium;
}

async function parseExpoPushResponse(response: Response): Promise<{ data?: unknown[] } | null> {
  try {
    return await response.json() as { data?: unknown[] };
  } catch {
    return null;
  }
}

function extractExpoTicketError(ticket: unknown) {
  if (!ticket || typeof ticket !== 'object' || Array.isArray(ticket)) {
    return null;
  }

  const message = 'message' in ticket && typeof ticket.message === 'string' ? ticket.message : null;
  const details = 'details' in ticket && typeof ticket.details === 'object' && ticket.details !== null
    ? ticket.details as Record<string, unknown>
    : null;
  const providerCode = details && typeof details.error === 'string' ? details.error : null;

  if (providerCode && message) {
    return `${providerCode}: ${message}`;
  }

  return providerCode ?? message;
}

function isInvalidExpoTokenError(ticket: unknown) {
  if (!ticket || typeof ticket !== 'object' || Array.isArray(ticket)) {
    return false;
  }

  const message = 'message' in ticket && typeof ticket.message === 'string' ? ticket.message : '';
  const details = 'details' in ticket && typeof ticket.details === 'object' && ticket.details !== null
    ? ticket.details as Record<string, unknown>
    : null;
  const providerCode = details && typeof details.error === 'string' ? details.error : '';

  return providerCode === 'DeviceNotRegistered' ||
    providerCode === 'InvalidCredentials' ||
    message.includes('not a registered push notification recipient') ||
    message.includes('DeviceNotRegistered') ||
    message.includes('ExponentPushToken') ||
    message.includes('ExpoPushToken');
}

function isExpoTicketOk(ticket: unknown) {
  return Boolean(
    ticket &&
    typeof ticket === 'object' &&
    !Array.isArray(ticket) &&
    'status' in ticket &&
    ticket.status === 'ok',
  );
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

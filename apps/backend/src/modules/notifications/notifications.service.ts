import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  NotificationStatus,
  NotificationType,
  Prisma,
  PrismaClient,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

const DAILY_SWEEP_INTERVAL_MS = 60 * 60 * 1000;
const STREAK_MILESTONES = new Set([3, 7, 14, 30, 60, 100]);
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';
const PLANNER_REMINDERS_CHANNEL_ID = 'planner-reminders';
const EXPO_PUSH_MAX_MESSAGES_PER_REQUEST = 100;
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
    const [tasks, unreadCount] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          goal: {
            userId,
          },
        },
        select: {
          id: true,
          title: true,
          goalId: true,
          status: true,
          plannedDate: true,
          estimatedMinutes: true,
          targetValue: true,
          progressLogs: {
            select: {
              status: true,
              loggedAt: true,
            },
          },
          goal: {
            select: {
              title: true,
              targetDate: true,
              projectedDate: true,
            },
          },
        },
      }),
      this.prisma.notification.count({
        where: {
          userId,
          status: NotificationStatus.unread,
        },
      }),
    ]);

    return buildNotificationSummary(tasks, unreadCount);
  }

  async generateForUser(userId: string, now = new Date(), prismaClient: PrismaClientLike = this.prisma) {
    const context = await this.getUserRetentionContext(userId, now, prismaClient);
    const generated = [];
    let pushesAttempted = 0;

    if (context.todayTotalTasks > 0) {
      const result = await this.createNotification(prismaClient, {
        userId,
        type: NotificationType.reminder,
        dedupeKey: `${userId}:reminder:${context.dayKey}`,
        title: 'Time to continue your plan',
        body: `You have ${context.todayTotalTasks} task${pluralize(context.todayTotalTasks)} scheduled for today.`,
        metadata: {
          goalId: context.nextScheduledTask?.goalId,
          taskId: context.nextScheduledTask?.id,
          todayTotalTasks: context.todayTotalTasks,
          todayCompletedTasks: context.todayCompletedTasks,
        },
      });

      pushesAttempted += result.pushResults.attemptedCount;

      if (result.notification) {
        generated.push(result.notification);
      }
    }

    if (context.missedTasksCount > 0) {
      const result = await this.createNotification(prismaClient, {
        userId,
        type: NotificationType.missed_task,
        dedupeKey: `${userId}:missed:${context.dayKey}`,
        title: 'Task missed',
        body: context.firstMissedTask
          ? `You missed "${context.firstMissedTask.title}". Your projected date may change.`
          : `${context.missedTasksCount} missed task${pluralize(context.missedTasksCount)} still need attention.`,
        metadata: {
          goalId: context.firstMissedTask?.goalId,
          taskId: context.firstMissedTask?.id,
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

    if (context.todayTotalTasks === 0) {
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
      summary: buildNotificationSummary(context.tasks, context.unreadCount + generated.length),
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
    return this.prisma.userDevice.upsert({
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
      select: {
        id: true,
        token: true,
        platform: true,
        createdAt: true,
      },
    });
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
        sentCount: 0,
        invalidTokenCount: 0,
      };
    }

    const pushResults = await this.dispatchExpoPushMessages(
      expoTokens.map((token) => ({
        token,
        message: {
          title: 'Planner test push',
          body: 'Push notifications are working on this device.',
          type: NotificationType.system,
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
        goal: {
          userId,
        },
      },
      select: {
        id: true,
        title: true,
        goalId: true,
        status: true,
        plannedDate: true,
        estimatedMinutes: true,
        targetValue: true,
        progressLogs: {
          select: {
            status: true,
            loggedAt: true,
          },
        },
        goal: {
          select: {
            title: true,
            targetDate: true,
            projectedDate: true,
          },
        },
      },
    });

    const unreadCount = await prismaClient.notification.count({
      where: {
        userId,
        status: NotificationStatus.unread,
      },
    });

    const summary = buildNotificationSummary(tasks, unreadCount, now);

    return {
      tasks,
      unreadCount,
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
    },
  ) {
    try {
      const notification = await prismaClient.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          dedupeKey: input.dedupeKey,
          metadata: toPrismaJson(input.metadata),
          status: NotificationStatus.unread,
        },
      });

      const pushResults = await this.sendPushNotification(input.userId, notification);

      return {
        notification,
        pushResults,
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return {
          notification: null,
          pushResults: EMPTY_PUSH_RESULT,
        };
      }

      throw error;
    }
  }

  private async sendPushNotification(userId: string, notification: {
    id: string;
    title: string;
    body: string;
    type: NotificationType;
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
          message: {
            title: notification.title,
            body: notification.body,
            type: notification.type,
            notificationId: notification.id,
            routeData: extractNotificationRouteData(notification.metadata),
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
      message: {
        title: string;
        body: string;
        type: NotificationType;
        notificationId?: string;
        routeData?: Record<string, string>;
      };
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
}

type PrismaClientLike = PrismaService | Prisma.TransactionClient | PrismaClient;

type RetentionTask = {
  id: string;
  title: string;
  goalId: string;
  status: TaskStatus;
  plannedDate: Date;
  estimatedMinutes: number | null;
  targetValue: number | null;
  progressLogs: Array<{
    status: TaskStatus;
    loggedAt: Date;
  }>;
  goal: {
    title: string;
    targetDate: Date;
    projectedDate: Date;
  };
};

function buildNotificationSummary(
  tasks: RetentionTask[],
  unreadCount: number,
  now = new Date(),
) {
  const todayKey = toDayKey(now);
  const todayTasks = tasks.filter((task) => toDayKey(task.plannedDate) === todayKey);
  const todayCompletedTasks = todayTasks.filter((task) => task.status === TaskStatus.done).length;
  const todayTotalTasks = todayTasks.length;
  const missedTasksCount = tasks.filter(
    (task) => toDayKey(task.plannedDate) < todayKey && !isTaskCompleted(task.status),
  ).length;
  const nextScheduledTask = todayTasks
    .filter((task) => !isTaskCompleted(task.status))
    .sort((left, right) => left.plannedDate.getTime() - right.plannedDate.getTime())[0];
  const firstMissedTask = tasks
    .filter((task) => toDayKey(task.plannedDate) < todayKey && !isTaskCompleted(task.status))
    .sort((left, right) => right.plannedDate.getTime() - left.plannedDate.getTime())[0];
  const goalStates = new Map<string, { targetDate: Date; projectedDate: Date; title: string }>();

  for (const task of tasks) {
    goalStates.set(task.goalId, task.goal);
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
        doneDaySet.add(toDayKey(log.loggedAt));
      }
    }

    if (task.status === TaskStatus.done && task.progressLogs.length === 0) {
      doneDaySet.add(toDayKey(task.plannedDate));
    }
  }

  const { currentStreak, bestStreak } = calculateStreak(Array.from(doneDaySet));

  return {
    currentStreak,
    bestStreak,
    todayCompletionRate: todayTotalTasks > 0 ? todayCompletedTasks / todayTotalTasks : 0,
    todayCompletedTasks,
    todayTotalTasks,
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

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function extractNotificationRouteData(metadata: Prisma.JsonValue | null | undefined) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const metadataRecord = metadata as Record<string, unknown>;
  const routeData: Record<string, string> = {};

  if (typeof metadataRecord.goalId === 'string') {
    routeData.goalId = metadataRecord.goalId;
  }

  if (typeof metadataRecord.taskId === 'string') {
    routeData.taskId = metadataRecord.taskId;
  }

  return routeData;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function buildExpoPushMessage(
  token: string,
  input: {
    title: string;
    body: string;
    type: NotificationType;
    notificationId?: string;
    routeData?: Record<string, string>;
  },
) {
  return {
    to: token,
    title: input.title,
    body: input.body,
    sound: 'default',
    priority: 'high',
    channelId: PLANNER_REMINDERS_CHANNEL_ID,
    data: {
      ...(input.notificationId ? { notificationId: input.notificationId } : {}),
      type: input.type,
      ...(input.routeData ?? {}),
    },
  };
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

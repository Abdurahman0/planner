import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GoalPriority, Prisma, TaskSource, TaskStatus, TaskType } from '@prisma/client';
import { calculateProjectedDate, expandTasksForRange, RecurrenceLike, RecurrenceType, startOfDay } from '@packages/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { assertValidRecurrenceInput } from '../shared/recurrence-utils';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string,
    dto: CreateTaskDto,
    source: TaskSource = TaskSource.manual,
    prismaClient: PrismaClientLike = this.prisma,
  ) {
    if (dto.goalId) {
      await this.findOwnedGoalOrThrow(userId, dto.goalId, prismaClient);
    }
    this.assertValidTaskState(dto.type, {
      startTime: dto.startTime,
      endTime: dto.endTime,
      targetValue: dto.targetValue,
      targetUnit: dto.targetUnit,
    });
    this.assertValidRecurrence(dto.recurrenceType, dto.recurrenceDaysOfWeek, dto.plannedDate, dto.recurrenceEndDate);

    const order = await prismaClient.task.count({
      where: dto.goalId
        ? { userId, goalId: dto.goalId }
        : { userId, goalId: null },
    });

    return prismaClient.task.create({
      data: {
        userId,
        goalId: dto.goalId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        type: dto.type,
        plannedDate: new Date(dto.plannedDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        estimatedMinutes: dto.estimatedMinutes,
        targetValue: dto.targetValue,
        targetUnit: dto.targetUnit,
        status: TaskStatus.todo,
        source,
        order,
        recurrenceType: dto.recurrenceType ?? RecurrenceType.NONE,
        recurrenceDaysOfWeek: dto.recurrenceDaysOfWeek ?? [],
        recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : null,
      },
      select: this.taskSelect,
    }).then((task) => this.serializeTask(task));
  }

  async findAll(userId: string, goalId?: string, from?: string, to?: string) {
    if (goalId) {
      await this.findOwnedGoalOrThrow(userId, goalId);
    }

    const tasks = await this.prisma.task.findMany({
      where: goalId ? { userId, goalId } : { userId },
      select: this.taskSelect,
      orderBy: [
        { plannedDate: 'asc' },
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    if (!from || !to) {
      return tasks.map((task) => this.serializeTask(task));
    }

    return expandTasksForRange(tasks, new Date(from), new Date(to)).map((task) => this.serializeTask(task));
  }

  async findOne(userId: string, taskId: string) {
    return this.serializeTask(await this.findOwnedTaskOrThrow(userId, taskId));
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    const existingTask = await this.findOwnedTaskOrThrow(userId, taskId);
    const existingRecurrenceEndDate = existingTask.recurrenceEndDate instanceof Date
      ? existingTask.recurrenceEndDate.toISOString()
      : undefined;

    const nextState = {
      type: dto.type ?? existingTask.type,
      startTime: this.resolveUpdatedValue(existingTask.startTime, dto.startTime),
      endTime: this.resolveUpdatedValue(existingTask.endTime, dto.endTime),
      targetValue: this.resolveUpdatedValue(existingTask.targetValue, dto.targetValue),
      targetUnit: this.resolveUpdatedValue(existingTask.targetUnit, dto.targetUnit),
    };

    this.assertValidTaskState(nextState.type, nextState);
    this.assertValidRecurrence(
      dto.recurrenceType ?? existingTask.recurrenceType,
      dto.recurrenceDaysOfWeek ?? existingTask.recurrenceDaysOfWeek,
      dto.plannedDate ?? existingTask.plannedDate.toISOString(),
      dto.recurrenceEndDate === null
        ? undefined
        : dto.recurrenceEndDate ?? existingRecurrenceEndDate,
    );

    const data: Prisma.TaskUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.priority !== undefined) {
      data.priority = dto.priority;
    }

    if (dto.type !== undefined) {
      data.type = dto.type;
    }

    if (dto.plannedDate !== undefined) {
      data.plannedDate = new Date(dto.plannedDate);
    }

    if (dto.startTime !== undefined) {
      data.startTime = dto.startTime;
    }

    if (dto.endTime !== undefined) {
      data.endTime = dto.endTime;
    }

    if (dto.estimatedMinutes !== undefined) {
      data.estimatedMinutes = dto.estimatedMinutes;
    }

    if (dto.targetValue !== undefined) {
      data.targetValue = dto.targetValue;
    }

    if (dto.targetUnit !== undefined) {
      data.targetUnit = dto.targetUnit;
    }

    if (dto.recurrenceType !== undefined) {
      data.recurrenceType = dto.recurrenceType;
    }

    if (dto.recurrenceDaysOfWeek !== undefined) {
      data.recurrenceDaysOfWeek = dto.recurrenceDaysOfWeek;
    }

    if (dto.recurrenceEndDate !== undefined) {
      data.recurrenceEndDate = dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : null;
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data,
      select: this.taskSelect,
    }).then((task) => this.serializeTask(task));
  }

  async updateStatus(userId: string, taskId: string, dto: UpdateTaskStatusDto) {
    const existingTask = await this.findOwnedTaskOrThrow(userId, taskId);
    const occurrenceDate = this.resolveRecurringOccurrenceDate(existingTask, dto.occurrenceDate);

    if (existingTask.type === TaskType.time_based && dto.completedValue !== undefined) {
      throw new BadRequestException('completedValue is only allowed for unit-based tasks');
    }

    const completedValue = this.resolveCompletedValue(existingTask, dto);
    const completionPercent = this.resolveCompletionPercent(dto);

    const result = await this.prisma.$transaction(async (tx) => {
      let task;

      if (existingTask.recurrenceType !== RecurrenceType.NONE) {
        await tx.taskOccurrence.upsert({
          where: {
            taskId_occurrenceDate: {
              taskId,
              occurrenceDate: occurrenceDate ?? startOfDay(new Date()),
            },
          },
          update: {
            status: dto.status,
            completedDate: dto.status === TaskStatus.done ? new Date() : null,
            completedValue,
            completionPercent,
            note: dto.note,
          },
          create: {
            taskId,
            occurrenceDate: occurrenceDate ?? startOfDay(new Date()),
            status: dto.status,
            completedDate: dto.status === TaskStatus.done ? new Date() : null,
            completedValue,
            completionPercent,
            note: dto.note,
          },
        });

        task = await tx.task.findUniqueOrThrow({
          where: { id: taskId },
          select: this.taskSelect,
        });
      } else {
        task = await tx.task.update({
          where: { id: taskId },
          data: {
            status: dto.status,
            completedDate: dto.status === TaskStatus.done ? new Date() : null,
            completedValue,
          },
          select: this.taskSelect,
        });
      }

      const progressLog = await tx.taskProgressLog.create({
        data: {
          userId,
          taskId,
          status: dto.status,
          completionPercent,
          completedValue,
          note: dto.note,
          occurrenceDate,
        },
        select: this.taskProgressLogSelect,
      });

      const projectedDate = task.goalId
        ? await this.recalculateGoalProjectedDate(userId, task.goalId, tx)
        : null;

      return {
        task: this.serializeTask(
          occurrenceDate
            ? {
                ...task,
                status: dto.status,
                occurrenceDate,
                isRecurringInstance: true,
                seriesId: task.id,
              }
            : task,
        ),
        progressLog,
        projectedDate,
      };
    });

    await this.notificationsService.handleTaskStatusChange(userId);

    return result;
  }

  async recalculateGoalProjectedDate(
    userId: string,
    goalId: string,
    prismaClient: PrismaClientLike = this.prisma,
  ) {
    const goal = await prismaClient.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
      select: {
        id: true,
        targetDate: true,
        createdAt: true,
        tasks: {
          select: {
            ...this.taskSelect,
            progressLogs: {
              select: this.taskProgressLogSelect,
            },
            occurrences: {
              select: this.taskOccurrenceSelect,
            },
          },
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    const recurringProjectionHorizon = goal.targetDate.getTime() > Date.now()
      ? goal.targetDate
      : new Date();
    const recurringTasks = expandTasksForRange(
      goal.tasks as Array<(typeof goal.tasks)[number] & {
        progressLogs: Array<{
          id: string;
          userId: string;
          taskId: string;
          status: TaskStatus;
          completionPercent?: number | null;
          completedValue?: number | null;
          note?: string | null;
          occurrenceDate?: Date | null;
          loggedAt: Date;
        }>;
      }>,
      goal.createdAt,
      recurringProjectionHorizon,
    );
    const projectionTasks = recurringTasks.map(
      (task) => ({
        plannedDate: task.occurrenceDate ?? task.plannedDate,
        status: task.status as TaskStatus,
        type: task.type as TaskType,
        estimatedMinutes: task.estimatedMinutes,
        targetValue: task.targetValue,
        completedValue: task.completedValue,
        progressLogs: task.progressLogs,
      }),
    );
    const projectedDate = calculateProjectedDate(goal.targetDate, projectionTasks, goal.createdAt);

    await prismaClient.goal.update({
      where: { id: goal.id },
      data: { projectedDate },
    });

    return projectedDate;
  }

  async deleteOpenAiTasksForGoal(
    userId: string,
    goalId: string,
    prismaClient: PrismaClientLike = this.prisma,
  ) {
    await this.findOwnedGoalOrThrow(userId, goalId, prismaClient);

    await prismaClient.task.deleteMany({
      where: {
        goalId,
        source: TaskSource.ai,
        status: {
          not: TaskStatus.done,
        },
      },
    });
  }

  private async findOwnedGoalOrThrow(
    userId: string,
    goalId: string,
    prismaClient: PrismaClientLike = this.prisma,
  ) {
    const goal = await prismaClient.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  private async findOwnedTaskOrThrow(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
      select: this.taskSelect,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private assertValidTaskState(
    type: TaskType,
    values: {
      startTime?: string | null;
      endTime?: string | null;
      targetValue?: number | null;
      targetUnit?: string | null;
    },
  ) {
    const hasStartTime = values.startTime !== undefined && values.startTime !== null;
    const hasEndTime = values.endTime !== undefined && values.endTime !== null;

    if (hasStartTime !== hasEndTime) {
      throw new BadRequestException('startTime and endTime must both be provided together');
    }

    if (hasStartTime && hasEndTime && values.startTime! >= values.endTime!) {
      throw new BadRequestException('endTime must be later than startTime');
    }

    if (type === TaskType.unit_based) {
      if (values.targetValue === undefined || values.targetValue === null) {
        throw new BadRequestException('Unit-based tasks require targetValue');
      }

      if (values.targetUnit === undefined || values.targetUnit === null || values.targetUnit.length === 0) {
        throw new BadRequestException('Unit-based tasks require targetUnit');
      }
    }
  }

  private resolveUpdatedValue<T>(currentValue: T, nextValue: T | null | undefined) {
    if (nextValue === undefined) {
      return currentValue;
    }

    return nextValue;
  }

  private resolveCompletedValue(
    task: Awaited<ReturnType<TasksService['findOwnedTaskOrThrow']>>,
    dto: UpdateTaskStatusDto,
  ) {
    if (task.type === TaskType.unit_based) {
      if (dto.status === TaskStatus.done && dto.completedValue === undefined && task.targetValue !== null) {
        return task.targetValue;
      }

      if (dto.completedValue !== undefined) {
        return dto.completedValue;
      }
    }

    return task.completedValue;
  }

  private resolveCompletionPercent(dto: UpdateTaskStatusDto) {
    if (dto.completionPercent !== undefined) {
      return dto.completionPercent;
    }

    if (dto.status === TaskStatus.done) {
      return 100;
    }

    return undefined;
  }

  private resolveRecurringOccurrenceDate(
    task: Awaited<ReturnType<TasksService['findOwnedTaskOrThrow']>>,
    occurrenceDate?: string,
  ) {
    if (task.recurrenceType === RecurrenceType.NONE) {
      return occurrenceDate ? startOfDay(new Date(occurrenceDate)) : undefined;
    }

    if (occurrenceDate) {
      return startOfDay(new Date(occurrenceDate));
    }

    const today = startOfDay(new Date());

    if (today.getTime() < startOfDay(task.plannedDate).getTime()) {
      return startOfDay(task.plannedDate);
    }

    return today;
  }

  private assertValidRecurrence(
    recurrenceType: RecurrenceLike | undefined,
    recurrenceDaysOfWeek: number[] | undefined,
    plannedDate: string,
    recurrenceEndDate?: string,
  ) {
    assertValidRecurrenceInput(
      recurrenceType ?? RecurrenceType.NONE,
      recurrenceDaysOfWeek,
      new Date(plannedDate),
      recurrenceEndDate ? new Date(recurrenceEndDate) : undefined,
    );
  }

  private readonly taskSelect = {
    id: true,
    userId: true,
    goalId: true,
    planId: true,
    milestoneId: true,
      title: true,
      description: true,
      priority: true,
      status: true,
    type: true,
    plannedDate: true,
    startTime: true,
    endTime: true,
    completedDate: true,
    estimatedMinutes: true,
    targetValue: true,
    completedValue: true,
    targetUnit: true,
    source: true,
    order: true,
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
      goal: {
        select: {
          priority: true,
        },
      },
      createdAt: true,
      updatedAt: true,
  } as const;

  private readonly taskProgressLogSelect = {
    id: true,
    userId: true,
    taskId: true,
    status: true,
    completionPercent: true,
    completedValue: true,
    note: true,
    occurrenceDate: true,
    loggedAt: true,
  } as const;

  private readonly taskOccurrenceSelect = {
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
  } as const;

  private serializeTask<
    T extends {
      priority?: GoalPriority | null;
      goal?: { priority: GoalPriority } | null;
    },
  >(task: T) {
    const effectivePriority = task.priority ?? task.goal?.priority ?? GoalPriority.medium;
    const { goal, ...rest } = task as T & { goal?: { priority: GoalPriority } | null };

    return {
      ...rest,
      priority: task.priority ?? undefined,
      goalPriority: goal?.priority,
      effectivePriority,
    };
  }
}

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

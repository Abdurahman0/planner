import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TaskSource, TaskStatus, TaskType } from '@prisma/client';
import { calculateProjectedDate } from '@packages/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
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
    await this.findOwnedGoalOrThrow(userId, dto.goalId, prismaClient);
    this.assertValidTaskState(dto.type, {
      startTime: dto.startTime,
      endTime: dto.endTime,
      targetValue: dto.targetValue,
      targetUnit: dto.targetUnit,
    });

    const order = await prismaClient.task.count({
      where: { goalId: dto.goalId },
    });

    return prismaClient.task.create({
      data: {
        goalId: dto.goalId,
        title: dto.title,
        description: dto.description,
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
      },
      select: this.taskSelect,
    });
  }

  async findAll(userId: string, goalId?: string) {
    if (goalId) {
      await this.findOwnedGoalOrThrow(userId, goalId);
    }

    return this.prisma.task.findMany({
      where: goalId
        ? { goalId }
        : {
            goal: {
              userId,
            },
          },
      select: this.taskSelect,
      orderBy: [
        { plannedDate: 'asc' },
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async findOne(userId: string, taskId: string) {
    return this.findOwnedTaskOrThrow(userId, taskId);
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    const existingTask = await this.findOwnedTaskOrThrow(userId, taskId);

    const nextState = {
      type: dto.type ?? existingTask.type,
      startTime: this.resolveUpdatedValue(existingTask.startTime, dto.startTime),
      endTime: this.resolveUpdatedValue(existingTask.endTime, dto.endTime),
      targetValue: this.resolveUpdatedValue(existingTask.targetValue, dto.targetValue),
      targetUnit: this.resolveUpdatedValue(existingTask.targetUnit, dto.targetUnit),
    };

    this.assertValidTaskState(nextState.type, nextState);

    const data: Prisma.TaskUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
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

    return this.prisma.task.update({
      where: { id: taskId },
      data,
      select: this.taskSelect,
    });
  }

  async updateStatus(userId: string, taskId: string, dto: UpdateTaskStatusDto) {
    const existingTask = await this.findOwnedTaskOrThrow(userId, taskId);

    if (existingTask.type === TaskType.time_based && dto.completedValue !== undefined) {
      throw new BadRequestException('completedValue is only allowed for unit-based tasks');
    }

    const completedValue = this.resolveCompletedValue(existingTask, dto);
    const completionPercent = this.resolveCompletionPercent(dto);

    const result = await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          status: dto.status,
          completedDate: dto.status === TaskStatus.done ? new Date() : null,
          completedValue,
        },
        select: this.taskSelect,
      });

      const progressLog = await tx.taskProgressLog.create({
        data: {
          userId,
          taskId,
          status: dto.status,
          completionPercent,
          completedValue,
          note: dto.note,
        },
        select: this.taskProgressLogSelect,
      });

      const goal = await tx.goal.findUniqueOrThrow({
        where: { id: task.goalId },
        select: {
          id: true,
          userId: true,
        },
      });

      const projectedDate = await this.recalculateGoalProjectedDate(goal.userId, goal.id, tx);

      return {
        task,
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
          },
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    const projectedDate = calculateProjectedDate(goal.targetDate, goal.tasks, goal.createdAt);

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
        goal: {
          userId,
        },
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

  private readonly taskSelect = {
    id: true,
    goalId: true,
    planId: true,
    milestoneId: true,
    title: true,
    description: true,
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
    loggedAt: true,
  } as const;
}

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

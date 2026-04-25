import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GoalPriority, GoalStatus, GoalType, Prisma, SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateGoalDto,
    userSubscriptionPlan: SubscriptionPlan,
    prismaClient: PrismaClientLike = this.prisma,
  ) {
    const currentSubscriptionPlan = await this.resolveCurrentSubscriptionPlan(userId, userSubscriptionPlan);

    if (dto.type === GoalType.ai_managed) {
      this.assertCanCreateAiGoal(currentSubscriptionPlan);
      await this.assertAiGoalCapacity(userId);
    }

    const targetDate = new Date(dto.targetDate);

    return prismaClient.goal.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        priority: dto.priority ?? GoalPriority.medium,
        status: GoalStatus.in_progress,
        targetDate,
        projectedDate: targetDate,
        isCompleted: false,
      },
      select: this.goalSelect,
    });
  }

  async findAll(userId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { userId },
      select: this.goalSelect,
      orderBy: { updatedAt: 'desc' },
    });

    return goals.sort((left, right) => {
      const leftRank = this.goalStatusRank[left.status];
      const rightRank = this.goalStatusRank[right.status];

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return right.updatedAt.getTime() - left.updatedAt.getTime();
    });
  }

  async findOne(userId: string, goalId: string) {
    return this.findOwnedGoalOrThrow(userId, goalId);
  }

  async update(userId: string, goalId: string, dto: UpdateGoalDto) {
    await this.findOwnedGoalOrThrow(userId, goalId);

    const data: Parameters<typeof this.prisma.goal.update>[0]['data'] = {};

    if (dto.title !== undefined) {
      data.title = dto.title;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.targetDate !== undefined) {
      data.targetDate = new Date(dto.targetDate);
    }

    if (dto.priority !== undefined) {
      data.priority = dto.priority;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
      data.isCompleted = dto.status === GoalStatus.completed;
    }

    return this.prisma.goal.update({
      where: { id: goalId },
      data,
      select: this.goalSelect,
    });
  }

  async remove(userId: string, goalId: string) {
    await this.findOwnedGoalOrThrow(userId, goalId);

    return this.prisma.goal.update({
      where: { id: goalId },
      data: {
        status: GoalStatus.archived,
        isCompleted: false,
      },
      select: this.goalSelect,
    });
  }

  private async findOwnedGoalOrThrow(userId: string, goalId: string) {
    const goal = await this.prisma.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
      select: this.goalSelect,
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  private assertCanCreateAiGoal(userSubscriptionPlan: SubscriptionPlan) {
    if (userSubscriptionPlan === SubscriptionPlan.free) {
      throw new ForbiddenException('AI-managed goals require a premium subscription');
    }
  }

  private async resolveCurrentSubscriptionPlan(userId: string, fallbackPlan: SubscriptionPlan) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionPlan: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.subscriptionPlan ?? fallbackPlan;
  }

  private async assertAiGoalCapacity(userId: string) {
    const activeAiGoalsCount = await this.prisma.goal.count({
      where: {
        userId,
        type: GoalType.ai_managed,
        status: GoalStatus.in_progress,
      },
    });

    if (activeAiGoalsCount >= 3) {
      throw new ForbiddenException('Premium users can have at most 3 active AI-managed goals');
    }
  }

  private readonly goalStatusRank: Record<GoalStatus, number> = {
    [GoalStatus.in_progress]: 0,
    [GoalStatus.completed]: 1,
    [GoalStatus.failed]: 2,
    [GoalStatus.archived]: 3,
  };

  private readonly goalSelect = {
    id: true,
    userId: true,
    title: true,
    description: true,
    type: true,
    priority: true,
    status: true,
    targetDate: true,
    projectedDate: true,
    isCompleted: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

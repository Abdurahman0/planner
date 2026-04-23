import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoalType, SubscriptionPlan } from '@packages/shared';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async createGoal(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (data.type === GoalType.AI_MANAGED) {
      const aiGoalsCount = await this.prisma.goal.count({
        where: { userId, type: GoalType.AI_MANAGED, isCompleted: false }
      });

      const limit = user.subscriptionPlan === SubscriptionPlan.AI_PRO ? 10 : 3;
      if (aiGoalsCount >= limit && user.subscriptionPlan === SubscriptionPlan.FREE) {
        throw new Error('Free users cannot have AI-managed goals. Upgrade to Premium.');
      }
      if (aiGoalsCount >= 3 && user.subscriptionPlan === SubscriptionPlan.AI_BASIC) {
        throw new Error('AI Basic limit reached.');
      }
    }

    return this.prisma.goal.create({
      data: {
        ...data,
        userId,
        projectedDate: data.targetDate,
      }
    });
  }

  async getGoals(userId: string) {
    return this.prisma.goal.findMany({
      where: { userId },
      include: { tasks: true }
    });
  }
}

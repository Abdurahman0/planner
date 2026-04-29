import { PrismaClient } from '@prisma/client';
import {
  AvailabilityType,
  GoalPriority,
  GoalStatus,
  GoalType,
  SubscriptionPlan,
  TaskSource,
  TaskStatus,
  TaskType,
} from '../../../packages/shared/src/index.ts';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'premium@example.com' },
    update: {},
    create: {
      email: 'premium@example.com',
      passwordHash: 'hashed_password',
      subscriptionPlan: SubscriptionPlan.AI_BASIC,
    },
  });

  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Master Full-Stack Development',
      type: GoalType.AI_MANAGED,
      priority: GoalPriority.HIGH,
      status: GoalStatus.IN_PROGRESS,
      targetDate: new Date('2026-10-01'),
      projectedDate: new Date('2026-10-01'),
    },
  });

  const plan = await prisma.plan.create({
    data: {
      goalId: goal.id,
      version: 1,
      isCurrent: true,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        goalId: goal.id,
        planId: plan.id,
        title: 'Learn React Native Basics',
        status: TaskStatus.DONE,
        type: TaskType.TIME_BASED,
        plannedDate: new Date(),
        startTime: '09:00',
        endTime: '10:30',
        estimatedMinutes: 90,
        source: TaskSource.AI,
        order: 1,
      },
      {
        userId: user.id,
        goalId: goal.id,
        planId: plan.id,
        title: 'Build a NestJS API',
        status: TaskStatus.TODO,
        type: TaskType.TIME_BASED,
        plannedDate: new Date(),
        startTime: '11:00',
        endTime: '12:00',
        estimatedMinutes: 60,
        source: TaskSource.AI,
        order: 2,
      },
    ],
  });

  await prisma.availabilitySlot.createMany({
    data: [
      {
        userId: user.id,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        type: AvailabilityType.WORK,
        label: 'Work',
      },
      {
        userId: user.id,
        dayOfWeek: 2,
        startTime: '09:00',
        endTime: '17:00',
        type: AvailabilityType.WORK,
        label: 'Work',
      },
    ],
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import { SubscriptionPlan, GoalType, TaskStatus, TaskType } from '@packages/shared';

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
      targetDate: new Date('2026-10-01'),
      projectedDate: new Date('2026-10-01'),
    },
  });

  await prisma.task.createMany({
    data: [
      {
        goalId: goal.id,
        title: 'Learn React Native Basics',
        status: TaskStatus.DONE,
        type: TaskType.TIME_BASED,
        plannedDate: new Date(),
        isAiGenerated: true,
        order: 1,
      },
      {
        goalId: goal.id,
        title: 'Build a NestJS API',
        status: TaskStatus.TODO,
        type: TaskType.TIME_BASED,
        plannedDate: new Date(),
        isAiGenerated: true,
        order: 2,
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

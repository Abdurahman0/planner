import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateProjectedDate } from '@packages/shared';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async updateTaskStatus(taskId: string, status: TaskStatus) {
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { status, completedDate: status === TaskStatus.done ? new Date() : null },
    });

    const goal = await this.prisma.goal.findUniqueOrThrow({
      where: { id: task.goalId },
      include: { tasks: true },
    });

    // Recalculate projected date for the goal
    const newProjectedDate = calculateProjectedDate(
      goal.targetDate,
      goal.tasks as any
    );

    await this.prisma.goal.update({
      where: { id: task.goalId },
      data: { projectedDate: newProjectedDate }
    });

    return task;
  }
}

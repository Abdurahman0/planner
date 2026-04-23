import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateProjectedDate } from '@packages/shared';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async updateTaskStatus(taskId: string, status: string) {
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { status, completedDate: status === 'done' ? new Date() : null },
      include: { goal: { include: { tasks: true } } }
    });

    // Recalculate projected date for the goal
    const newProjectedDate = calculateProjectedDate(
      task.goal.targetDate,
      task.goal.tasks as any
    );

    await this.prisma.goal.update({
      where: { id: task.goalId },
      data: { projectedDate: newProjectedDate }
    });

    return task;
  }
}

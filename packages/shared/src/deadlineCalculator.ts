import { Task, TaskStatus } from './index';

/**
 * Calculates the projected deadline movement based on planned workload vs actual completion.
 * 
 * Rule:
 * - If a user misses tasks, projected completion date extends.
 * - If a user over-completes tasks, projected completion date can shrink.
 */
export function calculateProjectedDate(
  originalTargetDate: Date,
  tasks: Task[]
): Date {
  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.status === TaskStatus.TODO && t.plannedDate < now
  );

  if (overdueTasks.length === 0) {
    return originalTargetDate;
  }

  // Simple heuristic: each overdue task adds its estimated time (or a default day) to the projection
  let totalDelayDays = 0;
  overdueTasks.forEach((task) => {
    // If we have time estimates, we could be more precise.
    // For now, let's assume each overdue task pushes the timeline by 1 day if it's a daily task.
    totalDelayDays += 1;
  });

  const projectedDate = new Date(originalTargetDate);
  projectedDate.setDate(projectedDate.getDate() + totalDelayDays);

  return projectedDate;
}

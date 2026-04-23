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
  const incompleteOverdueTasks = tasks.filter(
    (task) =>
      [TaskStatus.TODO, TaskStatus.PARTIAL, TaskStatus.FAILED].includes(task.status) &&
      task.plannedDate < now
  );

  if (incompleteOverdueTasks.length === 0) {
    return originalTargetDate;
  }

  const totalDelayDays = incompleteOverdueTasks.reduce((delayDays, task) => {
    if (task.status === TaskStatus.PARTIAL && task.targetValue && task.completedValue) {
      const remainingRatio = Math.max(0, (task.targetValue - task.completedValue) / task.targetValue);
      return delayDays + Math.max(0.25, remainingRatio);
    }

    if (task.estimatedMinutes) {
      return delayDays + Math.max(0.25, task.estimatedMinutes / 60 / 2);
    }

    return delayDays + 1;
  }, 0);

  const projectedDate = new Date(originalTargetDate);
  projectedDate.setDate(projectedDate.getDate() + Math.ceil(totalDelayDays));

  return projectedDate;
}

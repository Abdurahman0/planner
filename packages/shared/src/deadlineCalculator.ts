type DeadlineTaskType = 'time_based' | 'unit_based';
type DeadlineTaskStatus = 'todo' | 'in_progress' | 'done' | 'partial' | 'failed';

export interface DeadlineProgressLog {
  completionPercent?: number | null;
  completedValue?: number | null;
}

export interface DeadlineTask {
  plannedDate: Date;
  status: DeadlineTaskStatus;
  type: DeadlineTaskType;
  estimatedMinutes?: number | null;
  targetValue?: number | null;
  completedValue?: number | null;
  progressLogs?: DeadlineProgressLog[];
}

/**
 * Calculates a projected deadline using planned workload vs actual logged progress.
 *
 * Rules:
 * - Expected workload comes from task definitions.
 * - Completed workload comes from TaskProgressLog snapshots.
 * - Work planned on or before the reference date is considered due.
 * - If actual completed workload is below due workload, the projection extends.
 * - If actual completed workload is above due workload, the projection shrinks.
 */
export function calculateProjectedDate(
  originalTargetDate: Date,
  tasks: DeadlineTask[],
  goalCreatedAt?: Date,
  referenceDate: Date = new Date(),
): Date {
  const normalizedTargetDate = new Date(originalTargetDate);
  const normalizedReferenceDate = new Date(referenceDate);
  const workloadTasks = tasks.filter((task) => getExpectedWorkload(task) > 0);

  if (workloadTasks.length === 0) {
    return normalizedTargetDate;
  }

  const timelineStartDate = getTimelineStartDate(workloadTasks, goalCreatedAt);
  const totalExpectedWorkload = workloadTasks.reduce((sum, task) => sum + getExpectedWorkload(task), 0);

  if (totalExpectedWorkload <= 0) {
    return normalizedTargetDate;
  }

  const dueWorkload = getDueWorkload(workloadTasks, normalizedTargetDate, normalizedReferenceDate);
  const completedWorkload = workloadTasks.reduce((sum, task) => sum + getCompletedWorkload(task), 0);
  const remainingWorkload = Math.max(0, totalExpectedWorkload - completedWorkload);

  if (remainingWorkload === 0) {
    return normalizedReferenceDate;
  }

  const plannedDailyRate = getPlannedDailyRate(timelineStartDate, normalizedTargetDate, totalExpectedWorkload);
  const scheduleDelta = completedWorkload - dueWorkload;
  const shiftDays = scheduleDelta / plannedDailyRate;
  const projectedDate = new Date(normalizedTargetDate);

  projectedDate.setTime(projectedDate.getTime() - shiftDays * DAY_IN_MS);

  if (projectedDate.getTime() < normalizedReferenceDate.getTime()) {
    return normalizedReferenceDate;
  }

  return projectedDate;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getExpectedWorkload(task: DeadlineTask) {
  if (task.type === 'time_based') {
    return Math.max(0, task.estimatedMinutes ?? 0);
  }

  return Math.max(0, task.targetValue ?? 0);
}

function getCompletedWorkload(task: DeadlineTask) {
  const expectedWorkload = getExpectedWorkload(task);

  if (expectedWorkload === 0) {
    return 0;
  }

  if (task.status === 'done') {
    return expectedWorkload;
  }

  if (task.type === 'time_based') {
    const bestPercent = task.progressLogs?.reduce((maxPercent, log) => {
      if (log.completionPercent === undefined) {
        return maxPercent;
      }

      return Math.max(maxPercent, log.completionPercent);
    }, 0) ?? 0;

    return Math.min(expectedWorkload, expectedWorkload * Math.max(0, bestPercent) / 100);
  }

  const maxLoggedValue = task.progressLogs?.reduce((maxValue, log) => {
    if (log.completedValue === undefined) {
      return maxValue;
    }

    return Math.max(maxValue, log.completedValue);
  }, 0) ?? 0;

  const currentValue = task.completedValue ?? 0;

  return Math.min(expectedWorkload, Math.max(0, maxLoggedValue, currentValue));
}

function getTimelineStartDate(tasks: DeadlineTask[], goalCreatedAt?: Date) {
  const earliestPlannedDate = tasks.reduce<Date | null>((earliest, task) => {
    const plannedDate = new Date(task.plannedDate);

    if (!earliest || plannedDate.getTime() < earliest.getTime()) {
      return plannedDate;
    }

    return earliest;
  }, goalCreatedAt ? new Date(goalCreatedAt) : null);

  return earliestPlannedDate ?? new Date();
}

function getDueWorkload(
  tasks: DeadlineTask[],
  targetDate: Date,
  referenceDate: Date,
) {
  if (referenceDate.getTime() >= targetDate.getTime()) {
    return tasks.reduce((sum, task) => sum + getExpectedWorkload(task), 0);
  }

  return tasks.reduce((sum, task) => {
    if (new Date(task.plannedDate).getTime() <= referenceDate.getTime()) {
      return sum + getExpectedWorkload(task);
    }

    return sum;
  }, 0);
}

function getPlannedDailyRate(
  timelineStartDate: Date,
  targetDate: Date,
  totalExpectedWorkload: number,
) {
  const durationInDays = Math.max(1, (targetDate.getTime() - timelineStartDate.getTime()) / DAY_IN_MS);

  return Math.max(totalExpectedWorkload / durationInDays, 0.0001);
}

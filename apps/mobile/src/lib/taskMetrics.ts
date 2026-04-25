import type { Task } from '@packages/shared';
import { TaskStatus } from '@packages/shared';

export function getTodayCompletionRate(tasks: Task[]) {
  const today = new Date().toDateString();
  const todayTasks = tasks.filter((task) => new Date(task.plannedDate).toDateString() === today);

  if (todayTasks.length === 0) {
    return 0;
  }

  const completedCount = todayTasks.filter((task) => task.status === TaskStatus.DONE).length;
  return completedCount / todayTasks.length;
}

export function getTaskStreak(tasks: Task[]) {
  const completedDays = new Set(
    tasks
      .filter((task) => task.status === TaskStatus.DONE)
      .map((task) => toDayKey(new Date(task.plannedDate))),
  );

  if (completedDays.size === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const sortedDays = Array.from(completedDays)
    .map((day) => new Date(day))
    .sort((left, right) => left.getTime() - right.getTime());

  let bestStreak = 1;
  let currentRun = 1;

  for (let index = 1; index < sortedDays.length; index += 1) {
    const previous = sortedDays[index - 1];
    const current = sortedDays[index];
    const diffInDays = Math.round((current.getTime() - previous.getTime()) / DAY_IN_MS);

    if (diffInDays === 1) {
      currentRun += 1;
      bestStreak = Math.max(bestStreak, currentRun);
      continue;
    }

    currentRun = 1;
  }

  let currentStreak = 0;
  let pointer = startOfDay(new Date());

  while (completedDays.has(toDayKey(pointer))) {
    currentStreak += 1;
    pointer = new Date(pointer.getTime() - DAY_IN_MS);
  }

  return {
    currentStreak,
    bestStreak,
  };
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toDayKey(date: Date) {
  return startOfDay(date).toISOString();
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

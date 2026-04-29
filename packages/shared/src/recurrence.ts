export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export type RecurrenceLike = RecurrenceType | `${RecurrenceType}`;

export interface TaskOccurrence {
  id: string;
  taskId: string;
  occurrenceDate: Date;
  status: string;
  completionPercent?: number;
  completedValue?: number;
  note?: string;
  completedDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RecurringTaskLike {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  status: string;
  type: string;
  plannedDate: Date;
  startTime?: string;
  endTime?: string;
  estimatedMinutes?: number;
  targetValue?: number;
  completedValue?: number;
  targetUnit?: string;
  source: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
  recurrenceType?: RecurrenceLike;
  recurrenceDaysOfWeek?: number[];
  recurrenceEndDate?: Date;
  occurrences?: TaskOccurrence[];
}

export interface RecurringAvailabilityLike {
  id: string;
  userId: string;
  type: string;
  dayOfWeek: number;
  startDate?: Date;
  startTime: string;
  endTime: string;
  label?: string;
  recurrenceType?: RecurrenceLike;
  recurrenceDaysOfWeek?: number[];
  recurrenceEndDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RecurringOccurrenceMeta {
  isRecurringInstance?: boolean;
  seriesId?: string;
  occurrenceDate?: Date;
}

export function expandTasksForRange<T extends RecurringTaskLike>(
  tasks: T[],
  from: Date,
  to: Date,
): Array<T & RecurringOccurrenceMeta> {
  const normalizedFrom = startOfDay(from);
  const normalizedTo = startOfDay(to);
  const expanded: Array<T & RecurringOccurrenceMeta> = [];

  for (const task of tasks) {
    const recurrenceType = task.recurrenceType ?? RecurrenceType.NONE;

    if (recurrenceType === RecurrenceType.NONE) {
      if (isDateWithinRange(task.plannedDate, normalizedFrom, normalizedTo)) {
        expanded.push(task);
      }
      continue;
    }

    for (const occurrenceDate of expandDatesForRule(
      task.plannedDate,
      recurrenceType,
      task.recurrenceDaysOfWeek ?? [],
      task.recurrenceEndDate,
      normalizedFrom,
      normalizedTo,
    )) {
      const occurrenceOverride = task.occurrences?.find(
        (occurrence) => isSameDay(occurrence.occurrenceDate, occurrenceDate),
      );

      expanded.push({
        ...task,
        id: buildOccurrenceId(task.id, occurrenceDate),
        status: occurrenceOverride?.status ?? 'todo',
        completedValue: occurrenceOverride?.completedValue ?? task.completedValue,
        occurrenceDate,
        isRecurringInstance: true,
        seriesId: task.id,
      });
    }
  }

  return expanded.sort(compareExpandedTasks);
}

export function expandAvailabilityForRange<T extends RecurringAvailabilityLike>(
  availability: T[],
  from: Date,
  to: Date,
): Array<T & RecurringOccurrenceMeta> {
  const normalizedFrom = startOfDay(from);
  const normalizedTo = startOfDay(to);
  const expanded: Array<T & RecurringOccurrenceMeta> = [];

  for (const slot of availability) {
    const recurrenceType = slot.recurrenceType ?? RecurrenceType.WEEKLY;
    const anchorDate = slot.startDate ?? nextDateForDayOfWeek(normalizedFrom, slot.dayOfWeek);

    if (recurrenceType === RecurrenceType.NONE) {
      if (isDateWithinRange(anchorDate, normalizedFrom, normalizedTo)) {
        expanded.push({
          ...slot,
          occurrenceDate: anchorDate,
          isRecurringInstance: true,
          seriesId: slot.id,
        });
      }
      continue;
    }

    for (const occurrenceDate of expandDatesForRule(
      anchorDate,
      recurrenceType,
      slot.recurrenceDaysOfWeek?.length ? slot.recurrenceDaysOfWeek : [slot.dayOfWeek],
      slot.recurrenceEndDate,
      normalizedFrom,
      normalizedTo,
    )) {
      expanded.push({
        ...slot,
        id: buildOccurrenceId(slot.id, occurrenceDate),
        dayOfWeek: occurrenceDate.getDay(),
        occurrenceDate,
        isRecurringInstance: true,
        seriesId: slot.id,
      });
    }
  }

  return expanded.sort((left, right) => {
    const dayDiff = startOfDay(left.occurrenceDate ?? left.startDate ?? from).getTime()
      - startOfDay(right.occurrenceDate ?? right.startDate ?? from).getTime();

    if (dayDiff !== 0) {
      return dayDiff;
    }

    return left.startTime.localeCompare(right.startTime);
  });
}

export function buildDailyTaskNotificationBody<T extends Pick<RecurringTaskLike, 'title'>>(
  tasks: T[],
) {
  const visibleTasks = tasks.slice(0, 3);
  const lines = visibleTasks.map((task, index) => `${index + 1}. ${task.title}`);
  const remainingCount = Math.max(0, tasks.length - visibleTasks.length);

  if (remainingCount > 0) {
    lines.push(`+${remainingCount} more task${remainingCount === 1 ? '' : 's'}`);
  }

  return lines.join('\n');
}

export function getIncompleteUnscheduledTasksForDay<T extends RecurringTaskLike>(
  tasks: T[],
  date: Date,
) {
  return expandTasksForRange(tasks, date, date)
    .filter((task) => !task.startTime && !task.endTime && task.status !== 'done')
    .sort((left, right) => {
      const createdDiff = (left.createdAt?.getTime() ?? 0) - (right.createdAt?.getTime() ?? 0);

      if (createdDiff !== 0) {
        return createdDiff;
      }

      return left.title.localeCompare(right.title);
    });
}

export function getRecurrenceLabel(recurrenceType?: RecurrenceLike) {
  switch (normalizeRecurrenceType(recurrenceType)) {
    case RecurrenceType.DAILY:
      return 'Repeats daily';
    case RecurrenceType.WEEKLY:
      return 'Repeats weekly';
    case RecurrenceType.MONTHLY:
      return 'Repeats monthly';
    case RecurrenceType.YEARLY:
      return 'Repeats yearly';
    case RecurrenceType.NONE:
    default:
      return 'Does not repeat';
  }
}

export function isSameDay(left: Date, right: Date) {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function compareExpandedTasks(left: RecurringTaskLike & RecurringOccurrenceMeta, right: RecurringTaskLike & RecurringOccurrenceMeta) {
  const leftDate = left.occurrenceDate ?? left.plannedDate;
  const rightDate = right.occurrenceDate ?? right.plannedDate;
  const dayDiff = leftDate.getTime() - rightDate.getTime();

  if (dayDiff !== 0) {
    return dayDiff;
  }

  const leftHasTime = Boolean(left.startTime && left.endTime);
  const rightHasTime = Boolean(right.startTime && right.endTime);

  if (leftHasTime && rightHasTime) {
    const timeDiff = left.startTime!.localeCompare(right.startTime!);

    if (timeDiff !== 0) {
      return timeDiff;
    }
  } else if (leftHasTime !== rightHasTime) {
    return leftHasTime ? -1 : 1;
  }

  const orderDiff = left.order - right.order;

  if (orderDiff !== 0) {
    return orderDiff;
  }

  return (left.createdAt?.getTime() ?? 0) - (right.createdAt?.getTime() ?? 0);
}

function expandDatesForRule(
  anchorDate: Date,
  recurrenceType: RecurrenceLike,
  recurrenceDaysOfWeek: number[],
  recurrenceEndDate: Date | undefined,
  from: Date,
  to: Date,
) {
  const dates: Date[] = [];
  const endDate = recurrenceEndDate ? startOfDay(recurrenceEndDate) : to;
  const safeEnd = endDate.getTime() < to.getTime() ? endDate : to;

  if (safeEnd.getTime() < from.getTime()) {
    return dates;
  }

  switch (normalizeRecurrenceType(recurrenceType)) {
    case RecurrenceType.DAILY: {
      let pointer = maxDate(startOfDay(anchorDate), from);

      while (pointer.getTime() <= safeEnd.getTime()) {
        dates.push(new Date(pointer));
        pointer.setDate(pointer.getDate() + 1);
      }
      return dates;
    }
    case RecurrenceType.WEEKLY: {
      const weeklyDays = recurrenceDaysOfWeek.length ? recurrenceDaysOfWeek : [anchorDate.getDay()];
      let pointer = new Date(from);

      while (pointer.getTime() <= safeEnd.getTime()) {
        if (pointer.getTime() >= startOfDay(anchorDate).getTime() && weeklyDays.includes(pointer.getDay())) {
          dates.push(new Date(pointer));
        }
        pointer.setDate(pointer.getDate() + 1);
      }
      return dates;
    }
    case RecurrenceType.MONTHLY: {
      let pointer = createClampedDate(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate());

      while (pointer.getTime() < from.getTime()) {
        pointer = createClampedDate(pointer.getFullYear(), pointer.getMonth() + 1, anchorDate.getDate());
      }

      while (pointer.getTime() <= safeEnd.getTime()) {
        dates.push(new Date(pointer));
        pointer = createClampedDate(pointer.getFullYear(), pointer.getMonth() + 1, anchorDate.getDate());
      }
      return dates;
    }
    case RecurrenceType.YEARLY: {
      let pointer = createClampedDate(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate());

      while (pointer.getTime() < from.getTime()) {
        pointer = createClampedDate(pointer.getFullYear() + 1, anchorDate.getMonth(), anchorDate.getDate());
      }

      while (pointer.getTime() <= safeEnd.getTime()) {
        dates.push(new Date(pointer));
        pointer = createClampedDate(pointer.getFullYear() + 1, anchorDate.getMonth(), anchorDate.getDate());
      }
      return dates;
    }
    case RecurrenceType.NONE:
    default:
      return isDateWithinRange(anchorDate, from, safeEnd) ? [startOfDay(anchorDate)] : [];
  }
}

function buildOccurrenceId(seriesId: string, occurrenceDate: Date) {
  const year = occurrenceDate.getFullYear();
  const month = `${occurrenceDate.getMonth() + 1}`.padStart(2, '0');
  const day = `${occurrenceDate.getDate()}`.padStart(2, '0');

  return `${seriesId}::${year}-${month}-${day}`;
}

function isDateWithinRange(date: Date, from: Date, to: Date) {
  const normalizedDate = startOfDay(date).getTime();
  return normalizedDate >= from.getTime() && normalizedDate <= to.getTime();
}

function maxDate(left: Date, right: Date) {
  return left.getTime() >= right.getTime() ? new Date(left) : new Date(right);
}

function nextDateForDayOfWeek(anchor: Date, dayOfWeek: number) {
  const nextDate = new Date(anchor);
  const diff = (dayOfWeek - anchor.getDay() + 7) % 7;
  nextDate.setDate(anchor.getDate() + diff);
  return startOfDay(nextDate);
}

function createClampedDate(year: number, month: number, day: number) {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDayOfMonth));
}

function normalizeRecurrenceType(recurrenceType?: RecurrenceLike) {
  return (recurrenceType ?? RecurrenceType.NONE) as RecurrenceType;
}

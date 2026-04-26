import { AvailabilitySlot, AvailabilityType, Task, TaskStatus } from '@packages/shared';

export const PLANNER_START_HOUR = 6;
export const PLANNER_END_HOUR = 24;
export const TIMELINE_MINUTE_HEIGHT = 1.2;
export const TIMELINE_HOUR_HEIGHT = 60 * TIMELINE_MINUTE_HEIGHT;

export function isSameDay(left: Date, right: Date) {
  return left.toDateString() === right.toDateString();
}

export function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map((value) => Number.parseInt(value, 10));
  return hours * 60 + minutes;
}

export function formatTimeLabel(time: string) {
  return time;
}

export function minutesToTime(minutes: number) {
  const normalized = Math.max(0, Math.min(minutes, 23 * 60 + 59));
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;

  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function addMinutesToTime(time: string, minutesToAdd: number) {
  return minutesToTime(parseTimeToMinutes(time) + minutesToAdd);
}

export function getSuggestedPlannerStartTime(selectedDate: Date) {
  const now = new Date();

  if (!isSameDay(selectedDate, now)) {
    return '09:00';
  }

  const nextHour = Math.max(PLANNER_START_HOUR, Math.min(PLANNER_END_HOUR - 1, now.getHours() + 1));
  return `${nextHour.toString().padStart(2, '0')}:00`;
}

export function getTimelineTopOffset(time: string) {
  return (parseTimeToMinutes(time) - PLANNER_START_HOUR * 60) * TIMELINE_MINUTE_HEIGHT;
}

export function getTimelineHeight(startTime: string, endTime: string) {
  return Math.max(
    32,
    (parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime)) * TIMELINE_MINUTE_HEIGHT,
  );
}

export function getTasksForDate(tasks: Task[], date: Date) {
  return tasks.filter((task) => isSameDay(task.plannedDate, date));
}

export function getScheduledTasks(tasks: Task[]) {
  return tasks
    .filter((task) => task.startTime && task.endTime)
    .sort((left, right) => {
      const timeDiff = parseTimeToMinutes(left.startTime!) - parseTimeToMinutes(right.startTime!);

      if (timeDiff !== 0) {
        return timeDiff;
      }

      return left.order - right.order;
    });
}

export function getUnscheduledTasks(tasks: Task[]) {
  return tasks.filter((task) => !task.startTime || !task.endTime);
}

export function getAvailabilityForDate(availability: AvailabilitySlot[], date: Date) {
  return availability
    .filter((slot) => slot.dayOfWeek === date.getDay())
    .sort((left, right) => parseTimeToMinutes(left.startTime) - parseTimeToMinutes(right.startTime));
}

export function getAvailabilityLabel(slot: AvailabilitySlot) {
  if (slot.label?.trim()) {
    return slot.label.trim();
  }

  switch (slot.type) {
    case AvailabilityType.AVAILABLE:
      return 'Available';
    case AvailabilityType.BLOCKED:
      return 'Blocked';
    case AvailabilityType.SLEEP:
      return 'Sleep';
    case AvailabilityType.EATING:
      return 'Eating';
    case AvailabilityType.WORK:
      return 'Work';
    case AvailabilityType.STUDY:
      return 'Study';
    case AvailabilityType.CUSTOM:
      return 'Custom';
    default:
      return 'Block';
  }
}

export function getTaskStatusColor(status: TaskStatus) {
  switch (status) {
    case TaskStatus.DONE:
      return '#10B981';
    case TaskStatus.PARTIAL:
      return '#F59E0B';
    case TaskStatus.FAILED:
      return '#EF4444';
    case TaskStatus.IN_PROGRESS:
      return '#3B82F6';
    case TaskStatus.TODO:
    default:
      return '#6B7280';
  }
}

export function getAvailabilityColor(type: AvailabilityType) {
  switch (type) {
    case AvailabilityType.SLEEP:
      return '#2563EB';
    case AvailabilityType.EATING:
      return '#F97316';
    case AvailabilityType.WORK:
      return '#10B981';
    case AvailabilityType.STUDY:
      return '#8B5CF6';
    case AvailabilityType.BLOCKED:
      return '#EF4444';
    case AvailabilityType.CUSTOM:
      return '#06B6D4';
    case AvailabilityType.AVAILABLE:
    default:
      return '#1F2937';
  }
}

export function getDayScheduleDensity(tasks: Task[]) {
  const scheduledMinutes = getScheduledTasks(tasks).reduce((total, task) => {
    if (!task.startTime || !task.endTime) {
      return total;
    }

    return total + (parseTimeToMinutes(task.endTime) - parseTimeToMinutes(task.startTime));
  }, 0);

  return Math.min(100, Math.round((scheduledMinutes / (12 * 60)) * 100));
}

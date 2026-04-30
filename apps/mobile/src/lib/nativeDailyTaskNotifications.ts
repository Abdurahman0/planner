import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import {
  getIncompleteUnscheduledTasksForDay,
  type Task,
} from '@packages/shared';
import DailyTaskNotificationsModule, {
  type DailyTaskNotificationActionPayload,
  type DailyTaskNotificationInput,
} from '@/modules/daily-task-notifications';

export const DAILY_TASKS_NOTIFICATION_KIND = 'daily_tasks';

type DailyTaskSyncPayload = {
  notificationKind?: unknown;
  mode?: unknown;
  notificationKey?: unknown;
  displayTitle?: unknown;
  tasks?: unknown;
  moreCount?: unknown;
};

type NativeTaskPreview = {
  id: string;
  title: string;
  occurrenceDate?: string | null;
};

export function supportsNativeDailyTaskNotifications() {
  return Platform.OS === 'android';
}

export async function syncNativeDailyTaskNotificationFromTasks(
  userId: string,
  tasks: Task[],
) {
  if (!supportsNativeDailyTaskNotifications()) {
    return;
  }

  const incompleteDailyTasks = getIncompleteUnscheduledTasksForDay(tasks, new Date());
  const notificationKey = buildDailyTaskNotificationKey(userId, new Date());

  if (incompleteDailyTasks.length === 0) {
    await DailyTaskNotificationsModule.cancelDailyTaskNotification(notificationKey);
    return;
  }

  const visibleTasks = incompleteDailyTasks.slice(0, 3).map(toNativeTaskPreview);
  await DailyTaskNotificationsModule.showDailyTaskNotification(
    JSON.stringify({
      notificationKey,
      title: 'Daily Tasks',
      tasks: visibleTasks,
      moreCount: Math.max(0, incompleteDailyTasks.length - visibleTasks.length),
      openPlannerUrl: buildPlannerUrl(),
    } satisfies DailyTaskNotificationInput),
  );
}

export async function cancelNativeDailyTaskNotificationForUser(userId: string) {
  if (!supportsNativeDailyTaskNotifications()) {
    return;
  }

  await DailyTaskNotificationsModule.cancelDailyTaskNotification(
    buildDailyTaskNotificationKey(userId, new Date()),
  );
}

export async function applyNativeDailyTaskNotificationPayload(data: unknown) {
  if (!supportsNativeDailyTaskNotifications()) {
    return;
  }

  const payload = normalizeDailyTaskSyncPayload(data);

  if (!payload) {
    return;
  }

  if (payload.mode === 'cancel') {
    await DailyTaskNotificationsModule.cancelDailyTaskNotification(payload.notificationKey);
    return;
  }

  await DailyTaskNotificationsModule.showDailyTaskNotification(
    JSON.stringify({
      notificationKey: payload.notificationKey,
      title: payload.displayTitle,
      tasks: payload.tasks,
      moreCount: payload.moreCount,
      openPlannerUrl: buildPlannerUrl(),
    } satisfies DailyTaskNotificationInput),
  );
}

export async function getPendingNativeDailyTaskActionsAsync() {
  if (!supportsNativeDailyTaskNotifications()) {
    return [] as DailyTaskNotificationActionPayload[];
  }

  try {
    const raw = await DailyTaskNotificationsModule.getPendingActionsAsync();
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return [];
      }

      const action = item as Record<string, unknown>;
      const id = typeof action.id === 'string' ? action.id : null;
      const notificationKey = typeof action.notificationKey === 'string' ? action.notificationKey : null;
      const taskId = typeof action.taskId === 'string' ? action.taskId : null;

      if (!id || !notificationKey || !taskId) {
        return [];
      }

      return [{
        id,
        notificationKey,
        taskId,
        occurrenceDate: typeof action.occurrenceDate === 'string' ? action.occurrenceDate : undefined,
      }];
    });
  } catch {
    return [];
  }
}

export async function removePendingNativeDailyTaskActionsAsync(actionIds: string[]) {
  if (!supportsNativeDailyTaskNotifications() || actionIds.length === 0) {
    return;
  }

  await DailyTaskNotificationsModule.removePendingActionsAsync(actionIds);
}

export function addNativeDailyTaskActionListener(
  listener: (payload: DailyTaskNotificationActionPayload) => void,
) {
  if (!supportsNativeDailyTaskNotifications()) {
    return () => undefined;
  }

  const subscription = DailyTaskNotificationsModule.addListener('onActionPressed', listener);
  return () => {
    subscription.remove();
  };
}

function buildDailyTaskNotificationKey(userId: string, date: Date) {
  return `daily_tasks_${userId}_${date.toISOString().slice(0, 10)}`;
}

function buildPlannerUrl() {
  return Linking.createURL('/calendar');
}

function toNativeTaskPreview(task: Task): NativeTaskPreview {
  return {
    id: task.seriesId ?? task.id,
    title: task.title,
    occurrenceDate: task.occurrenceDate?.toISOString() ?? null,
  };
}

function normalizeDailyTaskSyncPayload(data: unknown) {
  const payload = normalizeObject(data);

  if (!payload || payload.notificationKind !== DAILY_TASKS_NOTIFICATION_KIND) {
    return null;
  }

  const notificationKey = typeof payload.notificationKey === 'string' ? payload.notificationKey : null;

  if (!notificationKey) {
    return null;
  }

  const tasksSource = Array.isArray(payload.tasks) ? payload.tasks : [];
  const tasks = tasksSource.flatMap((item) => {
    const task = normalizeObject(item);

    if (!task) {
      return [];
    }

    const id = typeof task.id === 'string' ? task.id : null;
    const title = typeof task.label === 'string' ? task.label : null;

    if (!id || !title) {
      return [];
    }

    return [{
      id,
      title,
      occurrenceDate: typeof task.occurrenceDate === 'string' ? task.occurrenceDate : null,
    }];
  });

  return {
    notificationKey,
    displayTitle: typeof payload.displayTitle === 'string' ? payload.displayTitle : 'Daily Tasks',
    mode: payload.mode === 'cancel' ? 'cancel' : 'upsert',
    tasks,
    moreCount: typeof payload.moreCount === 'number' ? Math.max(0, payload.moreCount) : 0,
  };
}

function normalizeObject(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

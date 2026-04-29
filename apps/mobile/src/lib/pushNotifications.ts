import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {
  buildDailyTaskNotificationBody,
  getIncompleteUnscheduledTasksForDay,
  NotificationType,
  Task,
} from '@packages/shared';

export const PLANNER_REMINDERS_CHANNEL_ID = 'planner-reminders';
export const PLANNER_NOTIFICATION_ACCENT = '#A855F7';
export const NOTIFICATION_PERMISSION_MESSAGE = 'Enable notifications to receive planner reminders and streak updates.';
export const DAILY_TASKS_NOTIFICATION_KIND = 'daily_tasks';

let lastDailyTaskNotificationSignature: string | null = null;

export interface PushRegistrationResult {
  permissionStatus: 'granted' | 'denied' | 'unavailable';
  projectIdPresent: boolean;
  tokenCreated: boolean;
  registrationError?: string;
  registration?: {
    token: string;
    platform: 'ios' | 'android' | 'expo';
  };
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function configurePushNotificationsAsync() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(PLANNER_REMINDERS_CHANNEL_ID, {
    name: 'Planner reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 150, 250],
    enableVibrate: true,
    enableLights: true,
    lightColor: PLANNER_NOTIFICATION_ACCENT,
    sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  if (Platform.OS === 'web') {
    return {
      permissionStatus: 'unavailable',
      projectIdPresent: false,
      tokenCreated: false,
      registrationError: 'Push notifications require a native mobile build.',
    };
  }

  if (!Device.isDevice) {
    return {
      permissionStatus: 'unavailable',
      projectIdPresent: false,
      tokenCreated: false,
      registrationError: 'Push notifications require a physical device, not an emulator or web preview.',
    };
  }

  await configurePushNotificationsAsync();

  const currentPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermissions.status;
  const canAskAgain = 'canAskAgain' in currentPermissions ? Boolean(currentPermissions.canAskAgain) : finalStatus === 'undetermined';
  devLog('Notification permission status', finalStatus);

  if (finalStatus !== 'granted' && canAskAgain) {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
    devLog('Notification permission request result', finalStatus);
  }

  if (finalStatus !== 'granted') {
    return {
      permissionStatus: 'denied',
      projectIdPresent: false,
      tokenCreated: false,
    };
  }

  try {
    const projectId = resolveExpoProjectId();
    const projectIdPresent = Boolean(projectId);
    devLog('Expo project id present', projectIdPresent);

    if (!projectId) {
      return {
        permissionStatus: 'granted',
        projectIdPresent: false,
        tokenCreated: false,
        registrationError: 'Push project ID is missing in the APK config.',
      };
    }

    const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
    const tokenCreated = isExpoPushToken(pushToken.data);
    devLog('Expo push token created', tokenCreated);

    return {
      permissionStatus: 'granted',
      projectIdPresent,
      tokenCreated,
      ...(tokenCreated ? {} : { registrationError: 'Expo returned an invalid push token.' }),
      ...(tokenCreated ? {
      registration: {
        token: pushToken.data,
        platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'expo',
      },
      } : {}),
    };
  } catch (error) {
    devLog('Expo push token creation failed', true);
    return {
      permissionStatus: 'granted',
      projectIdPresent: Boolean(resolveExpoProjectId()),
      tokenCreated: false,
      registrationError: extractSafePushError(error),
    };
  }
}

function resolveExpoProjectId() {
  const expoProjectId = Constants.expoConfig?.extra?.eas?.projectId;
  const easProjectId = Constants.easConfig?.projectId;
  const processEnv = typeof process !== 'undefined'
    ? process.env?.EXPO_PUBLIC_EXPO_PROJECT_ID ?? process.env?.VITE_EXPO_PROJECT_ID
    : undefined;

  if (typeof expoProjectId === 'string' && expoProjectId.trim()) {
    return expoProjectId;
  }

  if (typeof easProjectId === 'string' && easProjectId.trim()) {
    return easProjectId;
  }

  return processEnv ?? undefined;
}

export async function syncDailyTaskNotificationAsync(tasks: Task[], now = new Date()) {
  if (Platform.OS === 'web' || !Device.isDevice) {
    return;
  }

  const presentedNotifications = await getPresentedDailyTaskNotificationsAsync();
  const permissions = await Notifications.getPermissionsAsync();

  if (permissions.status !== 'granted') {
    await dismissPresentedNotificationsAsync(presentedNotifications);
    lastDailyTaskNotificationSignature = null;
    return;
  }

  const dailyTasks = getIncompleteUnscheduledTasksForDay(tasks, now);

  if (dailyTasks.length === 0) {
    await dismissPresentedNotificationsAsync(presentedNotifications);
    lastDailyTaskNotificationSignature = null;
    return;
  }

  const body = buildDailyTaskNotificationBody(dailyTasks);
  const firstTask = dailyTasks[0];
  const signature = [
    now.toDateString(),
    ...dailyTasks.map((task) => `${task.seriesId ?? task.id}:${task.status}:${(task.occurrenceDate ?? task.plannedDate).toISOString()}`),
  ].join('|');

  if (signature === lastDailyTaskNotificationSignature && presentedNotifications.length > 0) {
    return;
  }

  await dismissPresentedNotificationsAsync(presentedNotifications);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily tasks',
      body,
      sound: 'default',
      data: {
        type: NotificationType.SYSTEM,
        notificationKind: DAILY_TASKS_NOTIFICATION_KIND,
        taskId: firstTask.seriesId ?? firstTask.id,
        occurrenceDate: (firstTask.occurrenceDate ?? firstTask.plannedDate).toISOString(),
      },
    },
    trigger: null,
  });

  lastDailyTaskNotificationSignature = signature;
}

async function getPresentedDailyTaskNotificationsAsync() {
  const presentedNotifications = await Notifications.getPresentedNotificationsAsync();

  return presentedNotifications.filter((notification) => {
    const data = notification.request.content.data;
    return Boolean(
      data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      'notificationKind' in data &&
      data.notificationKind === DAILY_TASKS_NOTIFICATION_KIND,
    );
  });
}

async function dismissPresentedNotificationsAsync(
  notifications: Array<{ request: { identifier: string } }>,
) {
  await Promise.allSettled(
    notifications.map((notification) =>
      Notifications.dismissNotificationAsync(notification.request.identifier),
    ),
  );
}

function isExpoPushToken(token: string) {
  return /^(ExponentPushToken|ExpoPushToken)\[[^\]\s]+\]$/.test(token);
}

function extractSafePushError(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    const message = error.message.trim();

    if (message.includes('Default FirebaseApp is not initialized')) {
      return 'Android Firebase/FCM is not initialized in this APK. Add google-services.json for com.aiplanner.mobile and configure FCM V1 credentials in EAS.';
    }

    return message;
  }

  return 'Unable to create an Expo push token on this device.';
}

function devLog(label: string, value: unknown) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(`[push] ${label}:`, value);
  }
}

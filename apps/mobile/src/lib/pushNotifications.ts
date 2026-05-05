import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import {
  applyNativeDailyTaskNotificationPayload,
  DAILY_TASKS_NOTIFICATION_KIND,
} from './nativeDailyTaskNotifications';

export const PLANNER_HIGH_PRIORITY_CHANNEL_ID = 'planner-high-priority';
export const PLANNER_REMINDERS_CHANNEL_ID = 'planner-reminders';
export const PLANNER_LOW_PRIORITY_CHANNEL_ID = 'planner-low-priority';
export const PLANNER_NOTIFICATION_ACCENT = '#A855F7';
export const NOTIFICATION_PERMISSION_MESSAGE = 'Enable notifications to receive planner reminders and streak updates.';

const BACKGROUND_NOTIFICATION_TASK_NAME = 'planner-background-notification-task';

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

if (TaskManager.isTaskDefined && !TaskManager.isTaskDefined(BACKGROUND_NOTIFICATION_TASK_NAME)) {
  TaskManager.defineTask<Notifications.NotificationTaskPayload>(
    BACKGROUND_NOTIFICATION_TASK_NAME,
    async ({ data, error }) => {
      if (error) {
        return;
      }

      const payload = extractBackgroundNotificationData(data);

      if (!isDailyTaskPayload(payload)) {
        return;
      }

      try {
        await applyNativeDailyTaskNotificationPayload(payload);
      } catch {
        // Headless daily-task sync is best-effort.
      }
    },
  );
}

export async function initializeNotificationRuntimeAsync() {
  await configurePushNotificationsAsync();

  if (Platform.OS === 'web') {
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK_NAME);

    if (!isRegistered) {
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK_NAME);
    }
  } catch {
    // Background notification actions are best-effort and must not crash startup.
  }
}

export async function configurePushNotificationsAsync() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(PLANNER_HIGH_PRIORITY_CHANNEL_ID, {
    name: 'High priority tasks',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 400, 250, 400, 250, 600],
    enableVibrate: true,
    enableLights: true,
    lightColor: PLANNER_NOTIFICATION_ACCENT,
    sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });

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

  await Notifications.setNotificationChannelAsync(PLANNER_LOW_PRIORITY_CHANNEL_ID, {
    name: 'Low priority tasks',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 120],
    enableVibrate: false,
    enableLights: false,
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

  await initializeNotificationRuntimeAsync();

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
      ...(tokenCreated
        ? {
            registration: {
              token: pushToken.data,
              platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'expo',
            },
          }
        : {}),
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

function isExpoPushToken(token: string) {
  return /^(ExponentPushToken|ExpoPushToken)\[[^\]\s]+\]$/.test(token);
}

export function isDailyTasksNotificationData(data: unknown) {
  return Boolean(
    data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      (('type' in data && data.type === DAILY_TASKS_NOTIFICATION_KIND) ||
        ('notificationKind' in data && data.notificationKind === DAILY_TASKS_NOTIFICATION_KIND)),
  );
}

function extractBackgroundNotificationData(taskPayload: Notifications.NotificationTaskPayload) {
  if ('actionIdentifier' in taskPayload) {
    return null;
  }

  const dataString = typeof taskPayload.data?.dataString === 'string'
    ? taskPayload.data.dataString
    : null;

  if (dataString) {
    try {
      return JSON.parse(dataString) as unknown;
    } catch {
      return null;
    }
  }

  return taskPayload.data ?? null;
}

function isDailyTaskPayload(data: unknown) {
  return Boolean(
    data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      'notificationKind' in data &&
      data.notificationKind === DAILY_TASKS_NOTIFICATION_KIND,
  );
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

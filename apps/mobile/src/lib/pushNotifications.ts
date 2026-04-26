import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

export const PLANNER_REMINDERS_CHANNEL_ID = 'planner-reminders';
export const PLANNER_NOTIFICATION_ACCENT = '#A855F7';
export const NOTIFICATION_PERMISSION_MESSAGE = 'Enable notifications to receive planner reminders and streak updates.';

export interface PushRegistrationResult {
  permissionStatus: 'granted' | 'denied' | 'unavailable';
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
  });
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  if (Platform.OS === 'web') {
    return {
      permissionStatus: 'unavailable',
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
    };
  }

  try {
    const projectId = resolveExpoProjectId();
    const pushToken = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    devLog('Expo push token created', Boolean(pushToken.data));

    return {
      permissionStatus: 'granted',
      registration: {
        token: pushToken.data,
        platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'expo',
      },
    };
  } catch {
    devLog('Expo push token creation failed', true);
    return {
      permissionStatus: 'granted',
    };
  }
}

function resolveExpoProjectId() {
  const expoProjectId = Constants.expoConfig?.extra?.eas?.projectId;
  const processEnv = typeof process !== 'undefined'
    ? process.env?.EXPO_PUBLIC_EXPO_PROJECT_ID ?? process.env?.VITE_EXPO_PROJECT_ID
    : undefined;

  return typeof expoProjectId === 'string' ? expoProjectId : processEnv ?? undefined;
}

function devLog(label: string, value: unknown) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(`[push] ${label}:`, value);
  }
}

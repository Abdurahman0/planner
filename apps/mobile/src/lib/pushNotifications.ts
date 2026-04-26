import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

export const PLANNER_REMINDERS_CHANNEL_ID = 'planner-reminders';
export const PLANNER_NOTIFICATION_ACCENT = '#A855F7';

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

export async function registerForPushNotificationsAsync(): Promise<{
  token: string;
  platform: 'ios' | 'android' | 'expo';
} | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  await configurePushNotificationsAsync();

  const currentPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermissions.status;

  if (finalStatus !== 'granted') {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    const projectId = resolveExpoProjectId();
    const pushToken = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return {
      token: pushToken.data,
      platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'expo',
    };
  } catch {
    return null;
  }
}

function resolveExpoProjectId() {
  const expoProjectId = Constants.expoConfig?.extra?.eas?.projectId;
  const processEnv = typeof process !== 'undefined'
    ? process.env?.EXPO_PUBLIC_EXPO_PROJECT_ID ?? process.env?.VITE_EXPO_PROJECT_ID
    : undefined;

  return typeof expoProjectId === 'string' ? expoProjectId : processEnv ?? undefined;
}

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<{
  token: string;
  platform: 'ios' | 'android' | 'expo';
} | null> {
  if (Platform.OS === 'web') {
    return null;
  }

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
  const processEnv = typeof process !== 'undefined'
    ? process.env?.EXPO_PUBLIC_EXPO_PROJECT_ID ?? process.env?.VITE_EXPO_PROJECT_ID
    : undefined;

  return processEnv ?? undefined;
}

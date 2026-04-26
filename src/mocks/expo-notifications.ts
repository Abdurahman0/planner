type NotificationPermissionsStatus = 'granted' | 'denied' | 'undetermined';

export const AndroidImportance = {
  HIGH: 4,
};

export function setNotificationHandler() {
  return undefined;
}

export async function setNotificationChannelAsync() {
  return undefined;
}

export async function getPermissionsAsync() {
  return {
    status: resolvePermissionStatus(),
  };
}

export async function requestPermissionsAsync() {
  return {
    status: resolvePermissionStatus(),
  };
}

export async function getExpoPushTokenAsync() {
  return {
    data: '',
  };
}

export function addNotificationResponseReceivedListener() {
  return {
    remove() {
      return undefined;
    },
  };
}

export function addNotificationReceivedListener() {
  return {
    remove() {
      return undefined;
    },
  };
}

export async function getLastNotificationResponseAsync() {
  return null;
}

function resolvePermissionStatus(): NotificationPermissionsStatus {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (window.Notification.permission === 'granted') {
      return 'granted';
    }

    if (window.Notification.permission === 'denied') {
      return 'denied';
    }
  }

  return 'undetermined';
}

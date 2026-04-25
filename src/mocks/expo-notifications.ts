type NotificationPermissionsStatus = 'granted' | 'denied' | 'undetermined';

export function setNotificationHandler() {
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

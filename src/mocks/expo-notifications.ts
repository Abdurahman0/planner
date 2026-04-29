type NotificationPermissionsStatus = 'granted' | 'denied' | 'undetermined';

const presentedNotifications: Array<{
  request: {
    identifier: string;
    content: {
      data?: Record<string, unknown>;
    };
  };
}> = [];

export const AndroidImportance = {
  HIGH: 4,
};

export const AndroidNotificationVisibility = {
  PUBLIC: 1,
};

export function setNotificationHandler() {
  return undefined;
}

export async function setNotificationChannelAsync() {
  return undefined;
}

export async function setNotificationCategoryAsync() {
  return undefined;
}

export async function getPermissionsAsync() {
  return {
    status: resolvePermissionStatus(),
    canAskAgain: resolvePermissionStatus() === 'undetermined',
  };
}

export async function requestPermissionsAsync() {
  return {
    status: resolvePermissionStatus(),
    canAskAgain: resolvePermissionStatus() === 'undetermined',
  };
}

export async function getExpoPushTokenAsync() {
  return {
    data: '',
  };
}

export async function scheduleNotificationAsync(input: {
  content?: {
    data?: Record<string, unknown>;
  };
}) {
  const identifier = `web-notification-${presentedNotifications.length + 1}`;
  presentedNotifications.push({
    request: {
      identifier,
      content: {
        data: input.content?.data,
      },
    },
  });
  return identifier;
}

export async function getPresentedNotificationsAsync() {
  return presentedNotifications;
}

export async function dismissNotificationAsync(identifier: string) {
  const index = presentedNotifications.findIndex((notification) => notification.request.identifier === identifier);

  if (index >= 0) {
    presentedNotifications.splice(index, 1);
  }
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

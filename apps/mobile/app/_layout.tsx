import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { SystemBars } from 'react-native-edge-to-edge';
import { useAppBootstrap } from '../src/hooks/useAppBootstrap';
import { NotificationType, TaskStatus } from '@packages/shared';
import { useStore } from '../src/store/useStore';
import {
  COMPLETE_FIRST_DAILY_TASK_ACTION_ID,
  DAILY_TASKS_NOTIFICATION_KIND,
  isDailyTasksNotificationData,
  syncDailyTaskNotificationAsync,
} from '../src/lib/pushNotifications';

const queryClient = new QueryClient();
const APP_BACKGROUND_COLOR = '#000000';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppShell />
    </SafeAreaProvider>
  );
}

function AppShell() {
  useAppBootstrap();
  const notificationPermissionNotice = useStore((state) => state.notificationPermissionNotice);
  const clearNotificationPermissionNotice = useStore((state) => state.clearNotificationPermissionNotice);
  const tasks = useStore((state) => state.tasks);
  const user = useStore((state) => state.user);
  const isInitialized = useStore((state) => state.isInitialized);
  useNotificationRouting();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    void syncDailyTaskNotificationAsync(user ? tasks : []);
  }, [isInitialized, tasks, user]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={DarkTheme}>
        <View style={styles.container}>
          <SystemBars style={{ statusBar: 'light', navigationBar: 'light' }} />
          <Stack screenOptions={{ headerShown: false, contentStyle: styles.container }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" />
          </Stack>
          {notificationPermissionNotice ? (
            <View style={[styles.noticeBanner, { top: insets.top + 12 }]}>
              <Text style={styles.noticeTitle}>Notifications are off</Text>
              <Text style={styles.noticeBody}>{notificationPermissionNotice}</Text>
              <TouchableOpacity onPress={clearNotificationPermissionNotice}>
                <Text style={styles.noticeAction}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

type NotificationNavigationTarget = {
  route: '/auth' | '/(tabs)/calendar' | '/(tabs)/profile' | `/goals/${string}`;
  notificationId?: string;
};

type PendingNotificationAction = {
  kind: 'complete-first-daily-task';
  taskId: string;
  occurrenceDate?: Date;
  notificationId?: string;
};

function useNotificationRouting() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const isInitialized = useStore((state) => state.isInitialized);
  const fetchNotifications = useStore((state) => state.fetchNotifications);
  const fetchNotificationSummary = useStore((state) => state.fetchNotificationSummary);
  const markNotificationRead = useStore((state) => state.markNotificationRead);
  const updateTaskStatus = useStore((state) => state.updateTaskStatus);
  const handledResponses = useRef(new Set<string>());
  const [pendingTarget, setPendingTarget] = useState<NotificationNavigationTarget | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingNotificationAction | null>(null);

  useEffect(() => {
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      if (!user) {
        return;
      }

      void Promise.allSettled([fetchNotifications(), fetchNotificationSummary()]);
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };

    function handleNotificationResponse(
      response: Notifications.NotificationResponse,
    ) {
      const action = resolveNotificationAction(response);
      const target = action ? null : resolveNotificationTarget(response);

      if (!target && !action) {
        return;
      }

      const handledKey = action?.notificationId ?? target?.notificationId ?? response.notification.request.identifier;

      if (handledResponses.current.has(handledKey)) {
        return;
      }

      handledResponses.current.add(handledKey);

      if (!isInitialized || !user) {
        if (action) {
          setPendingAction(action);
          return;
        }

        setPendingTarget(target);
        return;
      }

      if (action) {
        void completeNotificationAction(action);
        return;
      }

      if (target) {
        void completeNotificationNavigation(target);
      }
    }
  }, [
    fetchNotificationSummary,
    fetchNotifications,
    isInitialized,
    markNotificationRead,
    router,
    updateTaskStatus,
    user,
  ]);

  useEffect(() => {
    if (!pendingTarget || !isInitialized) {
      return;
    }

    if (!user) {
      router.replace('/auth');
      setPendingTarget(null);
      return;
    }

    void completeNotificationNavigation(pendingTarget).finally(() => {
      setPendingTarget(null);
    });
  }, [isInitialized, pendingTarget, router, user]);

  useEffect(() => {
    if (!pendingAction || !isInitialized || !user) {
      return;
    }

    void completeNotificationAction(pendingAction).finally(() => {
      setPendingAction(null);
    });
  }, [isInitialized, pendingAction, user]);

  async function completeNotificationNavigation(target: NotificationNavigationTarget) {
    if (target.notificationId) {
      await Promise.allSettled([
        markNotificationRead(target.notificationId),
        fetchNotifications(),
      ]);
    }

    router.push(target.route);
  }

  async function completeNotificationAction(action: PendingNotificationAction) {
    await updateTaskStatus(action.taskId, {
      status: TaskStatus.DONE,
      occurrenceDate: action.occurrenceDate,
    });

    if (action.notificationId) {
      await Promise.allSettled([
        markNotificationRead(action.notificationId),
        fetchNotifications(),
      ]);
    }
  }
}

function resolveNotificationTarget(
  response: Notifications.NotificationResponse,
): NotificationNavigationTarget | null {
  return resolveNotificationTargetFromData(response.notification.request.content.data);
}

function resolveNotificationAction(
  response: Notifications.NotificationResponse,
): PendingNotificationAction | null {
  if (response.actionIdentifier !== COMPLETE_FIRST_DAILY_TASK_ACTION_ID) {
    return null;
  }

  const data = response.notification.request.content.data;

  if (!isDailyTasksNotificationData(data) || !data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }

  const taskId = typeof data.firstTaskId === 'string'
    ? data.firstTaskId
    : typeof data.taskId === 'string'
      ? data.taskId
      : null;

  if (!taskId) {
    return null;
  }

  const occurrenceDate = typeof data.occurrenceDate === 'string'
    ? new Date(data.occurrenceDate)
    : undefined;
  const notificationId = typeof data.notificationId === 'string' ? data.notificationId : undefined;

  return {
    kind: 'complete-first-daily-task',
    taskId,
    occurrenceDate: occurrenceDate && !Number.isNaN(occurrenceDate.getTime()) ? occurrenceDate : undefined,
    notificationId,
  };
}

function resolveNotificationTargetFromData(
  data: unknown,
): NotificationNavigationTarget | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      route: '/(tabs)/calendar',
    };
  }

  const notificationData = data as {
    type?: string;
    notificationId?: unknown;
    goalId?: unknown;
    taskId?: unknown;
    notificationKind?: unknown;
  };

  const notificationId = typeof notificationData.notificationId === 'string'
    ? notificationData.notificationId
    : undefined;
  const goalId = typeof notificationData.goalId === 'string' ? notificationData.goalId : undefined;
  const taskId = typeof notificationData.taskId === 'string' ? notificationData.taskId : undefined;
  const type = typeof notificationData.type === 'string' ? notificationData.type : undefined;
  const notificationKind = typeof notificationData.notificationKind === 'string' ? notificationData.notificationKind : undefined;

  if (goalId) {
    return {
      route: `/goals/${goalId}`,
      notificationId,
    };
  }

  if (taskId) {
    return {
      route: '/(tabs)/calendar',
      notificationId,
    };
  }

  if (
    type === DAILY_TASKS_NOTIFICATION_KIND ||
    notificationKind === DAILY_TASKS_NOTIFICATION_KIND ||
    type === NotificationType.REMINDER ||
    type === NotificationType.SYSTEM
  ) {
    return {
      route: '/(tabs)/calendar',
      notificationId,
    };
  }

  return {
    route: '/(tabs)/profile',
    notificationId,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_BACKGROUND_COLOR,
  },
  noticeBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#151515',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  noticeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  noticeBody: {
    color: '#B3B3B3',
    fontSize: 13,
    lineHeight: 18,
  },
  noticeAction: {
    color: '#A855F7',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
});

import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { AppState, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { SystemBars } from 'react-native-edge-to-edge';
import { useAppBootstrap } from '../src/hooks/useAppBootstrap';
import { NotificationType, TaskStatus } from '@packages/shared';
import { useStore } from '../src/store/useStore';
import {
  addNativeDailyTaskActionListener,
  cancelNativeDailyTaskNotificationForUser,
  DAILY_TASKS_NOTIFICATION_KIND,
  getPendingNativeDailyTaskActionsAsync,
  removePendingNativeDailyTaskActionsAsync,
  syncNativeDailyTaskNotificationFromTasks,
} from '../src/lib/nativeDailyTaskNotifications';

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
  useNotificationRouting();
  useNativeDailyTaskNotifications();
  const insets = useSafeAreaInsets();

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

function useNotificationRouting() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const isInitialized = useStore((state) => state.isInitialized);
  const fetchNotifications = useStore((state) => state.fetchNotifications);
  const fetchNotificationSummary = useStore((state) => state.fetchNotificationSummary);
  const markNotificationRead = useStore((state) => state.markNotificationRead);
  const handledResponses = useRef(new Set<string>());
  const [pendingTarget, setPendingTarget] = useState<NotificationNavigationTarget | null>(null);

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
      if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
        return;
      }

      const target = resolveNotificationTarget(response);

      if (!target) {
        return;
      }

      const handledKey = target.notificationId ?? response.notification.request.identifier;

      if (handledResponses.current.has(handledKey)) {
        return;
      }

      handledResponses.current.add(handledKey);

      if (!isInitialized || !user) {
        setPendingTarget(target);
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

  async function completeNotificationNavigation(target: NotificationNavigationTarget) {
    if (target.notificationId) {
      await Promise.allSettled([
        markNotificationRead(target.notificationId),
        fetchNotifications(),
      ]);
    }

    router.push(target.route);
  }
}

function resolveNotificationTarget(
  response: Notifications.NotificationResponse,
): NotificationNavigationTarget | null {
  return resolveNotificationTargetFromData(response.notification.request.content.data);
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

function useNativeDailyTaskNotifications() {
  const isInitialized = useStore((state) => state.isInitialized);
  const user = useStore((state) => state.user);
  const tasks = useStore((state) => state.tasks);
  const updateTaskStatus = useStore((state) => state.updateTaskStatus);
  const lastUserIdRef = useRef<string | null>(null);
  const processingActionIds = useRef(new Set<string>());

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    if (lastUserIdRef.current && (!user || lastUserIdRef.current !== user.id)) {
      void cancelNativeDailyTaskNotificationForUser(lastUserIdRef.current);
    }

    lastUserIdRef.current = user?.id ?? null;

    if (!isInitialized || !user) {
      return;
    }

    void syncNativeDailyTaskNotificationFromTasks(user.id, tasks);
  }, [isInitialized, tasks, user]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !isInitialized || !user) {
      return;
    }

    let isMounted = true;

    const processAction = async (action: {
      id: string;
      taskId: string;
      occurrenceDate?: string | null;
    }) => {
      if (processingActionIds.current.has(action.id)) {
        return;
      }

      processingActionIds.current.add(action.id);

      try {
        await updateTaskStatus(action.taskId, {
          status: TaskStatus.DONE,
          occurrenceDate: action.occurrenceDate ? new Date(action.occurrenceDate) : undefined,
        });
        await removePendingNativeDailyTaskActionsAsync([action.id]);
      } catch {
        // Leave the action queued for the next authenticated resume.
      } finally {
        processingActionIds.current.delete(action.id);
      }
    };

    const flushPendingActions = async () => {
      const actions = await getPendingNativeDailyTaskActionsAsync();

      for (const action of actions) {
        if (!isMounted) {
          return;
        }

        await processAction(action);
      }
    };

    void flushPendingActions();

    const removeActionListener = addNativeDailyTaskActionListener((action) => {
      void processAction(action);
    });

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void flushPendingActions();
      }
    });

    return () => {
      isMounted = false;
      removeActionListener();
      appStateSubscription.remove();
    };
  }, [isInitialized, updateTaskStatus, user]);
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

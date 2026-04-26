import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { View, StyleSheet, Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import { useAppBootstrap } from '../src/hooks/useAppBootstrap';
import { NotificationType } from '@packages/shared';
import { configurePushNotificationsAsync } from '../src/lib/pushNotifications';
import { useStore } from '../src/store/useStore';

const queryClient = new QueryClient();
const APP_SURFACE_COLOR = '#000000';

export default function RootLayout() {
  useAppBootstrap();
  useAndroidSystemUi();
  useNotificationRouting();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={DarkTheme}>
          <View style={styles.container}>
            <StatusBar style="light" backgroundColor={APP_SURFACE_COLOR} />
            <Stack screenOptions={{ headerShown: false, contentStyle: styles.container }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="auth" />
            </Stack>
          </View>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function useAndroidSystemUi() {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    void NavigationBar.setBackgroundColorAsync(APP_SURFACE_COLOR);
    void NavigationBar.setBorderColorAsync(APP_SURFACE_COLOR);
    void NavigationBar.setButtonStyleAsync('light');
    NavigationBar.setStyle('light');
  }, []);
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
    void configurePushNotificationsAsync();

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
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

      void completeNotificationNavigation(target);
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
  const data = response.notification.request.content.data;

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
  };

  const notificationId = typeof notificationData.notificationId === 'string'
    ? notificationData.notificationId
    : undefined;
  const goalId = typeof notificationData.goalId === 'string' ? notificationData.goalId : undefined;
  const taskId = typeof notificationData.taskId === 'string' ? notificationData.taskId : undefined;
  const type = typeof notificationData.type === 'string' ? notificationData.type : undefined;

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

  if (type === NotificationType.REMINDER || type === NotificationType.SYSTEM) {
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
    backgroundColor: APP_SURFACE_COLOR,
  },
});

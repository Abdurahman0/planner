import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { View, StyleSheet, Platform, Text, TouchableOpacity } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import { useAppBootstrap } from '../src/hooks/useAppBootstrap';
import { NotificationType } from '@packages/shared';
import { useStore } from '../src/store/useStore';

const queryClient = new QueryClient();
const APP_BACKGROUND_COLOR = '#000000';
const TRANSPARENT_NAVIGATION_BAR = '#00000000';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppShell />
    </SafeAreaProvider>
  );
}

function AppShell() {
  useAppBootstrap();
  useAndroidSystemUi();
  const notificationPermissionNotice = useStore((state) => state.notificationPermissionNotice);
  const clearNotificationPermissionNotice = useStore((state) => state.clearNotificationPermissionNotice);
  const { foregroundBanner, dismissForegroundBanner, openForegroundBanner } = useNotificationRouting();
  const insets = useSafeAreaInsets();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={DarkTheme}>
        <View style={styles.container}>
          <StatusBar style="light" translucent backgroundColor={TRANSPARENT_NAVIGATION_BAR} />
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
          {foregroundBanner ? (
            <TouchableOpacity
              activeOpacity={0.92}
              style={[styles.foregroundBanner, { top: insets.top + (notificationPermissionNotice ? 108 : 12) }]}
              onPress={() => void openForegroundBanner()}
            >
              <View style={styles.foregroundBannerHeader}>
                <Text style={styles.foregroundBannerLabel}>Planner reminder</Text>
                <TouchableOpacity onPress={dismissForegroundBanner} hitSlop={8}>
                  <Text style={styles.foregroundBannerDismiss}>Dismiss</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.foregroundBannerTitle}>{foregroundBanner.title}</Text>
              <Text style={styles.foregroundBannerBody}>{foregroundBanner.body}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function useAndroidSystemUi() {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    void (async () => {
      try {
        await NavigationBar.setPositionAsync('absolute');
        await NavigationBar.setBackgroundColorAsync(TRANSPARENT_NAVIGATION_BAR);
        await NavigationBar.setButtonStyleAsync('light');
        await NavigationBar.setBehaviorAsync('overlay-swipe');
        NavigationBar.setStyle('light');
      } catch {
        // Keep Android startup resilient if a device/runtime does not support every nav-bar call.
      }
    })();
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
  const [foregroundBanner, setForegroundBanner] = useState<{
    title: string;
    body: string;
    target: NotificationNavigationTarget;
  } | null>(null);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      if (!user) {
        return;
      }

      const target = resolveNotificationTargetFromData(notification.request.content.data);
      const title = notification.request.content.title;
      const body = notification.request.content.body;

      if (title && body && target) {
        setForegroundBanner({ title, body, target });
        if (bannerTimeoutRef.current) {
          clearTimeout(bannerTimeoutRef.current);
        }
        bannerTimeoutRef.current = setTimeout(() => {
          setForegroundBanner(null);
        }, 5000);
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
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }
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

  return {
    foregroundBanner,
    dismissForegroundBanner: () => setForegroundBanner(null),
    openForegroundBanner: async () => {
      if (!foregroundBanner) {
        return;
      }

      setForegroundBanner(null);
      await completeNotificationNavigation(foregroundBanner.target);
    },
  };
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
  foregroundBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#1A1026',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A855F744',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  foregroundBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foregroundBannerLabel: {
    color: '#C084FC',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  foregroundBannerDismiss: {
    color: '#AFAFAF',
    fontSize: 12,
    fontWeight: '600',
  },
  foregroundBannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  foregroundBannerBody: {
    color: '#D0D0D0',
    fontSize: 13,
    lineHeight: 18,
  },
});

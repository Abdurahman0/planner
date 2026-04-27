import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LayoutDashboard, Target, Calendar, User, BarChart2 } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { MAIN_TAB_BAR_HEIGHT } from '../../src/components/FloatingTabCta';

const APP_SURFACE_COLOR = '#000000';

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useStore((state) => state.user);
  const isInitialized = useStore((state) => state.isInitialized);
  const tabBarHeight = MAIN_TAB_BAR_HEIGHT + insets.bottom;
  const sceneBottomInset = tabBarHeight;

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace('/auth');
    }
  }, [isInitialized, router, user]);

  if (!isInitialized || !user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: APP_SURFACE_COLOR,
          paddingBottom: sceneBottomInset,
        },
        tabBarBackground: () => <View style={{ flex: 1, backgroundColor: APP_SURFACE_COLOR }} />,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: APP_SURFACE_COLOR,
          overflow: 'hidden',
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
          shadowColor: 'transparent',
        },
        tabBarActiveTintColor: '#A855F7',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, size }) => <Target size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Planner',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

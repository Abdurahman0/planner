import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Dashboard from '../apps/mobile/app/(tabs)/index';
import GoalsScreen from '../apps/mobile/app/(tabs)/goals';
import CalendarScreen from '../apps/mobile/app/(tabs)/calendar';
import ProfileScreen from '../apps/mobile/app/(tabs)/profile';
import ProgressScreen from '../apps/mobile/app/(tabs)/progress';
import CreateGoalScreen from '../apps/mobile/app/goals/create';
import GoalDetailsScreen from '../apps/mobile/app/goals/[id]';
import AuthScreen from '../apps/mobile/app/auth';
import { useNavigationStore } from './mocks/expo-router';
import { LayoutDashboard, Target, Calendar, User, BarChart2 } from 'lucide-react-native';
import { useAppBootstrap } from '../apps/mobile/src/hooks/useAppBootstrap';
import { useStore } from '../apps/mobile/src/store/useStore';

export default function App() {
  const { currentPath, navigate } = useNavigationStore();
  const user = useStore((state) => state.user);
  const isInitialized = useStore((state) => state.isInitialized);

  useAppBootstrap();

  const activeTab = currentPath.includes('goals')
    ? 'goals'
    : currentPath.includes('progress')
      ? 'progress'
      : currentPath.includes('calendar')
        ? 'calendar'
        : currentPath.includes('profile')
          ? 'profile'
          : 'dashboard';

  const showTabBar = isInitialized && !!user && currentPath.startsWith('/(tabs)');

  return (
    <View style={styles.page}>
      <View style={styles.phoneFrame}>
        <View style={styles.statusBar}>
          <Text style={styles.statusTime}>9:41</Text>
          <View style={styles.statusIcons}>
            <View style={styles.statusCircle} />
            <View style={styles.statusCircle} />
            <View style={styles.statusBattery} />
          </View>
        </View>

        <View style={styles.dynamicIsland} />

        <View style={styles.screenContent}>
          {renderScreen(currentPath, user, isInitialized)}
        </View>

        {showTabBar ? (
          <View style={styles.tabBar}>
            <TabButton
              label="Dashboard"
              active={activeTab === 'dashboard'}
              onPress={() => navigate('/(tabs)')}
              icon={<LayoutDashboard size={24} color={activeTab === 'dashboard' ? '#A855F7' : '#888'} />}
            />
            <TabButton
              label="Goals"
              active={activeTab === 'goals'}
              onPress={() => navigate('/(tabs)/goals')}
              icon={<Target size={24} color={activeTab === 'goals' ? '#A855F7' : '#888'} />}
            />
            <TabButton
              label="Progress"
              active={activeTab === 'progress'}
              onPress={() => navigate('/(tabs)/progress')}
              icon={<BarChart2 size={24} color={activeTab === 'progress' ? '#A855F7' : '#888'} />}
            />
            <TabButton
              label="Planner"
              active={activeTab === 'calendar'}
              onPress={() => navigate('/(tabs)/calendar')}
              icon={<Calendar size={24} color={activeTab === 'calendar' ? '#A855F7' : '#888'} />}
            />
            <TabButton
              label="Profile"
              active={activeTab === 'profile'}
              onPress={() => navigate('/(tabs)/profile')}
              icon={<User size={24} color={activeTab === 'profile' ? '#A855F7' : '#888'} />}
            />
          </View>
        ) : null}

        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
}

function renderScreen(currentPath: string, user: unknown, isInitialized: boolean) {
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user || currentPath === '/auth') {
    return <AuthScreen />;
  }

  if (currentPath === '/goals/create') {
    return <CreateGoalScreen />;
  }

  if (/^\/goals\/[^/]+$/.test(currentPath)) {
    return <GoalDetailsScreen />;
  }

  if (currentPath.includes('goals')) {
    return <GoalsScreen />;
  }

  if (currentPath.includes('progress')) {
    return <ProgressScreen />;
  }

  if (currentPath.includes('calendar')) {
    return <CalendarScreen />;
  }

  if (currentPath.includes('profile')) {
    return <ProfileScreen />;
  }

  return <Dashboard />;
}

function TabButton({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon: React.ReactNode;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.tabButton}>
      {icon}
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  phoneFrame: {
    width: 375,
    height: 812,
    backgroundColor: '#000',
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#1A1A1A',
    overflow: 'hidden',
  },
  statusBar: {
    height: 48,
    paddingTop: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTime: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusCircle: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statusBattery: {
    width: 24,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dynamicIsland: {
    position: 'absolute',
    top: 16,
    left: '50%',
    marginLeft: -64,
    width: 128,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#000',
    zIndex: 10,
  },
  screenContent: {
    flex: 1,
  },
  tabBar: {
    height: 84,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 54,
  },
  tabLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#A855F7',
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -64,
    width: 128,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '500',
  },
});

import React from 'react';
import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { CompletionChart } from '../../src/components/charts/CompletionChart';
import { StatusBreakdownChart } from '../../src/components/charts/StatusBreakdownChart';
import { GoalTrendChart } from '../../src/components/charts/GoalTrendChart';
import { ActivityTrendChart } from '../../src/components/charts/ActivityTrendChart';
import { StreakWidget } from '../../src/components/charts/StreakWidget';
import { CalendarClock } from 'lucide-react-native';
import { FLOATING_CTA_CLEARANCE, FloatingTabCta } from '../../src/components/FloatingTabCta';

export default function ProgressScreen() {
  const tasks = useStore((state) => state.tasks);
  const goals = useStore((state) => state.goals);
  const notificationSummary = useStore((state) => state.notificationSummary);
  const fetchGoals = useStore((state) => state.fetchGoals);
  const fetchTasks = useStore((state) => state.fetchTasks);
  const fetchNotificationSummary = useStore((state) => state.fetchNotificationSummary);
  const router = useRouter();

  useEffect(() => {
    void Promise.all([fetchGoals(), fetchTasks(), fetchNotificationSummary()]);
  }, [fetchGoals, fetchNotificationSummary, fetchTasks]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: FLOATING_CTA_CLEARANCE }]}
      >
        <View style={styles.innerContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>Your productivity insights</Text>
          </View>

          <View style={styles.content}>
            <StreakWidget
              currentStreak={notificationSummary?.currentStreak ?? 0}
              bestStreak={notificationSummary?.bestStreak ?? 0}
            />

            <CompletionChart tasks={tasks} />

            <GoalTrendChart goals={goals} tasks={tasks} />

            <ActivityTrendChart tasks={tasks} />

            <StatusBreakdownChart tasks={tasks} />
          </View>
        </View>
      </ScrollView>
      <FloatingTabCta
        label="Open planner"
        icon={<CalendarClock size={18} color="#fff" />}
        onPress={() => router.push('/(tabs)/calendar')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    alignItems: 'center',
  },
  innerContainer: {
    width: '100%',
    maxWidth: 600,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
});

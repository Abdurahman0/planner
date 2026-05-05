import React, { useEffect, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TaskStatus } from '@packages/shared';
import { useStore } from '../../src/store/useStore';

export default function ProgressScreen() {
  const tasks = useStore((state) => state.tasks);
  const notificationSummary = useStore((state) => state.notificationSummary);
  const fetchTasks = useStore((state) => state.fetchTasks);
  const fetchNotificationSummary = useStore((state) => state.fetchNotificationSummary);

  useEffect(() => {
    void Promise.all([fetchTasks(), fetchNotificationSummary()]).catch((error) => {
      const message = error instanceof Error ? error.message : 'Unable to load progress';
      Alert.alert('Load Failed', message);
    });
  }, [fetchNotificationSummary, fetchTasks]);

  const stats = useMemo(() => ({
    done: tasks.filter((task) => task.status === TaskStatus.DONE).length,
    inProgress: tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.PARTIAL).length,
    missed: tasks.filter((task) => task.status === TaskStatus.FAILED).length,
  }), [tasks]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Simple stats from completed work and reminders.</Text>
        </View>

        <View style={styles.grid}>
          <StatCard label="Current streak" value={String(notificationSummary?.currentStreak ?? 0)} />
          <StatCard label="Best streak" value={String(notificationSummary?.bestStreak ?? 0)} />
          <StatCard label="Done today" value={String(notificationSummary?.todayCompletedTasks ?? 0)} />
          <StatCard label="Completion" value={`${Math.round((notificationSummary?.todayCompletionRate ?? 0) * 100)}%`} />
          <StatCard label="In progress" value={String(stats.inProgress)} />
          <StatCard label="Missed" value={String(notificationSummary?.missedTasksCount ?? stats.missed)} />
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    gap: 18,
  },
  header: {
    gap: 6,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#888',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#111',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#222',
    padding: 16,
  },
  cardValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  cardLabel: {
    color: '#808080',
    marginTop: 6,
    fontSize: 12,
  },
});

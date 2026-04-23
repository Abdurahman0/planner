import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useStore } from '../../src/store/useStore';
import { CompletionChart } from '../../src/components/charts/CompletionChart';
import { StatusBreakdownChart } from '../../src/components/charts/StatusBreakdownChart';
import { GoalTrendChart } from '../../src/components/charts/GoalTrendChart';
import { ActivityTrendChart } from '../../src/components/charts/ActivityTrendChart';
import { StreakWidget } from '../../src/components/charts/StreakWidget';

export default function ProgressScreen() {
  const { tasks, goals } = useStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Your productivity insights</Text>
        </View>

        <View style={styles.content}>
          <StreakWidget currentStreak={5} bestStreak={12} />
          
          <CompletionChart tasks={tasks} />
          
          <GoalTrendChart goals={goals} tasks={tasks} />

          <ActivityTrendChart tasks={tasks} />
          
          <StatusBreakdownChart tasks={tasks} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
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

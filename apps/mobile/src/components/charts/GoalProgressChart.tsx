import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Goal, Task, TaskStatus } from '@packages/shared';

interface GoalProgressChartProps {
  goals: Goal[];
  tasks: Task[];
}

export const GoalProgressChart: React.FC<GoalProgressChartProps> = ({ goals, tasks }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Goal Progress</Text>
      {goals.map(goal => {
        const goalTasks = tasks.filter(t => t.goalId === goal.id);
        const completed = goalTasks.filter(t => t.status === TaskStatus.DONE).length;
        const total = goalTasks.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return (
          <View key={goal.id} style={styles.goalRow}>
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
              <Text style={styles.goalPercentage}>{progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <View style={styles.meta}>
              <Text style={styles.metaText}>{completed}/{total} tasks</Text>
              {goal.projectedDate > goal.targetDate && (
                <Text style={styles.delayText}>Delayed by {Math.ceil((goal.projectedDate.getTime() - goal.targetDate.getTime()) / (1000 * 60 * 60 * 24))} days</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  goalRow: {
    marginBottom: 20,
  },
  goalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  goalPercentage: {
    color: '#A855F7',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#A855F7',
    borderRadius: 4,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  metaText: {
    color: '#666',
    fontSize: 11,
  },
  delayText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '500',
  },
});

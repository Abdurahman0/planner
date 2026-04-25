import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Goal, Task, TaskStatus } from '@packages/shared';

interface GoalTrendChartProps {
  goals: Goal[];
  tasks: Task[];
}

const COLORS = ['#A855F7', '#10B981', '#6366F1', '#F59E0B'];

export const GoalTrendChart: React.FC<GoalTrendChartProps> = ({ goals, tasks }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Goal Progress Snapshot</Text>

      <View style={styles.rows}>
        {goals.length === 0 ? (
          <Text style={styles.emptyText}>No goals yet</Text>
        ) : (
          goals.map((goal, index) => {
            const goalTasks = tasks.filter((task) => task.goalId === goal.id);
            const completedTasks = goalTasks.filter((task) => task.status === TaskStatus.DONE).length;
            const progress = goalTasks.length > 0 ? Math.round((completedTasks / goalTasks.length) * 100) : 0;

            return (
              <View key={goal.id} style={styles.goalRow}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalTitle} numberOfLines={1}>
                    {goal.title}
                  </Text>
                  <Text style={[styles.goalValue, { color: COLORS[index % COLORS.length] }]}>
                    {progress}%
                  </Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.max(progress, 4)}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.metaText}>
                  {completedTasks}/{goalTasks.length} tasks completed
                </Text>
              </View>
            );
          })
        )}
      </View>
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
  rows: {
    gap: 16,
  },
  goalRow: {
    gap: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  goalTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#1C1C1C',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    minWidth: 4,
  },
  metaText: {
    color: '#888',
    fontSize: 12,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
});

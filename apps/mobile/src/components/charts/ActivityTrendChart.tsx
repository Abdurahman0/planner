import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Task, TaskStatus } from '@packages/shared';

interface ActivityTrendChartProps {
  tasks: Task[];
}

export const ActivityTrendChart: React.FC<ActivityTrendChartProps> = ({ tasks }) => {
  const data = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const completedCount = tasks.filter(
      (task) =>
        task.plannedDate >= date &&
        task.plannedDate < nextDate &&
        task.status === TaskStatus.DONE,
    ).length;

    return {
      label: date.toLocaleDateString('default', { weekday: 'short' }),
      completedCount,
    };
  });

  const maxCompletedCount = Math.max(1, ...data.map((point) => point.completedCount));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Activity Trend</Text>

      <View style={styles.rows}>
        {data.map((point) => (
          <View key={point.label} style={styles.row}>
            <Text style={styles.label}>{point.label}</Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${(point.completedCount / maxCompletedCount) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.value}>{point.completedCount}</Text>
          </View>
        ))}
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
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    width: 32,
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#1C1C1C',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    minWidth: 6,
    borderRadius: 999,
    backgroundColor: '#10B981',
  },
  value: {
    width: 18,
    textAlign: 'right',
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
});

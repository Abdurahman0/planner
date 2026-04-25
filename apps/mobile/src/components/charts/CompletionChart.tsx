import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Task, TaskStatus } from '@packages/shared';

interface CompletionChartProps {
  tasks: Task[];
}

type CompletionPoint = {
  label: string;
  percentage: number;
};

export const CompletionChart: React.FC<CompletionChartProps> = ({ tasks }) => {
  const data = buildCompletionData(tasks);
  const averageCompletion = data.length > 0
    ? Math.round(data.reduce((total, point) => total + point.percentage, 0) / data.length)
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Completion Trend</Text>
        <Text style={styles.summary}>{averageCompletion}% avg</Text>
      </View>

      <View style={styles.chart}>
        {data.map((point) => (
          <View key={point.label} style={styles.barColumn}>
            <Text style={styles.barValue}>{point.percentage}%</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { height: `${Math.max(point.percentage, 4)}%` }]} />
            </View>
            <Text style={styles.label}>{point.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

function buildCompletionData(tasks: Task[]): CompletionPoint[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayTasks = tasks.filter((task) => task.plannedDate >= date && task.plannedDate < nextDate);
    const completedTasks = dayTasks.filter((task) => task.status === TaskStatus.DONE).length;
    const percentage = dayTasks.length > 0 ? Math.round((completedTasks / dayTasks.length) * 100) : 0;

    return {
      label: date.toLocaleDateString('default', { weekday: 'short' }),
      percentage,
    };
  });
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summary: {
    color: '#A855F7',
    fontSize: 14,
    fontWeight: '700',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 190,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barValue: {
    color: '#666',
    fontSize: 10,
    marginBottom: 8,
  },
  track: {
    width: '100%',
    maxWidth: 28,
    height: 120,
    borderRadius: 14,
    backgroundColor: '#1C1C1C',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  fill: {
    width: '100%',
    backgroundColor: '#A855F7',
    borderRadius: 14,
    minHeight: 4,
  },
  label: {
    color: '#888',
    fontSize: 10,
    fontWeight: '500',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Task, TaskStatus } from '@packages/shared';

interface StatusBreakdownChartProps {
  tasks: Task[];
}

type StatusItem = {
  label: string;
  value: number;
  color: string;
};

export const StatusBreakdownChart: React.FC<StatusBreakdownChartProps> = ({ tasks }) => {
  const data: StatusItem[] = [
    {
      label: 'Completed',
      value: tasks.filter((task) => task.status === TaskStatus.DONE).length,
      color: '#10B981',
    },
    {
      label: 'Partial',
      value: tasks.filter((task) => task.status === TaskStatus.PARTIAL).length,
      color: '#F59E0B',
    },
    {
      label: 'Failed',
      value: tasks.filter((task) => task.status === TaskStatus.FAILED).length,
      color: '#EF4444',
    },
    {
      label: 'Pending',
      value: tasks.filter((task) => task.status === TaskStatus.TODO).length,
      color: '#666',
    },
  ].filter((item) => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task Status Breakdown</Text>

      {data.length === 0 ? (
        <Text style={styles.emptyText}>No task data yet</Text>
      ) : (
        <>
          <View style={styles.summaryBar}>
            {data.map((item) => (
              <View
                key={item.label}
                style={[
                  styles.summarySlice,
                  {
                    backgroundColor: item.color,
                    flex: item.value,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.legend}>
            {data.map((item) => {
              const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;

              return (
                <View key={item.label} style={styles.legendRow}>
                  <View style={styles.legendLeft}>
                    <View style={[styles.dot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.legendValue}>
                    {item.value} ({percentage}%)
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
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
  summaryBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#1C1C1C',
    marginBottom: 18,
  },
  summarySlice: {
    height: '100%',
  },
  legend: {
    gap: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendLabel: {
    color: '#ddd',
    fontSize: 13,
  },
  legendValue: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
});

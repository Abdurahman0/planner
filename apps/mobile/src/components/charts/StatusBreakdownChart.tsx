import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Task, TaskStatus } from '@packages/shared';

interface StatusBreakdownChartProps {
  tasks: Task[];
}

export const StatusBreakdownChart: React.FC<StatusBreakdownChartProps> = ({ tasks }) => {
  const stats = {
    [TaskStatus.DONE]: tasks.filter(t => t.status === TaskStatus.DONE).length,
    [TaskStatus.PARTIAL]: tasks.filter(t => t.status === TaskStatus.PARTIAL).length,
    [TaskStatus.FAILED]: tasks.filter(t => t.status === TaskStatus.FAILED).length,
    [TaskStatus.TODO]: tasks.filter(t => t.status === TaskStatus.TODO).length,
  };

  const data = [
    { name: 'Completed', value: stats[TaskStatus.DONE], color: '#10B981' },
    { name: 'Partial', value: stats[TaskStatus.PARTIAL], color: '#F59E0B' },
    { name: 'Failed', value: stats[TaskStatus.FAILED], color: '#EF4444' },
    { name: 'Pending', value: stats[TaskStatus.TODO], color: '#444' },
  ].filter(d => d.value > 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task Status Breakdown</Text>
      <View style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 8 }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend 
              verticalAlign="middle" 
              align="right" 
              layout="vertical"
              iconType="circle"
              formatter={(value) => <span style={{ color: '#888', fontSize: '12px' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
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
  chartContainer: {
    height: 200,
    width: '100%',
  },
});

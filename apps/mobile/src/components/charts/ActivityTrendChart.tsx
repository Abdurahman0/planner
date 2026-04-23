import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Task, TaskStatus } from '@packages/shared';

interface ActivityTrendChartProps {
  tasks: Task[];
}

export const ActivityTrendChart: React.FC<ActivityTrendChartProps> = ({ tasks }) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });

  const data = last7Days.map(dateStr => {
    const completedCount = tasks.filter(
      t => new Date(t.plannedDate).toDateString() === dateStr && t.status === TaskStatus.DONE
    ).length;
    
    return {
      name: new Date(dateStr).toLocaleDateString('default', { weekday: 'short' }),
      completed: completedCount,
    };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Activity Trend</Text>
      <View style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#666', fontSize: 10 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#666', fontSize: 10 }}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 8 }}
              itemStyle={{ color: '#10B981' }}
            />
            <Line 
              type="stepAfter" 
              dataKey="completed" 
              stroke="#10B981" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#000' }}
            />
          </LineChart>
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

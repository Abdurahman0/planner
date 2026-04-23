import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Task, TaskStatus } from '@packages/shared';

interface CompletionChartProps {
  tasks: Task[];
}

export const CompletionChart: React.FC<CompletionChartProps> = ({ tasks }) => {
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toDateString();
  });

  const data = last14Days.map(dateStr => {
    const dayTasks = tasks.filter(t => new Date(t.plannedDate).toDateString() === dateStr);
    const completed = dayTasks.filter(t => t.status === TaskStatus.DONE).length;
    const total = dayTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      name: new Date(dateStr).toLocaleDateString('default', { weekday: 'short' }),
      percentage,
    };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Completion Trend</Text>
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
              domain={[0, 100]}
              ticks={[0, 50, 100]}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 8 }}
              itemStyle={{ color: '#A855F7' }}
            />
            <Line 
              type="monotone" 
              dataKey="percentage" 
              stroke="#A855F7" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#A855F7', strokeWidth: 2, stroke: '#000' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
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

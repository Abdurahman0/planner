import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Goal, Task, TaskStatus } from '@packages/shared';

interface GoalTrendChartProps {
  goals: Goal[];
  tasks: Task[];
}

export const GoalTrendChart: React.FC<GoalTrendChartProps> = ({ goals, tasks }) => {
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toDateString();
  });

  const data = last14Days.map(dateStr => {
    const point: any = { name: new Date(dateStr).toLocaleDateString('default', { day: 'numeric', month: 'short' }) };
    
    goals.forEach(goal => {
      const goalTasks = tasks.filter(t => t.goalId === goal.id);
      // Tasks planned on or before this date
      const tasksToDate = goalTasks.filter(t => new Date(t.plannedDate) <= new Date(dateStr));
      const completedToDate = tasksToDate.filter(t => t.status === TaskStatus.DONE).length;
      const totalTasks = goalTasks.length;
      
      point[goal.title] = totalTasks > 0 ? Math.round((completedToDate / totalTasks) * 100) : 0;
    });
    
    return point;
  });

  const colors = ['#A855F7', '#10B981', '#6366F1', '#F59E0B'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Goal Progress Over Time</Text>
      <View style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={250}>
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
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 8 }}
              itemStyle={{ fontSize: 12 }}
            />
            <Legend verticalAlign="top" height={36}/>
            {goals.map((goal, index) => (
              <Line 
                key={goal.id}
                type="monotone" 
                dataKey={goal.title} 
                stroke={colors[index % colors.length]} 
                strokeWidth={2} 
                dot={false}
              />
            ))}
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
    height: 250,
    width: '100%',
  },
});

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Task, TaskStatus } from '@packages/shared';

interface WeekViewProps {
  selectedDate: Date;
  tasks: Task[];
}

export const WeekView: React.FC<WeekViewProps> = ({ selectedDate, tasks }) => {
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays(selectedDate);

  const renderDay = ({ item: date }: { item: Date }) => {
    const dayTasks = tasks.filter(
      (t) => new Date(t.plannedDate).toDateString() === date.toDateString()
    );
    const isToday = new Date().toDateString() === date.toDateString();

    return (
      <View style={styles.daySection}>
        <View style={styles.dayHeader}>
          <Text style={[styles.dayName, isToday && styles.todayText]}>
            {date.toLocaleDateString('default', { weekday: 'short' })}
          </Text>
          <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>
            {date.getDate()}
          </Text>
        </View>
        <View style={styles.tasksList}>
          {dayTasks.length === 0 ? (
            <Text style={styles.noTasks}>No tasks planned</Text>
          ) : (
            dayTasks.map((task) => (
              <View key={task.id} style={styles.taskWrapper}>
                <View style={[styles.statusIndicator, styles[task.status]]} />
                <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={weekDays}
      keyExtractor={(item) => item.toISOString()}
      renderItem={renderDay}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  daySection: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  dayHeader: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#222',
    marginRight: 12,
  },
  dayName: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  todayText: {
    color: '#A855F7',
  },
  todayNumber: {
    color: '#A855F7',
  },
  tasksList: {
    flex: 1,
    gap: 8,
  },
  taskWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#000',
    padding: 8,
    borderRadius: 8,
  },
  taskTitle: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  noTasks: {
    color: '#444',
    fontSize: 12,
    fontStyle: 'italic',
  },
  statusIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  todo: { backgroundColor: '#444' },
  done: { backgroundColor: '#10B981' },
  partial: { backgroundColor: '#F59E0B' },
  failed: { backgroundColor: '#EF4444' },
});

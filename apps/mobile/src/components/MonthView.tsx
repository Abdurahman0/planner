import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Task, Goal, TaskSource } from '@packages/shared';

interface MonthViewProps {
  selectedDate: Date;
  tasks: Task[];
  goals: Goal[];
  onDateSelect: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  selectedDate,
  tasks,
  goals,
  onDateSelect,
}) => {
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  // Padding for first week
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const renderDay = (date: Date | null, index: number) => {
    if (!date) return <View key={`empty-${index}`} style={styles.dayCell} />;

    const isToday = new Date().toDateString() === date.toDateString();
    const isSelected = selectedDate.toDateString() === date.toDateString();
    
    const dayTasks = tasks.filter(t => new Date(t.plannedDate).toDateString() === date.toDateString());
    const hasAiTasks = dayTasks.some(t => t.source === TaskSource.AI);

    return (
      <TouchableOpacity
        key={date.toISOString()}
        onPress={() => onDateSelect(date)}
        style={[
          styles.dayCell,
          isSelected && styles.selectedDay,
          isToday && styles.today,
        ]}
      >
        <Text style={[styles.dayText, (isSelected || isToday) && styles.activeDayText]}>
          {date.getDate()}
        </Text>
        <View style={styles.indicators}>
          {dayTasks.length > 0 && (
            <View style={[styles.dot, hasAiTasks ? styles.aiDot : styles.manualDot]} />
          )}
          {dayTasks.length > 3 && <View style={styles.dot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.weekHeader}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={i} style={styles.weekHeaderText}>{d}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((date, i) => renderDay(date, i))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    color: '#444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedDay: {
    backgroundColor: '#A855F7',
  },
  today: {
    borderWidth: 1,
    borderColor: '#A855F7',
  },
  dayText: {
    color: '#fff',
    fontSize: 16,
  },
  activeDayText: {
    fontWeight: 'bold',
  },
  indicators: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
    height: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444',
  },
  aiDot: {
    backgroundColor: '#A855F7',
  },
  manualDot: {
    backgroundColor: '#10B981',
  },
});

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Goal, Task, TaskSource, TaskStatus } from '@packages/shared';
import { isSameDay } from '../lib/planner';

interface MonthViewProps {
  selectedDate: Date;
  tasks: Task[];
  goals: Goal[];
  onDateSelect: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({ selectedDate, tasks, goals, onDateSelect }) => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const leadingEmptyDays = firstDayOfMonth.getDay();
  const monthDays: Array<Date | null> = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    monthDays.push(null);
  }

  for (let day = 1; day <= lastDayOfMonth.getDate(); day += 1) {
    monthDays.push(new Date(year, month, day));
  }

  return (
    <View style={styles.container}>
      <View style={styles.weekHeader}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label) => (
          <Text key={label} style={styles.weekHeaderText}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {monthDays.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const dayTasks = tasks.filter((task) => isSameDay(task.plannedDate, date));
          const completedCount = dayTasks.filter((task) => task.status === TaskStatus.DONE).length;
          const failedCount = dayTasks.filter((task) => task.status === TaskStatus.FAILED).length;
          const aiTaskCount = dayTasks.filter((task) => task.source === TaskSource.AI).length;
          const manualTaskCount = dayTasks.length - aiTaskCount;
          const goalIds = new Set(dayTasks.map((task) => task.goalId));
          const goalCount = goals.filter((goal) => goalIds.has(goal.id)).length;
          const isToday = isSameDay(date, new Date());
          const isSelected = isSameDay(date, selectedDate);

          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[styles.dayCell, isToday && styles.todayCell, isSelected && styles.selectedCell]}
              onPress={() => onDateSelect(date)}
            >
              <Text style={[styles.dayNumber, (isToday || isSelected) && styles.activeDayNumber]}>
                {date.getDate()}
              </Text>

              {dayTasks.length > 0 ? (
                <View style={styles.dayMetrics}>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{dayTasks.length}</Text>
                  </View>
                  <Text style={styles.goalCountText}>{goalCount} goals</Text>
                  <View style={styles.indicatorRow}>
                    {aiTaskCount > 0 ? <View style={[styles.indicatorDot, styles.aiDot]} /> : null}
                    {manualTaskCount > 0 ? <View style={[styles.indicatorDot, styles.manualDot]} /> : null}
                    {completedCount > 0 ? <View style={[styles.indicatorDot, styles.doneDot]} /> : null}
                    {failedCount > 0 ? <View style={[styles.indicatorDot, styles.failedDot]} /> : null}
                  </View>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    color: '#606060',
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 0.9,
    padding: 6,
    borderRadius: 12,
    marginBottom: 4,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: '#A855F7',
  },
  selectedCell: {
    backgroundColor: '#1A1024',
  },
  dayNumber: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  activeDayNumber: {
    color: '#E9D5FF',
  },
  dayMetrics: {
    marginTop: 8,
    gap: 4,
  },
  countBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#111',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  goalCountText: {
    color: '#7A7A7A',
    fontSize: 10,
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  aiDot: {
    backgroundColor: '#A855F7',
  },
  manualDot: {
    backgroundColor: '#10B981',
  },
  doneDot: {
    backgroundColor: '#22C55E',
  },
  failedDot: {
    backgroundColor: '#EF4444',
  },
});

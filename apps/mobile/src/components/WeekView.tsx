import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Task, TaskStatus } from '@packages/shared';
import { Repeat2 } from 'lucide-react-native';
import {
  getDayScheduleDensity,
  getScheduledTasks,
  getTaskRecurrenceLabel,
  getTasksForDate,
  getTaskStatusColor,
  getUnscheduledTasks,
} from '../lib/planner';

interface WeekViewProps {
  selectedDate: Date;
  tasks: Task[];
}

export const WeekView: React.FC<WeekViewProps> = ({ selectedDate, tasks }) => {
  const start = new Date(selectedDate);
  start.setDate(start.getDate() - start.getDay());

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {weekDays.map((date) => {
        const dayTasks = getTasksForDate(tasks, date);
        const scheduledTasks = getScheduledTasks(dayTasks);
        const unscheduledTasks = getUnscheduledTasks(dayTasks);
        const completedCount = dayTasks.filter((task) => task.status === TaskStatus.DONE).length;
        const partialCount = dayTasks.filter((task) => task.status === TaskStatus.PARTIAL).length;
        const failedCount = dayTasks.filter((task) => task.status === TaskStatus.FAILED).length;
        const density = getDayScheduleDensity(dayTasks);
        const isToday = date.toDateString() === new Date().toDateString();

        return (
          <View key={date.toISOString()} style={[styles.dayCard, isToday && styles.todayCard]}>
            <View style={styles.dayHeader}>
              <View>
                <Text style={[styles.dayName, isToday && styles.todayText]}>
                  {date.toLocaleDateString('default', { weekday: 'long' })}
                </Text>
                <Text style={styles.dayDate}>
                  {date.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.metrics}>
                <Text style={styles.metricText}>{scheduledTasks.length} scheduled</Text>
                <Text style={styles.metricText}>{unscheduledTasks.length} unscheduled</Text>
              </View>
            </View>

            <View style={styles.densityRow}>
              <View style={styles.densityTrack}>
                <View style={[styles.densityFill, { width: `${density}%` }]} />
              </View>
              <Text style={styles.densityText}>{density}% of a full day planned</Text>
            </View>

            <View style={styles.statusSummary}>
              <StatusPill label={`${completedCount} done`} color={getTaskStatusColor(TaskStatus.DONE)} />
              <StatusPill label={`${partialCount} partial`} color={getTaskStatusColor(TaskStatus.PARTIAL)} />
              <StatusPill label={`${failedCount} missed`} color={getTaskStatusColor(TaskStatus.FAILED)} />
            </View>

            <View style={styles.taskList}>
              {dayTasks.length === 0 ? (
                <Text style={styles.emptyText}>No tasks planned for this day.</Text>
              ) : (
                dayTasks.map((task) => (
                  <View key={task.id} style={styles.taskRow}>
                    <View style={[styles.taskStatusBar, { backgroundColor: getTaskStatusColor(task.status) }]} />
                    <View style={styles.taskBody}>
                      <Text style={styles.taskTitle} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text style={styles.taskMeta}>
                        {task.startTime && task.endTime ? `${task.startTime} - ${task.endTime}` : 'Unscheduled'}
                      </Text>
                      {task.recurrenceType && task.recurrenceType !== 'none' ? (
                        <View style={styles.repeatRow}>
                          <Repeat2 size={12} color="#C084FC" />
                          <Text style={styles.repeatText}>{getTaskRecurrenceLabel(task)}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.statusPill, { borderColor: `${color}66` }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={styles.statusPillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  dayCard: {
    backgroundColor: '#0B0B0B',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    padding: 16,
  },
  todayCard: {
    borderColor: '#A855F7',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dayName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  todayText: {
    color: '#C084FC',
  },
  dayDate: {
    color: '#808080',
    marginTop: 4,
  },
  metrics: {
    alignItems: 'flex-end',
    gap: 4,
  },
  metricText: {
    color: '#A3A3A3',
    fontSize: 12,
    fontWeight: '600',
  },
  densityRow: {
    marginTop: 16,
  },
  densityTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#171717',
    overflow: 'hidden',
  },
  densityFill: {
    height: '100%',
    backgroundColor: '#A855F7',
    borderRadius: 999,
  },
  densityText: {
    color: '#8A8A8A',
    fontSize: 12,
    marginTop: 8,
  },
  statusSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#111',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    color: '#E5E5E5',
    fontSize: 12,
    fontWeight: '600',
  },
  taskList: {
    marginTop: 16,
    gap: 10,
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#111',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    overflow: 'hidden',
  },
  taskStatusBar: {
    width: 4,
  },
  taskBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  taskTitle: {
    color: '#fff',
    fontWeight: '600',
  },
  taskMeta: {
    color: '#8A8A8A',
    fontSize: 12,
    marginTop: 4,
  },
  repeatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  repeatText: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '600',
  },
});

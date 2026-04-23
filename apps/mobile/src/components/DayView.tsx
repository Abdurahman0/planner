import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Task, TaskStatus, AvailabilitySlot, AvailabilityType } from '@packages/shared';
import { TaskItem } from './TaskItem';

interface DayViewProps {
  selectedDate: Date;
  tasks: Task[];
  availability?: AvailabilitySlot[];
}

export const DayView: React.FC<DayViewProps> = ({ selectedDate, tasks, availability = [] }) => {
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 to 23:00

  const dayTasks = tasks.filter(
    (t) => new Date(t.plannedDate).toDateString() === selectedDate.toDateString()
  );

  const scheduledTasks = dayTasks.filter((t) => t.startTime);
  const unscheduledTasks = dayTasks.filter((t) => !t.startTime);

  const renderTimeline = () => {
    return hours.map((hour) => {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      
      // Find availability for this hour
      const slot = availability.find(s => {
        const startHour = parseInt(s.startTime.split(':')[0]);
        const endHour = parseInt(s.endTime.split(':')[0]);
        return hour >= startHour && hour < endHour;
      });

      // Find tasks starting at this hour
      const hourTasks = scheduledTasks.filter(t => t.startTime?.startsWith(hour.toString().padStart(2, '0')));

      return (
        <View key={hour} style={styles.hourRow}>
          <View style={styles.timeCol}>
            <Text style={styles.timeText}>{timeStr}</Text>
          </View>
          <View style={styles.contentCol}>
            {slot && (
              <View style={[styles.availabilitySlot, styles[slot.type]]}>
                <Text style={styles.availabilityText}>{slot.type.toUpperCase()}</Text>
              </View>
            )}
            {hourTasks.map(task => (
              <View key={task.id} style={styles.scheduledTask}>
                <View style={[styles.statusLine, styles[task.status]]} />
                <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.timeline}>
        {renderTimeline()}
      </View>

      {unscheduledTasks.length > 0 && (
        <View style={styles.unscheduledSection}>
          <Text style={styles.sectionTitle}>Unscheduled</Text>
          {unscheduledTasks.map(task => (
            <TaskItem key={task.id} task={task} onToggle={() => {}} />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timeline: {
    padding: 16,
  },
  hourRow: {
    flexDirection: 'row',
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  timeCol: {
    width: 60,
    paddingTop: -10,
  },
  timeText: {
    color: '#444',
    fontSize: 12,
    fontWeight: '600',
  },
  contentCol: {
    flex: 1,
    paddingLeft: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  availabilitySlot: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 4,
    bottom: 4,
    borderRadius: 4,
    padding: 4,
    opacity: 0.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  sleep: { backgroundColor: '#3B82F6' },
  work: { backgroundColor: '#10B981' },
  unavailable: { backgroundColor: '#EF4444' },
  available: { backgroundColor: '#A855F7' },
  
  scheduledTask: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  statusLine: {
    width: 3,
    height: '100%',
    borderRadius: 2,
  },
  taskTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  todo: { backgroundColor: '#444' },
  done: { backgroundColor: '#10B981' },
  partial: { backgroundColor: '#F59E0B' },
  failed: { backgroundColor: '#EF4444' },

  unscheduledSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#050505',
  },
  sectionTitle: {
    fontSize: 14,
    color: '#444',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
});

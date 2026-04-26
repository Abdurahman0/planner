import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AvailabilitySlot, Task } from '@packages/shared';
import { Plus, Sparkles } from 'lucide-react-native';
import { TaskItem } from './TaskItem';
import {
  getAvailabilityColor,
  getAvailabilityForDate,
  getAvailabilityLabel,
  getScheduledTasks,
  getTaskStatusColor,
  getTasksForDate,
  getTimelineHeight,
  getTimelineTopOffset,
  getUnscheduledTasks,
  PLANNER_END_HOUR,
  PLANNER_START_HOUR,
  TIMELINE_HOUR_HEIGHT,
} from '../lib/planner';

interface DayViewProps {
  selectedDate: Date;
  tasks: Task[];
  availability?: AvailabilitySlot[];
  onAddTaskAtTime?: (startTime?: string) => void;
  onEditTask?: (task: Task) => void;
  onAddScheduleBlock?: (startTime?: string) => void;
  onEditScheduleBlock?: (slot: AvailabilitySlot) => void;
  onPlanDay?: () => void;
}

export const DayView: React.FC<DayViewProps> = ({
  selectedDate,
  tasks,
  availability = [],
  onAddTaskAtTime,
  onEditTask,
  onAddScheduleBlock,
  onEditScheduleBlock,
  onPlanDay,
}) => {
  const [pressedHour, setPressedHour] = useState<number | null>(null);
  const hours = Array.from({ length: PLANNER_END_HOUR - PLANNER_START_HOUR + 1 }, (_, index) => PLANNER_START_HOUR + index);
  const dayTasks = getTasksForDate(tasks, selectedDate);
  const scheduledTasks = getScheduledTasks(dayTasks);
  const unscheduledTasks = getUnscheduledTasks(dayTasks);
  const dayAvailability = getAvailabilityForDate(availability, selectedDate);
  const timelineHeight = (PLANNER_END_HOUR - PLANNER_START_HOUR) * TIMELINE_HOUR_HEIGHT;

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryTitle}>Daily Planner</Text>
            <Text style={styles.summarySubtitle}>
              Tap any open time slot to add a task fast. Scheduled items stay on the timeline.
            </Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{scheduledTasks.length}</Text>
              <Text style={styles.summaryStatLabel}>Scheduled</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{unscheduledTasks.length}</Text>
              <Text style={styles.summaryStatLabel}>Unscheduled</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onAddScheduleBlock?.()}>
            <Text style={styles.actionButtonText}>Add routine block</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryActionButton} onPress={() => onAddTaskAtTime?.()}>
            <Text style={styles.primaryActionButtonText}>Quick Add Task</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timelineCard}>
          <View style={styles.timelineContainer}>
            {hours.map((hour) => {
              const label = `${hour.toString().padStart(2, '0')}:00`;
              const isLast = hour === PLANNER_END_HOUR;

              return (
                <Pressable
                  key={label}
                  style={({ pressed }) => [
                    styles.hourRow,
                    isLast && styles.lastHourRow,
                    pressed && styles.hourRowPressed,
                  ]}
                  onPress={() => onAddTaskAtTime?.(label)}
                  onPressIn={() => setPressedHour(hour)}
                  onPressOut={() => setPressedHour(null)}
                >
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeText}>{label}</Text>
                  </View>
                  <View style={styles.hourSurface}>
                    <View style={styles.hourLine} />
                    <View style={[styles.hourAddBadge, pressedHour === hour && styles.hourAddBadgeActive]}>
                      <Plus size={12} color={pressedHour === hour ? '#fff' : '#A855F7'} />
                    </View>
                  </View>
                </Pressable>
              );
            })}

            <View pointerEvents="box-none" style={[styles.availabilityLayer, { height: timelineHeight }]}>
              {dayAvailability.map((slot) => {
                const color = getAvailabilityColor(slot.type);

                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.availabilityBlock,
                      {
                        top: getTimelineTopOffset(slot.startTime),
                        height: getTimelineHeight(slot.startTime, slot.endTime),
                        backgroundColor: `${color}40`,
                        borderColor: `${color}CC`,
                        shadowColor: color,
                      },
                    ]}
                    onPress={() => onEditScheduleBlock?.(slot)}
                  >
                    <View style={styles.availabilityHeader}>
                      <Text style={[styles.availabilityTitle, { color }]} numberOfLines={1}>
                        {getAvailabilityLabel(slot)}
                      </Text>
                      <View style={[styles.availabilityTypePill, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
                        <Text style={[styles.availabilityTypeText, { color }]}>{slot.type.replace('_', ' ')}</Text>
                      </View>
                    </View>
                    <Text style={styles.availabilityTime}>
                      {slot.startTime} - {slot.endTime}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View pointerEvents="box-none" style={[styles.tasksLayer, { height: timelineHeight }]}>
              {scheduledTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.scheduledTaskCard,
                    {
                      top: getTimelineTopOffset(task.startTime!),
                      height: getTimelineHeight(task.startTime!, task.endTime!),
                      borderLeftColor: getTaskStatusColor(task.status),
                    },
                  ]}
                  onPress={() => onEditTask?.(task)}
                >
                  <View style={styles.scheduledTaskHeader}>
                    <Text style={styles.scheduledTaskTime}>
                      {task.startTime} - {task.endTime}
                    </Text>
                    <View style={[styles.taskStatusPill, { backgroundColor: `${getTaskStatusColor(task.status)}22` }]}>
                      <Text style={[styles.taskStatusText, { color: getTaskStatusColor(task.status) }]}>
                        {task.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.scheduledTaskTitle} numberOfLines={2}>
                    {task.title}
                  </Text>
                  {task.description ? (
                    <Text style={styles.scheduledTaskDescription} numberOfLines={2}>
                      {task.description}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.unscheduledSection}>
          <View style={styles.unscheduledHeader}>
            <Text style={styles.unscheduledTitle}>Unscheduled Tasks</Text>
            <Text style={styles.unscheduledSubtitle}>Keep tasks here until you decide where they belong in the day.</Text>
          </View>

          {unscheduledTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No unscheduled tasks for this day.</Text>
            </View>
          ) : (
            unscheduledTasks.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={() => onEditTask?.(task)} />
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.planDayFab} onPress={onPlanDay}>
        <Sparkles size={18} color="#fff" />
        <Text style={styles.planDayFabText}>Plan Day</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 120,
  },
  summaryCard: {
    backgroundColor: '#0B0B0B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1D1D1D',
    padding: 18,
    gap: 16,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  summarySubtitle: {
    color: '#8A8A8A',
    marginTop: 6,
    lineHeight: 20,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryStat: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#222',
    padding: 14,
  },
  summaryStatValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  summaryStatLabel: {
    color: '#808080',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#E5E5E5',
    fontWeight: '600',
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: '#A855F7',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryActionButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  timelineCard: {
    backgroundColor: '#050505',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1C1C1C',
    paddingVertical: 16,
  },
  timelineContainer: {
    marginLeft: 8,
    marginRight: 12,
    position: 'relative',
  },
  hourRow: {
    flexDirection: 'row',
    height: TIMELINE_HOUR_HEIGHT,
  },
  hourRowPressed: {
    opacity: 0.92,
  },
  lastHourRow: {
    height: 0,
  },
  timeColumn: {
    width: 58,
    paddingRight: 8,
    alignItems: 'flex-end',
    marginTop: -8,
  },
  timeText: {
    color: '#5E5E5E',
    fontSize: 12,
    fontWeight: '600',
  },
  hourSurface: {
    flex: 1,
    position: 'relative',
  },
  hourLine: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    marginTop: 8,
  },
  hourAddBadge: {
    position: 'absolute',
    right: 8,
    top: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#232323',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourAddBadgeActive: {
    backgroundColor: '#A855F7',
    borderColor: '#A855F7',
  },
  availabilityLayer: {
    position: 'absolute',
    left: 68,
    right: 8,
    top: 8,
  },
  availabilityBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'flex-start',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    alignItems: 'center',
  },
  availabilityTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  availabilityTypePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  availabilityTypeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  availabilityTime: {
    color: '#D4D4D4',
    fontSize: 12,
    marginTop: 6,
  },
  tasksLayer: {
    position: 'absolute',
    left: 80,
    right: 16,
    top: 8,
  },
  scheduledTaskCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#121212',
    borderRadius: 18,
    borderLeftWidth: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 3,
  },
  scheduledTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    alignItems: 'center',
  },
  scheduledTaskTime: {
    color: '#8B8B8B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  taskStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  taskStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  scheduledTaskTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  scheduledTaskDescription: {
    color: '#A3A3A3',
    fontSize: 12,
    marginTop: 4,
  },
  unscheduledSection: {
    backgroundColor: '#050505',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1C1C1C',
    padding: 16,
  },
  unscheduledHeader: {
    marginBottom: 14,
  },
  unscheduledTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  unscheduledSubtitle: {
    color: '#7A7A7A',
    marginTop: 4,
  },
  emptyState: {
    borderRadius: 16,
    backgroundColor: '#0D0D0D',
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  emptyStateText: {
    color: '#666',
  },
  planDayFab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#A855F7',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  planDayFabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

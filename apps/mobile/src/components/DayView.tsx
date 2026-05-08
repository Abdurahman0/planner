import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AvailabilitySlot, Task, TaskStatus } from '@packages/shared';
import { CheckCircle2, Circle, Plus, Repeat2 } from 'lucide-react-native';
import { TaskItem } from './TaskItem';
import {
  getAvailabilityColor,
  getAvailabilityForDate,
  getAvailabilityLabel,
  getAvailabilityRecurrenceLabel,
  getPriorityColor,
  getPriorityLabel,
  parseTimeToMinutes,
  getScheduledTasks,
  getTaskPriority,
  getTaskRecurrenceLabel,
  getTaskStatusColor,
  getTasksForDate,
  getTimelineHeight,
  getTimelineTopOffset,
  getUnscheduledTasks,
  PLANNER_END_HOUR,
  PLANNER_START_HOUR,
  TIMELINE_BOTTOM_PADDING,
  TIMELINE_HOUR_HEIGHT,
} from '../lib/planner';

interface DayViewProps {
  selectedDate: Date;
  tasks: Task[];
  availability?: AvailabilitySlot[];
  focusedTaskId?: string;
  focusedTime?: string;
  focusRequestKey?: string;
  onEditTask?: (task: Task) => void;
  onToggleTaskComplete?: (task: Task) => void;
  onAddScheduleBlock?: (startTime?: string) => void;
  onEditScheduleBlock?: (slot: AvailabilitySlot) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  selectedDate,
  tasks,
  availability = [],
  focusedTaskId,
  focusedTime,
  focusRequestKey,
  onEditTask,
  onToggleTaskComplete,
  onAddScheduleBlock,
  onEditScheduleBlock,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const consumedFocusRequestKeyRef = useRef<string | null>(null);
  const unscheduledSectionYRef = useRef(0);
  const unscheduledTaskYRef = useRef<Record<string, number>>({});
  const [pressedHour, setPressedHour] = useState<number | null>(null);
  const [highlightedTaskKey, setHighlightedTaskKey] = useState<string | null>(null);
  const hours = Array.from({ length: PLANNER_END_HOUR - PLANNER_START_HOUR }, (_, index) => PLANNER_START_HOUR + index);
  const dayTasks = getTasksForDate(tasks, selectedDate);
  const scheduledTasks = getScheduledTasks(dayTasks);
  const scheduledTaskLayouts = useMemo(() => buildScheduledTaskLayouts(scheduledTasks), [scheduledTasks]);
  const unscheduledTasks = getUnscheduledTasks(dayTasks);
  const dayAvailability = getAvailabilityForDate(availability, selectedDate);
  const timelineHeight = (PLANNER_END_HOUR - PLANNER_START_HOUR) * TIMELINE_HOUR_HEIGHT;
  const contentBottomPadding = 56;
  const selectedDateKey = selectedDate.toDateString();
  const defaultScrollHour = useMemo(() => {
    const now = new Date();

    if (
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate()
    ) {
      return Math.max(PLANNER_START_HOUR, Math.min(PLANNER_END_HOUR - 1, now.getHours() - 1));
    }

    return 6;
  }, [selectedDate]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, getTimelineTopOffset(`${defaultScrollHour.toString().padStart(2, '0')}:00`) - 24),
        animated: false,
      });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [defaultScrollHour, selectedDateKey]);

  useEffect(() => {
    if (!focusRequestKey) {
      return;
    }

    if (consumedFocusRequestKeyRef.current === focusRequestKey) {
      return;
    }

    const matchedTask = focusedTaskId
      ? dayTasks.find((task) => matchesFocusedTask(task, focusedTaskId))
      : undefined;

    if (!matchedTask && !focusedTime) {
      return;
    }

    consumedFocusRequestKeyRef.current = focusRequestKey;
    const matchedKey = matchedTask ? getTaskFocusKey(matchedTask) : null;

    if (matchedKey) {
      setHighlightedTaskKey(matchedKey);
    }

    const scrollToFocusedTask = () => {
      if (matchedTask?.startTime && matchedTask.endTime) {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, getTimelineTopOffset(matchedTask.startTime) - 48),
          animated: true,
        });
        return;
      }

      if (focusedTime) {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, getTimelineTopOffset(focusedTime) - 48),
          animated: true,
        });
        return;
      }

      if (!matchedKey) {
        return;
      }

      const taskY = unscheduledTaskYRef.current[matchedKey];
      const sectionY = unscheduledSectionYRef.current;

      if (taskY !== undefined) {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, sectionY + taskY - 24),
          animated: true,
        });
      }
    };

    const scrollTimeout = setTimeout(scrollToFocusedTask, 120);
    const clearTimeoutId = setTimeout(() => {
      if (!matchedKey) {
        return;
      }

      setHighlightedTaskKey((current) => current === matchedKey ? null : current);
    }, 2600);

    return () => {
      clearTimeout(scrollTimeout);
      clearTimeout(clearTimeoutId);
    };
  }, [dayTasks, focusRequestKey, focusedTaskId, focusedTime]);

  const handleUnscheduledTaskLayout = (task: Task, event: LayoutChangeEvent) => {
    unscheduledTaskYRef.current[getTaskFocusKey(task)] = event.nativeEvent.layout.y;
  };

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryTitle}>Daily Planner</Text>
            <Text style={styles.summarySubtitle}>
              Use Plan Day for new work, or tap an open slot to place a routine block into your day.
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

        <View style={styles.timelineCard}>
          <View style={[styles.timelineContainer, { minHeight: timelineHeight + TIMELINE_BOTTOM_PADDING }]}>
            {hours.map((hour) => {
              const label = `${hour.toString().padStart(2, '0')}:00`;

              return (
                <Pressable
                  key={label}
                  style={({ pressed }) => [
                    styles.hourRow,
                    pressed && styles.hourRowPressed,
                  ]}
                  onPress={() => onAddScheduleBlock?.(label)}
                  onPressIn={() => setPressedHour(hour)}
                  onPressOut={() => setPressedHour(null)}
                >
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeText}>{label}</Text>
                  </View>
                  <View style={styles.hourSurface}>
                    <View style={styles.hourLine} />
                    {pressedHour === hour ? (
                      <View style={[styles.hourAddBadge, styles.hourAddBadgeActive]}>
                        <Plus size={12} color="#fff" />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}

            <View style={styles.timelineEndMarker}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>24:00</Text>
              </View>
              <View style={styles.endMarkerLine} />
            </View>

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
                    <View style={styles.availabilityPills}>
                      {slot.recurrenceType && slot.recurrenceType !== 'none' ? (
                        <View style={styles.repeatPill}>
                          <Repeat2 size={10} color="#E9D5FF" />
                          <Text style={styles.repeatPillText}>{getAvailabilityRecurrenceLabel(slot)}</Text>
                        </View>
                      ) : null}
                      <View style={[styles.availabilityTypePill, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
                        <Text style={[styles.availabilityTypeText, { color }]}>{slot.type.replace('_', ' ')}</Text>
                      </View>
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
                <ScheduledTaskCard
                  key={getTaskFocusKey(task)}
                  task={task}
                  layout={scheduledTaskLayouts[getTaskFocusKey(task)]}
                  highlighted={highlightedTaskKey === getTaskFocusKey(task)}
                  onPress={() => onEditTask?.(task)}
                  onToggleComplete={() => onToggleTaskComplete?.(task)}
                />
              ))}
            </View>
          </View>
        </View>

        <View
          style={styles.unscheduledSection}
          onLayout={(event) => {
            unscheduledSectionYRef.current = event.nativeEvent.layout.y;
          }}
        >
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
              <View key={getTaskFocusKey(task)} onLayout={(event) => handleUnscheduledTaskLayout(task, event)}>
                <TaskItem
                  task={task}
                  highlighted={highlightedTaskKey === getTaskFocusKey(task)}
                  onPress={() => onEditTask?.(task)}
                  onToggle={() => onToggleTaskComplete?.(task)}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>

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
    color: '#9A9A9A',
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
  timelineCard: {
    backgroundColor: '#050505',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1C1C1C',
    paddingVertical: 16,
    overflow: 'hidden',
  },
  timelineContainer: {
    marginLeft: 8,
    marginRight: 12,
    position: 'relative',
    paddingBottom: TIMELINE_BOTTOM_PADDING,
  },
  hourRow: {
    flexDirection: 'row',
    height: TIMELINE_HOUR_HEIGHT,
  },
  hourRowPressed: {
    backgroundColor: '#090909',
  },
  timeColumn: {
    width: 64,
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  timeText: {
    color: '#929292',
    fontSize: 12,
    fontWeight: '600',
  },
  hourSurface: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-start',
  },
  hourLine: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    marginTop: 12,
  },
  hourAddBadge: {
    position: 'absolute',
    right: 10,
    top: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourAddBadgeActive: {
    backgroundColor: '#A855F7',
    borderColor: '#A855F7',
    borderWidth: 1,
  },
  availabilityLayer: {
    position: 'absolute',
    left: 74,
    right: 8,
    top: 10,
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
  availabilityPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    left: 88,
    right: 16,
    top: 10,
  },
  scheduledTaskCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#121212',
    borderRadius: 18,
    borderLeftWidth: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 3,
  },
  scheduledTaskCardFocused: {
    borderColor: '#A855F7',
    backgroundColor: '#171022',
    shadowColor: '#A855F7',
    shadowOpacity: 0.18,
    elevation: 5,
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
    flex: 1,
  },
  scheduledTaskActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C0C0C',
    borderWidth: 1,
    borderColor: '#262626',
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
  taskMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 6,
  },
  taskPriorityPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  taskPriorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  repeatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#1A1026',
    borderWidth: 1,
    borderColor: '#A855F744',
  },
  repeatPillText: {
    color: '#E9D5FF',
    fontSize: 10,
    fontWeight: '700',
  },
  scheduledTaskTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 16,
  },
  unscheduledSection: {
    backgroundColor: '#050505',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1C1C1C',
    padding: 16,
    marginBottom: 20,
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
  timelineEndMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TIMELINE_BOTTOM_PADDING,
  },
  endMarkerLine: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    marginTop: -12,
  },
});

function ScheduledTaskCard({
  task,
  layout,
  onPress,
  onToggleComplete,
  highlighted = false,
}: {
  task: Task;
  layout?: ScheduledTaskLayout;
  onPress: () => void;
  onToggleComplete?: () => void;
  highlighted?: boolean;
}) {
  const priority = getTaskPriority(task);
  const priorityColor = getPriorityColor(priority);
  const topOffset = layout?.top ?? getTimelineTopOffset(task.startTime!);
  const cardHeight = layout?.height ?? getTimelineHeight(task.startTime!, task.endTime!);
  const overlapOffset = layout?.overlapOffset ?? 0;

  return (
    <TouchableOpacity
      style={[
        styles.scheduledTaskCard,
        highlighted && styles.scheduledTaskCardFocused,
        {
          top: topOffset,
          height: cardHeight,
          left: overlapOffset,
          right: 0,
          borderLeftColor: priority === 'high' ? priorityColor : getTaskStatusColor(task.status),
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.scheduledTaskHeader}>
        <Text style={styles.scheduledTaskTime}>
          {task.startTime} - {task.endTime}
        </Text>
        <TouchableOpacity
          style={styles.scheduledTaskActionButton}
          onPress={(event: GestureResponderEvent) => {
            event.stopPropagation();
            onToggleComplete?.();
          }}
          disabled={!onToggleComplete}
          activeOpacity={0.82}
        >
          {task.status === TaskStatus.DONE ? (
            <CheckCircle2 size={16} color="#10B981" />
          ) : (
            <Circle size={16} color="#8A8A8A" />
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.scheduledTaskTitle} numberOfLines={1}>
        {task.title}
      </Text>
      <View style={styles.taskMetaRow}>
        <View style={[styles.taskStatusPill, { backgroundColor: `${getTaskStatusColor(task.status)}22` }]}>
          <Text style={[styles.taskStatusText, { color: getTaskStatusColor(task.status) }]}>
            {task.status.replace('_', ' ')}
          </Text>
        </View>
        <View style={[styles.taskPriorityPill, { backgroundColor: `${priorityColor}22`, borderColor: `${priorityColor}55` }]}>
          <Text style={[styles.taskPriorityText, { color: priorityColor }]}>{getPriorityLabel(priority)}</Text>
        </View>
        {task.recurrenceType && task.recurrenceType !== 'none' ? (
          <View style={styles.repeatPill}>
            <Repeat2 size={10} color="#E9D5FF" />
            <Text style={styles.repeatPillText}>{getTaskRecurrenceLabel(task)}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

type ScheduledTaskLayout = {
  top: number;
  height: number;
  overlapOffset: number;
};

function buildScheduledTaskLayouts(tasks: Task[]) {
  const layouts: Record<string, ScheduledTaskLayout> = {};
  const activeTasks: Array<{ endMinutes: number; overlapOffset: number }> = [];

  for (const task of tasks) {
    if (!task.startTime || !task.endTime) {
      continue;
    }

    const startMinutes = parseTimeToMinutes(task.startTime);
    const endMinutes = parseTimeToMinutes(task.endTime);

    for (let index = activeTasks.length - 1; index >= 0; index -= 1) {
      if (activeTasks[index].endMinutes <= startMinutes) {
        activeTasks.splice(index, 1);
      }
    }

    const occupiedOffsets = new Set(activeTasks.map((item) => item.overlapOffset));
    let overlapOffset = 0;

    while (occupiedOffsets.has(overlapOffset)) {
      overlapOffset += 12;
    }

    activeTasks.push({
      endMinutes,
      overlapOffset,
    });

    layouts[getTaskFocusKey(task)] = {
      top: getTimelineTopOffset(task.startTime) + 2,
      height: Math.max(76, getTimelineHeight(task.startTime, task.endTime) - 4),
      overlapOffset,
    };
  }

  return layouts;
}

function matchesFocusedTask(task: Task, focusedTaskId: string) {
  return task.id === focusedTaskId || task.seriesId === focusedTaskId;
}

function getTaskFocusKey(task: Task) {
  return `${task.seriesId ?? task.id}:${(task.occurrenceDate ?? task.plannedDate).toISOString()}`;
}

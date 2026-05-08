import React from 'react';
import { GestureResponderEvent, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Task, TaskSource, TaskStatus } from '@packages/shared';
import { CheckCircle2, Circle, AlertCircle, Clock, Repeat2 } from 'lucide-react-native';
import { getPriorityColor, getPriorityLabel, getTaskPriority, getTaskRecurrenceLabel } from '../lib/planner';

interface TaskItemProps {
  task: Task;
  onToggle?: () => void;
  onPress?: () => void;
  highlighted?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onPress, highlighted = false }) => {
  const priority = getTaskPriority(task);
  const priorityColor = getPriorityColor(priority);
  const timeLabel = task.startTime && task.endTime
    ? `${task.startTime} - ${task.endTime}`
    : null;

  const getIcon = () => {
    switch (task.status) {
      case TaskStatus.DONE:
        return <CheckCircle2 size={24} color="#10B981" />;
      case TaskStatus.FAILED:
        return <AlertCircle size={24} color="#EF4444" />;
      case TaskStatus.PARTIAL:
        return <Clock size={24} color="#F59E0B" />;
      default:
        return <Circle size={24} color="#444" />;
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        task.status === TaskStatus.DONE && styles.completed,
        highlighted && styles.highlighted,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.88 : 1}
    >
      <TouchableOpacity
        style={styles.iconButton}
        onPress={(event: GestureResponderEvent) => {
          event.stopPropagation();
          onToggle?.();
        }}
        disabled={!onToggle}
        activeOpacity={0.82}
      >
        {getIcon()}
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={[styles.title, task.status === TaskStatus.DONE && styles.titleCompleted]}>
          {task.title}
        </Text>
        {timeLabel ? (
          <Text style={styles.timeText}>{timeLabel}</Text>
        ) : null}
        <View style={styles.badgesRow}>
          <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}22`, borderColor: `${priorityColor}55` }]}>
            <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>
              {getPriorityLabel(priority)}
            </Text>
          </View>
          {task.recurrenceType && task.recurrenceType !== 'none' ? (
            <View style={styles.recurrenceBadge}>
              <Repeat2 size={12} color="#C084FC" />
              <Text style={styles.recurrenceBadgeText}>{getTaskRecurrenceLabel(task)}</Text>
            </View>
          ) : null}
        </View>
        {task.description && (
          <Text style={styles.description}>{task.description}</Text>
        )}
      </View>
      {task.source === TaskSource.AI && (
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  completed: {
    opacity: 0.6,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconButton: {
    marginRight: 12,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  description: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#9A9A9A',
    marginTop: 4,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recurrenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#1A1026',
    borderWidth: 1,
    borderColor: '#A855F744',
  },
  recurrenceBadgeText: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '600',
  },
  aiBadge: {
    backgroundColor: '#A855F722',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A855F744',
  },
  aiBadgeText: {
    fontSize: 10,
    color: '#A855F7',
    fontWeight: 'bold',
  },
  highlighted: {
    borderColor: '#A855F7',
    backgroundColor: '#161020',
    shadowColor: '#A855F7',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
});

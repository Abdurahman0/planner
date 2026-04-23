import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Task, TaskStatus } from '@packages/shared';
import { CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react-native';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle }) => {
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
      style={[styles.container, task.status === TaskStatus.DONE && styles.completed]}
      onPress={() => onToggle(task.id)}
    >
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, task.status === TaskStatus.DONE && styles.titleCompleted]}>
          {task.title}
        </Text>
        {task.description && (
          <Text style={styles.description}>{task.description}</Text>
        )}
      </View>
      {task.isAiGenerated && (
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
});

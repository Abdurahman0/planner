import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Calendar, ChevronLeft, Clock } from 'lucide-react-native';
import { Task, TaskStatus } from '@packages/shared';
import { useStore } from '../../src/store/useStore';
import { TaskItem } from '../../src/components/TaskItem';
import { getPriorityColor, getPriorityLabel } from '../../src/lib/planner';

export default function GoalDetailsScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    focusTaskId?: string;
    focusDate?: string;
    focusNonce?: string;
  }>();
  const router = useRouter();
  const goalId = Array.isArray(params.id) ? params.id[0] : params.id;
  const goals = useStore((state) => state.goals);
  const tasks = useStore((state) => state.tasks);
  const fetchGoal = useStore((state) => state.fetchGoal);
  const fetchTasks = useStore((state) => state.fetchTasks);
  const updateTaskStatus = useStore((state) => state.updateTaskStatus);
  const [highlightedTaskKey, setHighlightedTaskKey] = useState<string | null>(null);

  useEffect(() => {
    if (!goalId) {
      return;
    }

    void Promise.all([fetchGoal(goalId), fetchTasks(goalId)]).catch((error) => {
      const message = error instanceof Error ? error.message : 'Unable to load goal';
      Alert.alert('Load Failed', message);
    });
  }, [fetchGoal, fetchTasks, goalId]);

  useEffect(() => {
    if (!params.focusTaskId || !params.focusNonce) {
      return;
    }

    const matchingTask = tasks.find((task) => task.goalId === goalId && (task.id === params.focusTaskId || task.seriesId === params.focusTaskId));

    if (!matchingTask) {
      return;
    }

    const key = getTaskFocusKey(matchingTask);
    setHighlightedTaskKey(key);
    const timeoutId = setTimeout(() => setHighlightedTaskKey((current) => current === key ? null : current), 2600);

    return () => clearTimeout(timeoutId);
  }, [goalId, params.focusNonce, params.focusTaskId, tasks]);

  const goal = goals.find((item) => item.id === goalId);
  const goalTasks = useMemo(
    () => tasks
      .filter((task) => task.goalId === goalId)
      .sort(compareGoalTasks),
    [goalId, tasks],
  );

  if (!goal) {
    return null;
  }

  const completedTasks = goalTasks.filter((task) => task.status === TaskStatus.DONE).length;
  const progress = goalTasks.length > 0 ? Math.round((completedTasks / goalTasks.length) * 100) : 0;
  const priorityColor = getPriorityColor(goal.priority);

  const handleTaskDone = async (task: Task) => {
    try {
      await updateTaskStatus(task.seriesId ?? task.id, {
        status: TaskStatus.DONE,
        completionPercent: 100,
        occurrenceDate: task.occurrenceDate,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update task';
      Alert.alert('Update Failed', message);
    }
  };

  const openPlanner = () => {
    if (!params.focusTaskId || !params.focusDate) {
      router.push('/(tabs)/calendar');
      return;
    }

    router.push({
      pathname: '/(tabs)/calendar',
      params: {
        focusTaskId: params.focusTaskId,
        focusDate: params.focusDate,
        focusNonce: `${params.focusTaskId}:${params.focusDate}:${Date.now()}`,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Goal</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.goalCard}>
          <View style={styles.goalCardTop}>
            <View style={[styles.priorityPill, { backgroundColor: `${priorityColor}22`, borderColor: `${priorityColor}55` }]}>
              <Text style={[styles.priorityPillText, { color: priorityColor }]}>
                {getPriorityLabel(goal.priority)} priority
              </Text>
            </View>
            <Text style={styles.progressValue}>{progress}%</Text>
          </View>

          <Text style={styles.goalTitle}>{goal.title}</Text>
          {goal.description ? <Text style={styles.goalDescription}>{goal.description}</Text> : null}

          <View style={styles.metaStack}>
            <View style={styles.metaCard}>
              <Calendar size={16} color="#8A8A8A" />
              <View>
                <Text style={styles.metaLabel}>Target date</Text>
                <Text style={styles.metaValue}>{new Date(goal.targetDate).toLocaleDateString()}</Text>
              </View>
            </View>
            <View style={styles.metaCard}>
              <Clock size={16} color={goal.projectedDate > goal.targetDate ? '#EF4444' : '#10B981'} />
              <View>
                <Text style={styles.metaLabel}>Projected date</Text>
                <Text style={[styles.metaValue, goal.projectedDate > goal.targetDate && styles.delayedText]}>
                  {new Date(goal.projectedDate).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          <Text style={styles.sectionSubtitle}>Review the work tied to this goal or jump to Planner to schedule it.</Text>

          <Pressable style={styles.plannerButton} onPress={openPlanner}>
            <Text style={styles.plannerButtonText}>Open Planner</Text>
            <ArrowRight size={16} color="#C084FC" />
          </Pressable>

          {goalTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No tasks attached yet</Text>
              <Text style={styles.emptyStateBody}>Open Planner to add work for this goal.</Text>
            </View>
          ) : (
            goalTasks.map((task) => (
              <TaskItem
                key={getTaskFocusKey(task)}
                task={task}
                highlighted={highlightedTaskKey === getTaskFocusKey(task)}
                onToggle={() => void handleTaskDone(task)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function compareGoalTasks(left: Task, right: Task) {
  const leftDate = (left.occurrenceDate ?? left.plannedDate).getTime();
  const rightDate = (right.occurrenceDate ?? right.plannedDate).getTime();

  if (leftDate !== rightDate) {
    return leftDate - rightDate;
  }

  if (left.startTime && right.startTime && left.startTime !== right.startTime) {
    return left.startTime.localeCompare(right.startTime);
  }

  if (left.startTime && !right.startTime) {
    return -1;
  }

  if (!left.startTime && right.startTime) {
    return 1;
  }

  return (left.createdAt?.getTime() ?? 0) - (right.createdAt?.getTime() ?? 0);
}

function getTaskFocusKey(task: Task) {
  return `${task.seriesId ?? task.id}:${(task.occurrenceDate ?? task.plannedDate).toISOString()}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  goalCard: {
    backgroundColor: '#101010',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    padding: 20,
    gap: 16,
  },
  goalCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  priorityPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priorityPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressValue: {
    color: '#A855F7',
    fontSize: 18,
    fontWeight: '700',
  },
  goalTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  goalDescription: {
    color: '#A3A3A3',
    lineHeight: 22,
  },
  metaStack: {
    gap: 10,
  },
  metaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0B0B0B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1C1C1C',
    padding: 12,
  },
  metaLabel: {
    color: '#777',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#fff',
    fontWeight: '600',
    marginTop: 2,
  },
  delayedText: {
    color: '#EF4444',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#1D1D1D',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#A855F7',
    borderRadius: 999,
  },
  tasksSection: {
    gap: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#7F7F7F',
    lineHeight: 20,
  },
  plannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A855F744',
    backgroundColor: '#A855F722',
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignSelf: 'stretch',
  },
  plannerButtonText: {
    color: '#C084FC',
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: '#0E0E0E',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1D1D1D',
    padding: 16,
    gap: 6,
  },
  emptyStateTitle: {
    color: '#E5E5E5',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateBody: {
    color: '#888',
    lineHeight: 20,
  },
});

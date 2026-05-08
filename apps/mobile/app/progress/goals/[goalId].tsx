import React, { useEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Task, TaskStatus } from '@packages/shared';
import { ArrowRight, Calendar, ChevronLeft, Target } from 'lucide-react-native';
import { useStore } from '../../../src/store/useStore';
import { getPriorityColor, getPriorityLabel, getTaskPriority } from '../../../src/lib/planner';

export default function GoalProgressDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ goalId?: string }>();
  const goalId = Array.isArray(params.goalId) ? params.goalId[0] : params.goalId;
  const goals = useStore((state) => state.goals);
  const tasks = useStore((state) => state.tasks);
  const fetchGoal = useStore((state) => state.fetchGoal);
  const fetchTasks = useStore((state) => state.fetchTasks);

  useEffect(() => {
    if (!goalId) {
      return;
    }

    void Promise.all([fetchGoal(goalId), fetchTasks(goalId)]).catch((error) => {
      const message = error instanceof Error ? error.message : 'Unable to load goal progress';
      Alert.alert('Load Failed', message);
    });
  }, [fetchGoal, fetchTasks, goalId]);

  const goal = goals.find((item) => item.id === goalId);
  const goalTasks = useMemo(
    () => tasks
      .filter((task) => task.goalId === goalId)
      .sort(compareTasksByDate),
    [goalId, tasks],
  );

  if (!goal) {
    return null;
  }

  const completedTasks = goalTasks.filter((task) => task.status === TaskStatus.DONE).length;
  const totalTasks = goalTasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcomingTasks = goalTasks
    .filter((task) => task.status !== TaskStatus.DONE && (task.occurrenceDate ?? task.plannedDate) >= now)
    .slice(0, 4);
  const missedTasks = goalTasks
    .filter((task) => task.status !== TaskStatus.DONE && (task.occurrenceDate ?? task.plannedDate) < now)
    .slice(0, 4);
  const priorityColor = getPriorityColor(goal.priority);

  const openPlanner = () => {
    const nextTask = upcomingTasks[0];

    if (!nextTask) {
      router.push('/(tabs)/calendar');
      return;
    }

    const focusDate = (nextTask.occurrenceDate ?? nextTask.plannedDate).toISOString();
    const focusTaskId = nextTask.seriesId ?? nextTask.id;

    router.push({
      pathname: '/(tabs)/calendar',
      params: {
        focusTaskId,
        focusDate,
        focusNonce: `${focusTaskId}:${focusDate}:${Date.now()}`,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Goal Progress</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={[styles.priorityPill, { backgroundColor: `${priorityColor}22`, borderColor: `${priorityColor}55` }]}>
              <Text style={[styles.priorityPillText, { color: priorityColor }]}>{getPriorityLabel(goal.priority)} priority</Text>
            </View>
            <Text style={styles.progressValue}>{progress}%</Text>
          </View>

          <Text style={styles.goalTitle}>{goal.title}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.heroStats}>
            <HeroStat label="Completed" value={String(completedTasks)} />
            <HeroStat label="Total tasks" value={String(totalTasks)} />
            <HeroStat label="Upcoming" value={String(upcomingTasks.length)} />
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.secondaryAction}
            onPress={() => router.push({ pathname: '/goals/[id]', params: { id: goal.id } })}
          >
            <Target size={16} color="#E5E5E5" />
            <Text style={styles.secondaryActionText}>Open Goal</Text>
          </Pressable>
          <Pressable style={styles.primaryAction} onPress={openPlanner}>
            <Calendar size={16} color="#fff" />
            <Text style={styles.primaryActionText}>Open Planner</Text>
          </Pressable>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Upcoming tasks</Text>
          {upcomingTasks.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming tasks for this goal.</Text>
          ) : (
            upcomingTasks.map((task) => (
              <TaskRow key={getTaskKey(task)} task={task} />
            ))
          )}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Missed or incomplete</Text>
          {missedTasks.length === 0 ? (
            <Text style={styles.emptyText}>Nothing is overdue for this goal.</Text>
          ) : (
            missedTasks.map((task) => (
              <TaskRow key={getTaskKey(task)} task={task} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function TaskRow({ task }: { task: Task }) {
  const priority = getTaskPriority(task);
  const priorityColor = getPriorityColor(priority);
  const date = task.occurrenceDate ?? task.plannedDate;
  const timeLabel = task.startTime ? `${task.startTime}${task.endTime ? ` - ${task.endTime}` : ''}` : 'Unscheduled';

  return (
    <View style={styles.taskRow}>
      <View style={styles.taskTextWrap}>
        <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
        <Text style={styles.taskMeta}>{date.toLocaleDateString()} - {timeLabel}</Text>
      </View>
      <View style={[styles.taskPriorityPill, { backgroundColor: `${priorityColor}22`, borderColor: `${priorityColor}55` }]}>
        <Text style={[styles.taskPriorityText, { color: priorityColor }]}>{getPriorityLabel(priority)}</Text>
      </View>
    </View>
  );
}

function compareTasksByDate(left: Task, right: Task) {
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

function getTaskKey(task: Task) {
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
    gap: 18,
  },
  heroCard: {
    backgroundColor: '#101010',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    padding: 20,
    gap: 16,
  },
  heroTop: {
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
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#1B1B1B',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#A855F7',
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
  },
  heroStat: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    padding: 14,
    gap: 6,
  },
  heroStatValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  heroStatLabel: {
    color: '#7A7A7A',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262626',
    backgroundColor: '#111',
    paddingVertical: 13,
  },
  secondaryActionText: {
    color: '#E5E5E5',
    fontWeight: '700',
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: '#A855F7',
    paddingVertical: 13,
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '700',
  },
  panel: {
    backgroundColor: '#101010',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    padding: 18,
    gap: 12,
  },
  panelTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: '#7A7A7A',
    lineHeight: 20,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    backgroundColor: '#0B0B0B',
    padding: 14,
  },
  taskTextWrap: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  taskMeta: {
    color: '#8A8A8A',
    fontSize: 12,
  },
  taskPriorityPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  taskPriorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

import React, { useEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Goal, GoalPriority, Task, TaskStatus } from '@packages/shared';
import { ArrowRight } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { getPriorityColor, getPriorityLabel, getTaskPriority } from '../../src/lib/planner';

const PRIORITY_ORDER: GoalPriority[] = [GoalPriority.HIGH, GoalPriority.MEDIUM, GoalPriority.LOW];

export default function ProgressScreen() {
  const router = useRouter();
  const goals = useStore((state) => state.goals);
  const tasks = useStore((state) => state.tasks);
  const fetchGoals = useStore((state) => state.fetchGoals);
  const fetchTasks = useStore((state) => state.fetchTasks);

  useEffect(() => {
    void Promise.all([fetchGoals(), fetchTasks()]).catch((error) => {
      const message = error instanceof Error ? error.message : 'Unable to load progress';
      Alert.alert('Load Failed', message);
    });
  }, [fetchGoals, fetchTasks]);

  const weeklyBars = useMemo(() => buildWeeklyCompletionBars(tasks), [tasks]);
  const priorityRows = useMemo(() => buildPriorityRows(tasks), [tasks]);
  const goalRows = useMemo(() => buildGoalRows(goals, tasks), [goals, tasks]);
  const completedThisWeek = weeklyBars.reduce((total, item) => total + item.completed, 0);
  const pendingTasks = tasks.filter((task) => task.status !== TaskStatus.DONE).length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Simple, readable progress from your current tasks and goals.</Text>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard label="Completed this week" value={String(completedThisWeek)} />
          <SummaryCard label="Pending tasks" value={String(pendingTasks)} />
          <SummaryCard label="Active goals" value={String(goalRows.length)} />
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Weekly completion</Text>
            <Text style={styles.panelHint}>Last 7 days</Text>
          </View>
          <View style={styles.weeklyChart}>
            {weeklyBars.map((bar) => (
              <View key={bar.label} style={styles.weeklyColumn}>
                <Text style={styles.weeklyValue}>{bar.completed}</Text>
                <View style={styles.weeklyTrack}>
                  <View
                    style={[
                      styles.weeklyFill,
                      { height: `${Math.max(bar.fillPercent, bar.completed > 0 ? 12 : 4)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.weeklyLabel}>{bar.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Priority breakdown</Text>
            <Text style={styles.panelHint}>Completed vs pending</Text>
          </View>
          <View style={styles.priorityList}>
            {priorityRows.map((row) => (
              <View key={row.priority} style={styles.priorityRow}>
                <View style={styles.priorityRowHeader}>
                  <View style={styles.priorityLabelWrap}>
                    <View style={[styles.priorityDot, { backgroundColor: row.color }]} />
                    <Text style={styles.priorityLabel}>{getPriorityLabel(row.priority)}</Text>
                  </View>
                  <Text style={styles.priorityMeta}>
                    {row.completed}/{row.total || 0}
                  </Text>
                </View>
                <View style={styles.priorityTrack}>
                  <View
                    style={[
                      styles.priorityFill,
                      {
                        width: `${row.completionPercent}%`,
                        backgroundColor: row.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.priorityCaption}>
                  {row.pending} pending
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Goal progress</Text>
            <Text style={styles.panelHint}>Tap a goal for details</Text>
          </View>

          {goalRows.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No goals yet</Text>
              <Text style={styles.emptyStateBody}>Create a goal first, then progress will appear here.</Text>
            </View>
          ) : (
            goalRows.map((goalRow) => (
              <Pressable
                key={goalRow.goal.id}
                style={styles.goalRow}
                onPress={() => {
                  router.push({
                    pathname: '/progress/goals/[goalId]' as never,
                    params: { goalId: goalRow.goal.id } as never,
                  });
                }}
              >
                <View style={styles.goalRowTop}>
                  <View style={styles.goalTextWrap}>
                    <Text style={styles.goalTitle} numberOfLines={1}>{goalRow.goal.title}</Text>
                    <Text style={styles.goalSubtext}>
                      {goalRow.completed}/{goalRow.total} tasks done
                    </Text>
                  </View>
                  <ArrowRight size={16} color="#8A8A8A" />
                </View>

                <View style={styles.goalProgressTrack}>
                  <View style={[styles.goalProgressFill, { width: `${goalRow.progress}%` }]} />
                </View>

                <View style={styles.goalRowMeta}>
                  <Text style={styles.goalPriorityText}>{getPriorityLabel(goalRow.priority)} priority</Text>
                  <Text style={styles.goalPercentText}>{goalRow.progress}%</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function buildWeeklyCompletionBars(tasks: Task[]) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const completed = tasks.filter((task) => {
      if (task.status !== TaskStatus.DONE) {
        return false;
      }

      const completionDate = task.completedDate ?? task.occurrenceDate ?? task.plannedDate;
      return completionDate >= date && completionDate < nextDate;
    }).length;

    return {
      label: date.toLocaleDateString('default', { weekday: 'short' }),
      completed,
    };
  });

  const maxCompleted = Math.max(...days.map((day) => day.completed), 1);

  return days.map((day) => ({
    ...day,
    fillPercent: Math.round((day.completed / maxCompleted) * 100),
  }));
}

function buildPriorityRows(tasks: Task[]) {
  return PRIORITY_ORDER.map((priority) => {
    const matchingTasks = tasks.filter((task) => getTaskPriority(task) === priority);
    const completed = matchingTasks.filter((task) => task.status === TaskStatus.DONE).length;
    const total = matchingTasks.length;
    const pending = total - completed;

    return {
      priority,
      color: getPriorityColor(priority),
      completed,
      pending,
      total,
      completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });
}

function buildGoalRows(goals: Goal[], tasks: Task[]) {
  return goals.map((goal) => {
    const goalTasks = tasks.filter((task) => task.goalId === goal.id);
    const completed = goalTasks.filter((task) => task.status === TaskStatus.DONE).length;
    const total = goalTasks.length;

    return {
      goal,
      priority: goal.priority,
      completed,
      total,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }).sort((left, right) => {
    const priorityDiff = PRIORITY_ORDER.indexOf(left.priority) - PRIORITY_ORDER.indexOf(right.priority);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return right.progress - left.progress;
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 36,
    gap: 18,
  },
  header: {
    gap: 6,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8A8A8A',
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#202020',
    padding: 14,
    gap: 6,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  summaryLabel: {
    color: '#7A7A7A',
    fontSize: 12,
    lineHeight: 16,
  },
  panel: {
    backgroundColor: '#101010',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    padding: 18,
    gap: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  panelTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  panelHint: {
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '600',
  },
  weeklyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    minHeight: 170,
  },
  weeklyColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  weeklyValue: {
    color: '#8A8A8A',
    fontSize: 11,
    fontWeight: '600',
  },
  weeklyTrack: {
    width: '100%',
    maxWidth: 28,
    height: 112,
    borderRadius: 14,
    backgroundColor: '#1B1B1B',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weeklyFill: {
    width: '100%',
    backgroundColor: '#A855F7',
    borderRadius: 14,
    minHeight: 4,
  },
  weeklyLabel: {
    color: '#777',
    fontSize: 11,
    fontWeight: '600',
  },
  priorityList: {
    gap: 14,
  },
  priorityRow: {
    gap: 8,
  },
  priorityRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  priorityLabel: {
    color: '#E5E5E5',
    fontSize: 14,
    fontWeight: '600',
  },
  priorityMeta: {
    color: '#8A8A8A',
    fontSize: 13,
    fontWeight: '600',
  },
  priorityTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  priorityFill: {
    height: '100%',
    borderRadius: 999,
  },
  priorityCaption: {
    color: '#7A7A7A',
    fontSize: 12,
  },
  goalRow: {
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    backgroundColor: '#0B0B0B',
    padding: 14,
  },
  goalRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  goalTextWrap: {
    flex: 1,
    gap: 3,
  },
  goalTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  goalSubtext: {
    color: '#7A7A7A',
    fontSize: 12,
  },
  goalProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1D1D1D',
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#A855F7',
  },
  goalRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalPriorityText: {
    color: '#9A9A9A',
    fontSize: 12,
    fontWeight: '600',
  },
  goalPercentText: {
    color: '#C084FC',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    backgroundColor: '#0B0B0B',
    padding: 16,
    gap: 6,
  },
  emptyStateTitle: {
    color: '#E5E5E5',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateBody: {
    color: '#7A7A7A',
    lineHeight: 20,
  },
});

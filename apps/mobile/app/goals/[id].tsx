import React, { useEffect, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Calendar, Clock } from 'lucide-react-native';
import { TaskStatus } from '@packages/shared';
import { useStore } from '../../src/store/useStore';
import { TaskItem } from '../../src/components/TaskItem';
import { getPriorityColor, getPriorityLabel } from '../../src/lib/planner';

export default function GoalDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const goalId = Array.isArray(id) ? id[0] : id;
  const goals = useStore((state) => state.goals);
  const tasks = useStore((state) => state.tasks);
  const fetchGoal = useStore((state) => state.fetchGoal);
  const fetchTasks = useStore((state) => state.fetchTasks);
  const updateTaskStatus = useStore((state) => state.updateTaskStatus);

  useEffect(() => {
    if (!goalId) {
      return;
    }

    void Promise.all([fetchGoal(goalId), fetchTasks(goalId)]).catch((error) => {
      const message = error instanceof Error ? error.message : 'Unable to load goal';
      Alert.alert('Load Failed', message);
    });
  }, [fetchGoal, fetchTasks, goalId]);

  const goal = goals.find((item) => item.id === goalId);
  const goalTasks = useMemo(() => tasks.filter((task) => task.goalId === goalId), [goalId, tasks]);

  if (!goal) {
    return null;
  }

  const completedTasks = goalTasks.filter((task) => task.status === TaskStatus.DONE).length;
  const progress = goalTasks.length > 0 ? Math.round((completedTasks / goalTasks.length) * 100) : 0;
  const priorityColor = getPriorityColor(goal.priority);

  const handleTaskDone = async (taskId: string) => {
    const task = goalTasks.find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    try {
      await updateTaskStatus(taskId, {
        status: TaskStatus.DONE,
        completionPercent: 100,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update task';
      Alert.alert('Update Failed', message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goal</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.innerContainer}>
          <View style={styles.card}>
            <View style={styles.priorityRow}>
              <View style={[styles.priorityPill, { backgroundColor: `${priorityColor}22`, borderColor: `${priorityColor}55` }]}>
                <Text style={[styles.priorityText, { color: priorityColor }]}>
                  {getPriorityLabel(goal.priority)} priority
                </Text>
              </View>
              <Text style={styles.progressValue}>{progress}%</Text>
            </View>

            <Text style={styles.title}>{goal.title}</Text>
            <Text style={styles.description}>{goal.description || 'No description provided.'}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Calendar size={16} color="#888" />
                <View>
                  <Text style={styles.metaLabel}>Target</Text>
                  <Text style={styles.metaValue}>{new Date(goal.targetDate).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={styles.metaItem}>
                <Clock size={16} color={goal.projectedDate > goal.targetDate ? '#EF4444' : '#10B981'} />
                <View>
                  <Text style={styles.metaLabel}>Projected</Text>
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

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Tasks for this goal</Text>
              <Text style={styles.sectionSubtitle}>Create and schedule new work from Planner.</Text>
            </View>
            <TouchableOpacity style={styles.plannerButton} onPress={() => router.push('/(tabs)/calendar')}>
              <Text style={styles.plannerButtonText}>Open Planner</Text>
            </TouchableOpacity>
          </View>

          {goalTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No tasks are attached to this goal yet.</Text>
            </View>
          ) : (
            goalTasks.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={() => void handleTaskDone(task.id)} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
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
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
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
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 600,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    padding: 22,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  priorityPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressValue: {
    color: '#A855F7',
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  description: {
    color: '#8A8A8A',
    marginTop: 8,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1D1D1D',
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
    marginTop: 18,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#A855F7',
    borderRadius: 999,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#777',
    marginTop: 4,
  },
  plannerButton: {
    borderRadius: 14,
    backgroundColor: '#A855F722',
    borderWidth: 1,
    borderColor: '#A855F744',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  plannerButtonText: {
    color: '#C084FC',
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: '#111',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#222',
    padding: 18,
  },
  emptyStateText: {
    color: '#8A8A8A',
  },
});

import { Alert, View, Text, ScrollView, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { useStore } from '../../src/store/useStore';
import { GoalCard } from '../../src/components/GoalCard';
import { ProgressWidget } from '../../src/components/ProgressWidget';
import { TaskItem } from '../../src/components/TaskItem';
import { TaskStatus } from '@packages/shared';
import { CompletionChart } from '../../src/components/charts/CompletionChart';

export default function Dashboard() {
  const goals = useStore((state) => state.goals);
  const tasks = useStore((state) => state.tasks);
  const notificationSummary = useStore((state) => state.notificationSummary);
  const isLoading = useStore((state) => state.isLoading);
  const fetchGoals = useStore((state) => state.fetchGoals);
  const fetchTasks = useStore((state) => state.fetchTasks);
  const fetchNotificationSummary = useStore((state) => state.fetchNotificationSummary);
  const updateTaskStatus = useStore((state) => state.updateTaskStatus);

  const today = new Date().toDateString();
  const todayTasks = tasks.filter(t => new Date(t.plannedDate).toDateString() === today);

  useEffect(() => {
    void (async () => {
      try {
        await Promise.all([fetchGoals(), fetchTasks(), fetchNotificationSummary()]);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load dashboard';
        Alert.alert('Load Failed', message);
      }
    })();
  }, [fetchGoals, fetchNotificationSummary, fetchTasks]);

  const handleTaskDone = async (taskId: string) => {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Today</Text>
        <Text style={styles.subtitle}>
          {new Date().toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      <ProgressWidget
        completionRate={notificationSummary?.todayCompletionRate ?? 0}
        currentStreak={notificationSummary?.currentStreak ?? 0}
      />

      <View style={styles.section}>
        <CompletionChart tasks={tasks} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          <Text style={styles.taskCount}>{todayTasks.filter(t => t.status === TaskStatus.DONE).length}/{todayTasks.length}</Text>
        </View>
        {todayTasks.length === 0 ? (
          <Text style={styles.emptyText}>{isLoading ? 'Loading tasks...' : 'No tasks for today'}</Text>
        ) : (
          todayTasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onToggle={() => void handleTaskDone(task.id)} 
            />
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Goals</Text>
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 600,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  taskCount: {
    fontSize: 14,
    color: '#A855F7',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#444',
    fontStyle: 'italic',
  },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { TaskStatus, GoalType } from '@packages/shared';
import { ChevronLeft, Calendar, Target, Brain, Clock } from 'lucide-react-native';
import { TaskItem } from '../../src/components/TaskItem';

export default function GoalDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { goals, tasks, updateTaskStatus } = useStore();

  const goal = goals.find((g) => g.id === id);
  const goalTasks = tasks.filter((t) => t.goalId === id);

  if (!goal) return null;

  const completedTasks = goalTasks.filter((t) => t.status === TaskStatus.DONE).length;
  const progress = goalTasks.length > 0 ? Math.round((completedTasks / goalTasks.length) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goal Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.innerContainer}>
          <View style={styles.card}>
            <View style={styles.goalHeader}>
              <View style={[styles.typeBadge, goal.type === GoalType.AI_MANAGED ? styles.aiBadge : styles.manualBadge]}>
                {goal.type === GoalType.AI_MANAGED ? <Brain size={12} color="#A855F7" /> : <Target size={12} color="#10B981" />}
                <Text style={[styles.typeText, goal.type === GoalType.AI_MANAGED ? styles.aiText : styles.manualText]}>
                  {goal.type === GoalType.AI_MANAGED ? 'AI Managed' : 'Manual Plan'}
                </Text>
              </View>
              <Text style={styles.title}>{goal.title}</Text>
              <Text style={styles.description}>{goal.description || 'No description provided.'}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Calendar size={16} color="#888" />
                <View>
                  <Text style={styles.statLabel}>Target Date</Text>
                  <Text style={styles.statValue}>{new Date(goal.targetDate).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={styles.stat}>
                <Clock size={16} color={goal.projectedDate > goal.targetDate ? '#EF4444' : '#10B981'} />
                <View>
                  <Text style={styles.statLabel}>Projected</Text>
                  <Text style={[styles.statValue, goal.projectedDate > goal.targetDate && { color: '#EF4444' }]}>
                    {new Date(goal.projectedDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>Overall Progress</Text>
                <Text style={styles.progressValue}>{progress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            </View>
          </View>

          <View style={styles.tasksSection}>
            <Text style={styles.sectionTitle}>Plan & Tasks</Text>
            {goalTasks.length === 0 ? (
              <Text style={styles.emptyTasks}>No tasks defined for this goal yet.</Text>
            ) : (
              goalTasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggle={(id) => updateTaskStatus(id, TaskStatus.DONE)} 
                />
              ))
            )}
          </View>

          {goal.type === GoalType.AI_MANAGED && (
            <TouchableOpacity style={styles.replanBtn}>
              <Brain size={20} color="#fff" />
              <Text style={styles.replanBtnText}>Request AI Replan</Text>
            </TouchableOpacity>
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
    backgroundColor: '#000',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
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
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 32,
  },
  goalHeader: {
    marginBottom: 24,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  aiBadge: { backgroundColor: '#A855F722' },
  manualBadge: { backgroundColor: '#10B98122' },
  typeText: { fontSize: 10, fontWeight: 'bold' },
  aiText: { color: '#A855F7' },
  manualText: { color: '#10B981' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  stat: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  progressSection: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#888',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#A855F7',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#A855F7',
    borderRadius: 4,
  },
  tasksSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  emptyTasks: {
    color: '#444',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  replanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#A855F7',
    paddingVertical: 16,
    borderRadius: 16,
  },
  replanBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

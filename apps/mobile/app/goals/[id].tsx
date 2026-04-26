import React from 'react';
import { Alert, Platform, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { GoalType, TaskStatus, TaskType } from '@packages/shared';
import { ChevronLeft, Calendar, Target, Brain, Clock } from 'lucide-react-native';
import { TaskItem } from '../../src/components/TaskItem';
import { useEffect, useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function GoalDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const goalId = Array.isArray(id) ? id[0] : id;
  const goals = useStore((state) => state.goals);
  const tasks = useStore((state) => state.tasks);
  const isLoading = useStore((state) => state.isLoading);
  const fetchGoal = useStore((state) => state.fetchGoal);
  const fetchTasks = useStore((state) => state.fetchTasks);
  const createTask = useStore((state) => state.createTask);
  const updateTaskStatus = useStore((state) => state.updateTaskStatus);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<TaskType>(TaskType.TIME_BASED);
  const [plannedDate, setPlannedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('60');
  const [targetValue, setTargetValue] = useState('1');
  const [targetUnit, setTargetUnit] = useState('unit');

  useEffect(() => {
    if (!goalId) {
      return;
    }

    void (async () => {
      try {
        await Promise.all([fetchGoal(goalId), fetchTasks(goalId)]);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load goal details';
        Alert.alert('Load Failed', message);
      }
    })();
  }, [fetchGoal, fetchTasks, goalId]);

  const goal = goals.find((g) => g.id === goalId);
  const goalTasks = useMemo(() => tasks.filter((task) => task.goalId === goalId), [goalId, tasks]);

  if (!goal) return null;

  const completedTasks = goalTasks.filter((t) => t.status === TaskStatus.DONE).length;
  const progress = goalTasks.length > 0 ? Math.round((completedTasks / goalTasks.length) * 100) : 0;

  const handleTaskDone = async (taskId: string) => {
    const task = goalTasks.find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    try {
      await updateTaskStatus(taskId, {
        status: TaskStatus.DONE,
        completionPercent: 100,
        completedValue: task.type === TaskType.UNIT_BASED ? task.targetValue : undefined,
      });
      await fetchTasks(goal.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update task';
      Alert.alert('Update Failed', message);
    }
  };

  const handleCreateTask = async () => {
    if (taskTitle.trim().length < 3) {
      Alert.alert('Invalid Task', 'Task title must be at least 3 characters.');
      return;
    }

    try {
      await createTask({
        goalId: goal.id,
        title: taskTitle.trim(),
        type: taskType,
        plannedDate,
        startTime: startTime.trim() || undefined,
        endTime: endTime.trim() || undefined,
        estimatedMinutes: taskType === TaskType.TIME_BASED ? Number(estimatedMinutes) : undefined,
        targetValue: taskType === TaskType.UNIT_BASED ? Number(targetValue) : undefined,
        targetUnit: taskType === TaskType.UNIT_BASED ? targetUnit.trim() : undefined,
      });
      await fetchTasks(goal.id);
      setTaskTitle('');
      setPlannedDate(new Date());
      setStartTime('');
      setEndTime('');
      setEstimatedMinutes('60');
      setTargetValue('1');
      setTargetUnit('unit');
      setShowTaskForm(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create task';
      Alert.alert('Create Task Failed', message);
    }
  };

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
            <View style={styles.taskHeaderRow}>
              <Text style={styles.sectionTitle}>Plan & Tasks</Text>
              <TouchableOpacity style={styles.addTaskBtn} onPress={() => setShowTaskForm((value) => !value)}>
                <Text style={styles.addTaskBtnText}>{showTaskForm ? 'Close' : 'Add Task'}</Text>
              </TouchableOpacity>
            </View>

            {showTaskForm && (
              <View style={styles.taskForm}>
                <TextInput
                  style={styles.taskInput}
                  placeholder="Task title"
                  placeholderTextColor="#444"
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                />
                <View style={styles.taskTypeRow}>
                  <TouchableOpacity
                    style={[styles.taskTypeButton, taskType === TaskType.TIME_BASED && styles.taskTypeButtonActive]}
                    onPress={() => setTaskType(TaskType.TIME_BASED)}
                  >
                    <Text style={[styles.taskTypeButtonText, taskType === TaskType.TIME_BASED && styles.taskTypeButtonTextActive]}>Time</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.taskTypeButton, taskType === TaskType.UNIT_BASED && styles.taskTypeButtonActive]}
                    onPress={() => setTaskType(TaskType.UNIT_BASED)}
                  >
                    <Text style={[styles.taskTypeButtonText, taskType === TaskType.UNIT_BASED && styles.taskTypeButtonTextActive]}>Unit</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                  <Calendar size={18} color="#A855F7" />
                  <Text style={styles.dateButtonText}>{plannedDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker ? (
                  <DateTimePicker
                    value={plannedDate}
                    mode="date"
                    display="default"
                    onChange={(_event, nextDate) => {
                      setShowDatePicker(Platform.OS === 'ios');

                      if (nextDate) {
                        setPlannedDate(nextDate);
                      }
                    }}
                  />
                ) : null}
                <View style={styles.unitRow}>
                  <TextInput
                    style={[styles.taskInput, styles.unitValueInput]}
                    placeholder="Start time HH:mm (optional)"
                    placeholderTextColor="#444"
                    value={startTime}
                    onChangeText={setStartTime}
                  />
                  <TextInput
                    style={[styles.taskInput, styles.unitLabelInput]}
                    placeholder="End time HH:mm (optional)"
                    placeholderTextColor="#444"
                    value={endTime}
                    onChangeText={setEndTime}
                  />
                </View>
                {taskType === TaskType.TIME_BASED ? (
                  <TextInput
                    style={styles.taskInput}
                    placeholder="Estimated minutes"
                    placeholderTextColor="#444"
                    keyboardType="numeric"
                    value={estimatedMinutes}
                    onChangeText={setEstimatedMinutes}
                  />
                ) : (
                  <View style={styles.unitRow}>
                    <TextInput
                      style={[styles.taskInput, styles.unitValueInput]}
                      placeholder="Target value"
                      placeholderTextColor="#444"
                      keyboardType="numeric"
                      value={targetValue}
                      onChangeText={setTargetValue}
                    />
                    <TextInput
                      style={[styles.taskInput, styles.unitLabelInput]}
                      placeholder="Unit"
                      placeholderTextColor="#444"
                      value={targetUnit}
                      onChangeText={setTargetUnit}
                    />
                  </View>
                )}
                <TouchableOpacity style={styles.createTaskBtn} onPress={() => void handleCreateTask()} disabled={isLoading}>
                  <Text style={styles.createTaskBtnText}>{isLoading ? 'Saving...' : 'Create Task'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {goalTasks.length === 0 ? (
              <Text style={styles.emptyTasks}>No tasks defined for this goal yet.</Text>
            ) : (
              goalTasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggle={() => void handleTaskDone(task.id)} 
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
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addTaskBtn: {
    backgroundColor: '#A855F722',
    borderWidth: 1,
    borderColor: '#A855F744',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addTaskBtnText: {
    color: '#A855F7',
    fontWeight: '600',
  },
  taskForm: {
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  taskInput: {
    backgroundColor: '#000',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
  },
  taskTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  taskTypeButton: {
    flex: 1,
    backgroundColor: '#050505',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  taskTypeButtonActive: {
    backgroundColor: '#A855F7',
  },
  taskTypeButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  taskTypeButtonTextActive: {
    color: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#000',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 15,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  unitValueInput: {
    flex: 1,
  },
  unitLabelInput: {
    flex: 1,
  },
  createTaskBtn: {
    backgroundColor: '#A855F7',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createTaskBtnText: {
    color: '#fff',
    fontWeight: 'bold',
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

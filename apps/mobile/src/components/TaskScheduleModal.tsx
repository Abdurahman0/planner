import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Goal, Task, TaskType } from '@packages/shared';
import { Calendar, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addMinutesToTime } from '../lib/planner';

interface TaskScheduleModalProps {
  visible: boolean;
  goals: Goal[];
  selectedDate: Date;
  task?: Task | null;
  initialStartTime?: string;
  onClose: () => void;
  onCreate: (input: {
    goalId: string;
    title: string;
    description?: string;
    type: TaskType;
    plannedDate: Date;
    startTime?: string;
    endTime?: string;
    estimatedMinutes?: number;
    targetValue?: number;
    targetUnit?: string;
  }) => Promise<void>;
  onUpdate: (taskId: string, input: {
    title?: string;
    description?: string | null;
    type?: TaskType;
    plannedDate?: Date;
    startTime?: string | null;
    endTime?: string | null;
    estimatedMinutes?: number | null;
    targetValue?: number | null;
    targetUnit?: string | null;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function TaskScheduleModal({
  visible,
  goals,
  selectedDate,
  task,
  initialStartTime,
  onClose,
  onCreate,
  onUpdate,
  isLoading = false,
}: TaskScheduleModalProps) {
  const insets = useSafeAreaInsets();
  const [goalId, setGoalId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>(TaskType.TIME_BASED);
  const [plannedDate, setPlannedDate] = useState(new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('60');
  const [targetValue, setTargetValue] = useState('1');
  const [targetUnit, setTargetUnit] = useState('unit');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const defaultEndTime = initialStartTime ? addMinutesToTime(initialStartTime, 60) : '';

  useEffect(() => {
    if (!visible) {
      return;
    }

    setGoalId(task?.goalId ?? goals[0]?.id ?? '');
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setTaskType(task?.type ?? TaskType.TIME_BASED);
    setPlannedDate(task?.plannedDate ?? selectedDate);
    setStartTime(task?.startTime ?? initialStartTime ?? '');
    setEndTime(task?.endTime ?? defaultEndTime);
    setEstimatedMinutes(task?.estimatedMinutes ? String(task.estimatedMinutes) : '60');
    setTargetValue(task?.targetValue ? String(task.targetValue) : '1');
    setTargetUnit(task?.targetUnit ?? 'unit');
    setShowAdvancedOptions(Boolean(task?.description || task?.type === TaskType.UNIT_BASED));
  }, [defaultEndTime, goals, initialStartTime, selectedDate, task, visible]);

  useEffect(() => {
    if (!visible || task || !startTime.trim() || taskType !== TaskType.TIME_BASED) {
      return;
    }

    const duration = Number.parseInt(estimatedMinutes, 10);

    if (!Number.isNaN(duration) && duration > 0) {
      setEndTime(addMinutesToTime(startTime.trim(), duration));
    }
  }, [estimatedMinutes, startTime, task, taskType, visible]);

  const handleSubmit = async () => {
    if (task) {
      await onUpdate(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        type: taskType,
        plannedDate,
        startTime: startTime.trim() || null,
        endTime: endTime.trim() || null,
        estimatedMinutes: taskType === TaskType.TIME_BASED ? Number(estimatedMinutes) || null : null,
        targetValue: taskType === TaskType.UNIT_BASED ? Number(targetValue) || null : null,
        targetUnit: taskType === TaskType.UNIT_BASED ? targetUnit.trim() || null : null,
      });
      return;
    }

    await onCreate({
      goalId,
      title: title.trim(),
      description: description.trim() || undefined,
      type: taskType,
      plannedDate,
      startTime: startTime.trim() || undefined,
      endTime: endTime.trim() || undefined,
      estimatedMinutes: taskType === TaskType.TIME_BASED ? Number(estimatedMinutes) || undefined : undefined,
      targetValue: taskType === TaskType.UNIT_BASED ? Number(targetValue) || undefined : undefined,
      targetUnit: taskType === TaskType.UNIT_BASED ? targetUnit.trim() || undefined : undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{task ? 'Edit Task' : 'Quick Add Task'}</Text>
                <Text style={styles.subtitle}>
                  {task ? 'Adjust time, date, or details.' : 'Capture a task fast, then place it into the day.'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={[styles.content, { paddingBottom: 12 }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {!task ? (
                <View style={styles.field}>
                  <Text style={styles.label}>Goal</Text>
                  {goals.length === 0 ? (
                    <View style={styles.emptyGoalsState}>
                      <Text style={styles.emptyGoalsStateText}>Create a goal first. Tasks must belong to a goal.</Text>
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalChips}>
                      {goals.map((goal) => (
                        <TouchableOpacity
                          key={goal.id}
                          style={[styles.goalChip, goalId === goal.id && styles.goalChipActive]}
                          onPress={() => setGoalId(goal.id)}
                        >
                          <Text style={[styles.goalChipText, goalId === goal.id && styles.goalChipTextActive]} numberOfLines={1}>
                            {goal.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              ) : null}

              <View style={styles.field}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="What do you need to do?"
                  placeholderTextColor="#555"
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                  returnKeyType="next"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Planned Date</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                  <Calendar size={16} color="#A855F7" />
                  <Text style={styles.dateButtonText}>{plannedDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker ? (
                  <DateTimePicker
                    value={plannedDate}
                    mode="date"
                    display="default"
                    onChange={(_event, nextDate) => {
                      setShowDatePicker(false);

                      if (nextDate) {
                        setPlannedDate(nextDate);
                      }
                    }}
                  />
                ) : null}
              </View>

              <View style={styles.row}>
                <View style={[styles.field, styles.rowField]}>
                  <Text style={styles.label}>Start</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Optional HH:mm"
                    placeholderTextColor="#555"
                    value={startTime}
                    onChangeText={setStartTime}
                  />
                </View>
                <View style={[styles.field, styles.rowField]}>
                  <Text style={styles.label}>End</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Auto-filled"
                    placeholderTextColor="#555"
                    value={endTime}
                    onChangeText={setEndTime}
                  />
                </View>
              </View>

              {taskType === TaskType.TIME_BASED ? (
                <View style={styles.field}>
                  <Text style={styles.label}>Quick Duration</Text>
                  <View style={styles.quickOptionsRow}>
                    {[30, 60, 90, 120].map((minutes) => (
                      <Pressable
                        key={minutes}
                        style={({ pressed }) => [
                          styles.quickOption,
                          estimatedMinutes === String(minutes) && styles.quickOptionActive,
                          pressed && styles.quickOptionPressed,
                        ]}
                        onPress={() => setEstimatedMinutes(String(minutes))}
                      >
                        <Text
                          style={[
                            styles.quickOptionText,
                            estimatedMinutes === String(minutes) && styles.quickOptionTextActive,
                          ]}
                        >
                          {minutes}m
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}

              <TouchableOpacity style={styles.advancedToggle} onPress={() => setShowAdvancedOptions((value) => !value)}>
                <Text style={styles.advancedToggleText}>
                  {showAdvancedOptions ? 'Hide extra options' : 'More options'}
                </Text>
              </TouchableOpacity>

              {showAdvancedOptions ? (
                <>
                  <View style={styles.field}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Optional details"
                      placeholderTextColor="#555"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Task Type</Text>
                    <View style={styles.segmented}>
                      {[TaskType.TIME_BASED, TaskType.UNIT_BASED].map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[styles.segmentButton, taskType === option && styles.segmentButtonActive]}
                          onPress={() => setTaskType(option)}
                        >
                          <Text style={[styles.segmentButtonText, taskType === option && styles.segmentButtonTextActive]}>
                            {option === TaskType.TIME_BASED ? 'Time-based' : 'Unit-based'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {taskType === TaskType.UNIT_BASED ? (
                    <View style={styles.row}>
                      <View style={[styles.field, styles.rowField]}>
                        <Text style={styles.label}>Target Value</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="1"
                          placeholderTextColor="#555"
                          keyboardType="numeric"
                          value={targetValue}
                          onChangeText={setTargetValue}
                        />
                      </View>
                      <View style={[styles.field, styles.rowField]}>
                        <Text style={styles.label}>Unit</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="chapters"
                          placeholderTextColor="#555"
                          value={targetUnit}
                          onChangeText={setTargetUnit}
                        />
                      </View>
                    </View>
                  ) : null}
                </>
              ) : null}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
              <TouchableOpacity
                style={[styles.submitButton, (!task && goals.length === 0) && styles.submitButtonDisabled]}
                onPress={() => void handleSubmit()}
                disabled={isLoading || (!task && goals.length === 0)}
              >
                <Text style={styles.submitButtonText}>{isLoading ? 'Saving...' : task ? 'Save Task' : 'Create Task'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#050505',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderColor: '#1F1F1F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#7C7C7C',
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: 18,
  },
  field: {
    gap: 10,
  },
  label: {
    color: '#A3A3A3',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#fff',
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  goalChips: {
    gap: 8,
  },
  goalChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#111',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#222',
    maxWidth: 220,
  },
  goalChipActive: {
    backgroundColor: '#A855F722',
    borderColor: '#A855F7',
  },
  goalChipText: {
    color: '#9A9A9A',
    fontWeight: '600',
  },
  goalChipTextActive: {
    color: '#fff',
  },
  emptyGoalsState: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    padding: 14,
  },
  emptyGoalsStateText: {
    color: '#8A8A8A',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateButtonText: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  quickOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  quickOptionActive: {
    backgroundColor: '#A855F722',
    borderColor: '#A855F7',
  },
  quickOptionPressed: {
    opacity: 0.85,
  },
  quickOptionText: {
    color: '#9A9A9A',
    fontWeight: '600',
  },
  quickOptionTextActive: {
    color: '#fff',
  },
  advancedToggle: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  advancedToggleText: {
    color: '#A855F7',
    fontWeight: '600',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#A855F7',
  },
  segmentButtonText: {
    color: '#8A8A8A',
    fontWeight: '600',
  },
  segmentButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#A855F7',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    paddingTop: 16,
  },
});

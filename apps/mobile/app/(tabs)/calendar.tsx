import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AvailabilitySlot, Goal, GoalPriority, GoalStatus, Task, TaskStatus } from '@packages/shared';
import { Sparkles } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { PlannerHeader, PlannerView } from '../../src/components/PlannerHeader';
import { MonthView } from '../../src/components/MonthView';
import { WeekView } from '../../src/components/WeekView';
import { DayView } from '../../src/components/DayView';
import { ScheduleBlockModal } from '../../src/components/ScheduleBlockModal';
import { TaskScheduleModal } from '../../src/components/TaskScheduleModal';
import { PlanDaySheet } from '../../src/components/PlanDaySheet';
import { FloatingTabCta } from '../../src/components/FloatingTabCta';
import { getSuggestedPlannerStartTime } from '../../src/lib/planner';

export default function CalendarScreen() {
  const params = useLocalSearchParams<{
    focusTaskId?: string;
    focusDate?: string;
    focusTime?: string;
    focusNonce?: string;
  }>();
  const tasks = useStore((state) => state.tasks);
  const goals = useStore((state) => state.goals);
  const availability = useStore((state) => state.availability);
  const isLoading = useStore((state) => state.isLoading);
  const fetchGoals = useStore((state) => state.fetchGoals);
  const fetchTasks = useStore((state) => state.fetchTasks);
  const createTask = useStore((state) => state.createTask);
  const updateTask = useStore((state) => state.updateTask);
  const updateTaskStatus = useStore((state) => state.updateTaskStatus);
  const fetchAvailability = useStore((state) => state.fetchAvailability);
  const createAvailability = useStore((state) => state.createAvailability);
  const updateAvailability = useStore((state) => state.updateAvailability);
  const deleteAvailability = useStore((state) => state.deleteAvailability);
  const [view, setView] = useState<PlannerView>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [planDaySheetVisible, setPlanDaySheetVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [prefilledStartTime, setPrefilledStartTime] = useState<string | undefined>(undefined);
  const [focusedTaskId, setFocusedTaskId] = useState<string | undefined>(undefined);
  const [focusedTime, setFocusedTime] = useState<string | undefined>(undefined);
  const [focusRequestKey, setFocusRequestKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    void Promise.all([fetchGoals(), fetchTasks(), fetchAvailability()]).catch((error) => {
      const message = error instanceof Error ? error.message : 'Unable to load planner';
      Alert.alert('Planner Load Failed', message);
    });
  }, [fetchAvailability, fetchGoals, fetchTasks]);

  useEffect(() => {
    if (!params.focusDate || !params.focusNonce) {
      return;
    }

    const focusDate = new Date(params.focusDate);

    if (Number.isNaN(focusDate.getTime())) {
      return;
    }

    setSelectedDate(focusDate);
    setView('day');
    setFocusedTaskId(params.focusTaskId);
    setFocusedTime(params.focusTime);
    setFocusRequestKey(params.focusNonce);
  }, [params.focusDate, params.focusNonce, params.focusTaskId, params.focusTime]);

  const activeGoals = useMemo(() => goals.filter((goal) => goal.status !== GoalStatus.ARCHIVED), [goals]);

  const handlePrev = () => {
    const nextDate = new Date(selectedDate);
    if (view === 'month') nextDate.setMonth(nextDate.getMonth() - 1);
    else if (view === 'week') nextDate.setDate(nextDate.getDate() - 7);
    else nextDate.setDate(nextDate.getDate() - 1);
    setSelectedDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(selectedDate);
    if (view === 'month') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (view === 'week') nextDate.setDate(nextDate.getDate() + 7);
    else nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate);
  };

  const openScheduleModal = (slot?: AvailabilitySlot | null, startTime?: string) => {
    setSelectedSlot(slot ?? null);
    setPrefilledStartTime(startTime);
    setScheduleModalVisible(true);
  };

  const openTaskModal = (task?: Task | null, startTime?: string) => {
    setSelectedTask(task ?? null);
    setPrefilledStartTime(startTime);
    setTaskModalVisible(true);
  };

  const closeScheduleModal = () => {
    setScheduleModalVisible(false);
    setSelectedSlot(null);
    setPrefilledStartTime(undefined);
  };

  const closeTaskModal = () => {
    setTaskModalVisible(false);
    setSelectedTask(null);
    setPrefilledStartTime(undefined);
  };

  const closePlanDaySheet = () => {
    setPlanDaySheetVisible(false);
  };

  const handleSaveScheduleBlock = async (input: {
    dayOfWeek: number;
    startDate?: Date;
    startTime: string;
    endTime: string;
    type: AvailabilitySlot['type'];
    label?: string;
    recurrenceType?: AvailabilitySlot['recurrenceType'];
    recurrenceDaysOfWeek?: number[];
    recurrenceEndDate?: Date;
  }) => {
    try {
      if (selectedSlot) {
        await updateAvailability(selectedSlot.seriesId ?? selectedSlot.id, input);
      } else {
        await createAvailability(input);
      }

      closeScheduleModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save routine block';
      Alert.alert('Save Failed', message);
    }
  };

  const handleDeleteScheduleBlock = async () => {
    if (!selectedSlot) {
      return;
    }

    try {
      await deleteAvailability(selectedSlot.seriesId ?? selectedSlot.id);
      closeScheduleModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete routine block';
      Alert.alert('Delete Failed', message);
    }
  };

  const handleCreateTask = async (input: {
    goalId?: string;
    title: string;
    description?: string;
    priority?: GoalPriority;
    type: Task['type'];
    plannedDate: Date;
    startTime?: string;
    endTime?: string;
    estimatedMinutes?: number;
    targetValue?: number;
    targetUnit?: string;
    recurrenceType?: Task['recurrenceType'];
    recurrenceDaysOfWeek?: number[];
    recurrenceEndDate?: Date;
  }) => {
    try {
      await createTask(input);
      await Promise.all([
        fetchTasks(input.goalId),
        ...(input.goalId ? [fetchGoalIfLoaded(input.goalId, activeGoals, useStore.getState().fetchGoal)] : []),
      ]);
      closeTaskModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create task';
      Alert.alert('Create Task Failed', message);
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    input: {
      title?: string;
      description?: string | null;
      priority?: GoalPriority | null;
      type?: Task['type'];
      plannedDate?: Date;
      startTime?: string | null;
      endTime?: string | null;
      estimatedMinutes?: number | null;
      targetValue?: number | null;
      targetUnit?: string | null;
      recurrenceType?: Task['recurrenceType'];
      recurrenceDaysOfWeek?: number[];
      recurrenceEndDate?: Date | null;
    },
  ) => {
    try {
      const updatedTask = await updateTask(taskId, input);
      await Promise.all([
        fetchTasks(updatedTask.goalId),
        ...(updatedTask.goalId ? [useStore.getState().fetchGoal(updatedTask.goalId)] : []),
      ]);
      closeTaskModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update task';
      Alert.alert('Update Task Failed', message);
    }
  };

  const handleCompleteTask = async (task: Task) => {
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

  const renderView = () => {
    switch (view) {
      case 'month':
        return (
          <MonthView
            selectedDate={selectedDate}
            tasks={tasks}
            goals={goals}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setView('day');
            }}
          />
        );
      case 'week':
        return <WeekView selectedDate={selectedDate} tasks={tasks} />;
      case 'day':
      default:
        return (
          <DayView
            selectedDate={selectedDate}
            tasks={tasks}
            availability={availability}
            focusedTaskId={focusedTaskId}
            focusedTime={focusedTime}
            focusRequestKey={focusRequestKey}
            onEditTask={(task) => openTaskModal(task)}
            onToggleTaskComplete={handleCompleteTask}
            onAddScheduleBlock={(startTime) => openScheduleModal(null, startTime)}
            onEditScheduleBlock={(slot) => openScheduleModal(slot)}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <PlannerHeader
        view={view}
        setView={setView}
        selectedDate={selectedDate}
        onPrev={handlePrev}
        onNext={handleNext}
      />
      <View style={styles.content}>{renderView()}</View>
      {view === 'day' ? (
        <FloatingTabCta
          label="Plan Day"
          icon={<Sparkles size={18} color="#fff" />}
          onPress={() => setPlanDaySheetVisible(true)}
        />
      ) : null}

      <ScheduleBlockModal
        visible={scheduleModalVisible}
        selectedDate={selectedDate}
        slot={selectedSlot}
        initialStartTime={prefilledStartTime}
        onClose={closeScheduleModal}
        onSave={handleSaveScheduleBlock}
        onDelete={selectedSlot ? handleDeleteScheduleBlock : undefined}
        isLoading={isLoading}
      />

      <TaskScheduleModal
        visible={taskModalVisible}
        goals={activeGoals}
        selectedDate={selectedDate}
        task={selectedTask}
        initialStartTime={prefilledStartTime}
        onClose={closeTaskModal}
        onCreate={handleCreateTask}
        onUpdate={handleUpdateTask}
        isLoading={isLoading}
      />

      <PlanDaySheet
        visible={planDaySheetVisible}
        selectedDate={selectedDate}
        onClose={closePlanDaySheet}
        onAddScheduledTask={() => {
          closePlanDaySheet();
          openTaskModal(null, getSuggestedPlannerStartTime(selectedDate));
        }}
        onAddUnscheduledTask={() => {
          closePlanDaySheet();
          openTaskModal(null, undefined);
        }}
        onAddRoutineBlock={() => {
          closePlanDaySheet();
          openScheduleModal(null, getSuggestedPlannerStartTime(selectedDate));
        }}
      />
    </View>
  );
}

async function fetchGoalIfLoaded(goalId: string | undefined, goals: Goal[], fetchGoal: (goalId: string) => Promise<Goal>) {
  if (!goalId) {
    return;
  }

  if (!goals.some((goal) => goal.id === goalId)) {
    return;
  }

  await fetchGoal(goalId);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
});

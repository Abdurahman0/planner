import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ArrowRight, CalendarClock, Play, TriangleAlert } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { FLOATING_CTA_CLEARANCE } from '../../src/components/FloatingTabCta';
import {
  getAvailabilityColor,
  getAvailabilityLabel,
  getNextActionForTime,
  getNextPlanBlockForTime,
  getPriorityColor,
  getPriorityLabel,
  getTaskPriority,
  parseTimeToMinutes,
} from '../../src/lib/planner';

export default function Dashboard() {
  const tasks = useStore((state) => state.tasks);
  const availability = useStore((state) => state.availability);
  const fetchTasks = useStore((state) => state.fetchTasks);
  const fetchAvailability = useStore((state) => state.fetchAvailability);
  const router = useRouter();

  useEffect(() => {
    void Promise.all([fetchTasks(), fetchAvailability()]).catch((error) => {
      const message = error instanceof Error ? error.message : 'Unable to load dashboard';
      Alert.alert('Load Failed', message);
    });
  }, [fetchAvailability, fetchTasks]);

  const today = new Date();
  const nextAction = getNextActionForTime(tasks, today, new Date());
  const nextPlanBlock = getNextPlanBlockForTime(availability, today, new Date());
  const shouldShowPlanBlock =
    Boolean(nextPlanBlock) &&
    (!nextAction || (
      Boolean(nextAction.startTime) &&
      parseTimeToMinutes(nextPlanBlock!.startTime) < parseTimeToMinutes(nextAction.startTime!)
    ));

  const openPlanner = () => {
    router.push('/(tabs)/calendar');
  };

  const openPlannerForTask = () => {
    if (!nextAction) {
      openPlanner();
      return;
    }

    const focusDate = (nextAction.occurrenceDate ?? nextAction.plannedDate).toISOString();
    const focusTaskId = nextAction.seriesId ?? nextAction.id;

    const focusNonce = `${focusTaskId}:${focusDate}:${Date.now()}`;

    if (nextAction.goalId) {
      router.push({
        pathname: '/goals/[id]',
        params: {
          id: nextAction.goalId,
          focusTaskId,
          focusDate,
          focusNonce,
        },
      });
      return;
    }

    router.push({
      pathname: '/(tabs)/calendar',
      params: {
        focusTaskId,
        focusDate,
        focusNonce,
      },
    });
  };

  const openPlannerForPlanBlock = () => {
    if (!nextPlanBlock) {
      openPlanner();
      return;
    }

    router.push({
      pathname: '/(tabs)/calendar',
      params: {
        focusDate: selectedDateIso(today),
        focusTime: nextPlanBlock.startTime,
        focusNonce: `plan-block:${nextPlanBlock.id}:${selectedDateIso(today)}:${Date.now()}`,
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: FLOATING_CTA_CLEARANCE }]}>
        <View style={styles.header}>
          <Text style={styles.title}>What to do now</Text>
          <Text style={styles.subtitle}>
            {today.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {shouldShowPlanBlock && nextPlanBlock ? (
          <PlanBlockCard slot={nextPlanBlock} onViewPlan={openPlannerForPlanBlock} />
        ) : nextAction ? (
          <NextActionCard
            task={nextAction}
            actionLabel="Start Now"
            onStart={openPlannerForTask}
          />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No task needs your attention right now.</Text>
            <Text style={styles.emptyBody}>Open Planner and place today&apos;s work into the day.</Text>
          </View>
        )}

        <Pressable style={styles.primaryButton} onPress={openPlanner}>
          <CalendarClock size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Plan Today</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={openPlanner}>
          <Text style={styles.secondaryButtonText}>View all today tasks</Text>
          <ArrowRight size={16} color="#A3A3A3" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function PlanBlockCard({
  slot,
  onViewPlan,
}: {
  slot: ReturnType<typeof getNextPlanBlockForTime>;
  onViewPlan: () => void;
}) {
  if (!slot) {
    return null;
  }

  const accentColor = getAvailabilityColor(slot.type);

  return (
    <View style={[styles.nextActionCard, { borderColor: `${accentColor}44`, backgroundColor: '#0E0E0E' }]}>
      <View style={styles.cardTopRow}>
        <View style={[styles.priorityPill, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}55` }]}>
          <Text style={[styles.priorityText, { color: accentColor }]}>Routine block</Text>
        </View>
        <Text style={styles.cardHint}>Next plan block</Text>
      </View>

      <Text style={styles.taskTitle}>{getAvailabilityLabel(slot)}</Text>
      <Text style={styles.taskReason}>Routine blocks are time plans you do not mark done.</Text>
      <Text style={styles.taskTime}>{`${slot.startTime} - ${slot.endTime}`}</Text>

      <Pressable style={styles.startButton} onPress={onViewPlan}>
        <Play size={16} color="#fff" />
        <Text style={styles.startButtonText}>View Plan</Text>
      </Pressable>
    </View>
  );
}

function NextActionCard({
  task,
  actionLabel,
  onStart,
}: {
  task: ReturnType<typeof getNextActionForTime>;
  actionLabel: string;
  onStart: () => void;
}) {
  if (!task) {
    return null;
  }

  const priority = getTaskPriority(task);
  const priorityColor = getPriorityColor(priority);
  const isHighPriority = priority === 'high';
  const timeLabel = task.startTime
    ? `Scheduled for ${task.startTime}`
    : 'Unscheduled for today';
  const reasonText = isHighPriority
    ? 'This is your most important task.'
    : task.startTime
      ? "This is the next task in today's plan."
      : 'This is the next task that needs a time.';

  return (
    <View style={[styles.nextActionCard, isHighPriority && styles.nextActionCardHigh]}>
      <View style={styles.cardTopRow}>
        <View style={[styles.priorityPill, { backgroundColor: `${priorityColor}22`, borderColor: `${priorityColor}55` }]}>
          {isHighPriority ? <TriangleAlert size={12} color={priorityColor} /> : null}
          <Text style={[styles.priorityText, { color: priorityColor }]}>{getPriorityLabel(priority)}</Text>
        </View>
        <Text style={styles.cardHint}>{isHighPriority ? 'High priority task now' : 'Next Action'}</Text>
      </View>

      <Text style={styles.taskTitle}>{task.title}</Text>
      <Text style={styles.taskReason}>{reasonText}</Text>
      <Text style={styles.taskTime}>{timeLabel}</Text>

      <Pressable style={styles.startButton} onPress={onStart}>
        <Play size={16} color="#fff" />
        <Text style={styles.startButtonText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function selectedDateIso(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    justifyContent: 'center',
    gap: 18,
  },
  header: {
    gap: 6,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: '#888',
  },
  nextActionCard: {
    backgroundColor: '#101010',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#232323',
    padding: 22,
    gap: 14,
  },
  nextActionCardHigh: {
    backgroundColor: '#160909',
    borderColor: '#7F1D1D',
    shadowColor: '#EF4444',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardHint: {
    color: '#9A9A9A',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  taskTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  taskReason: {
    color: '#D4D4D4',
    fontSize: 15,
    lineHeight: 22,
  },
  taskTime: {
    color: '#A3A3A3',
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: '#A855F7',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 18,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#242424',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  secondaryButtonText: {
    color: '#A3A3A3',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#101010',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#232323',
    padding: 22,
    gap: 10,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  emptyBody: {
    color: '#A3A3A3',
    fontSize: 15,
    lineHeight: 22,
  },
});

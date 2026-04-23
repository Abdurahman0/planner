import { create } from 'zustand';
import { User, Goal, Task, SubscriptionPlan, GoalType, TaskStatus, TaskType, AvailabilitySlot, AvailabilityType, Priority, GoalStatus } from '@packages/shared';

interface AppState {
  user: User | null;
  goals: Goal[];
  tasks: Task[];
  availability: AvailabilitySlot[];
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setGoals: (goals: Goal[]) => void;
  setTasks: (tasks: Task[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  removeGoal: (goalId: string) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
}

const MOCK_USER: User = {
  id: 'u1',
  email: 'premium@example.com',
  subscriptionPlan: SubscriptionPlan.AI_BASIC,
  createdAt: new Date(),
};

const MOCK_GOALS: Goal[] = [
  {
    id: 'g1',
    userId: 'u1',
    title: 'Learn NestJS & Prisma',
    type: GoalType.AI_MANAGED,
    priority: Priority.HIGH,
    status: GoalStatus.IN_PROGRESS,
    targetDate: new Date('2026-05-01'),
    projectedDate: new Date('2026-05-05'),
    isCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'g2',
    userId: 'u1',
    title: 'Daily Workout',
    type: GoalType.MANUAL,
    priority: Priority.MEDIUM,
    status: GoalStatus.IN_PROGRESS,
    targetDate: new Date('2026-12-31'),
    projectedDate: new Date('2026-12-31'),
    isCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const generateHistoricalTasks = () => {
  const tasks: Task[] = [];
  const now = new Date();
  for (let i = 14; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate 3-5 tasks per day
    const count = Math.floor(Math.random() * 3) + 3;
    for (let j = 0; j < count; j++) {
      const isDone = Math.random() > 0.3;
      tasks.push({
        id: `hist-${i}-${j}`,
        goalId: j % 2 === 0 ? 'g1' : 'g2',
        title: `Historical Task ${i}-${j}`,
        status: isDone ? TaskStatus.DONE : (Math.random() > 0.5 ? TaskStatus.FAILED : TaskStatus.TODO),
        type: TaskType.TIME_BASED,
        plannedDate: date,
        isAiGenerated: Math.random() > 0.5,
        order: j,
      });
    }
  }
  return tasks;
};

const MOCK_TASKS: Task[] = [
  ...generateHistoricalTasks(),
  {
    id: 't1',
    goalId: 'g1',
    title: 'Setup Project Structure',
    status: TaskStatus.DONE,
    type: TaskType.TIME_BASED,
    plannedDate: new Date(),
    startTime: '09:00',
    endTime: '10:30',
    isAiGenerated: true,
    order: 1,
  },
  {
    id: 't2',
    goalId: 'g1',
    title: 'Define Prisma Schema',
    status: TaskStatus.TODO,
    type: TaskType.TIME_BASED,
    plannedDate: new Date(),
    startTime: '11:00',
    endTime: '12:00',
    isAiGenerated: true,
    order: 2,
  },
  {
    id: 't3',
    goalId: 'g2',
    title: 'Morning Run (5km)',
    status: TaskStatus.TODO,
    type: TaskType.UNIT_BASED,
    plannedDate: new Date(),
    startTime: '07:00',
    endTime: '08:00',
    unitTarget: 5,
    unitName: 'km',
    isAiGenerated: false,
    order: 1,
  },
  {
    id: 't4',
    goalId: 'g1',
    title: 'Review Documentation',
    status: TaskStatus.TODO,
    type: TaskType.TIME_BASED,
    plannedDate: new Date(),
    isAiGenerated: false,
    order: 3,
  },
];

const MOCK_AVAILABILITY: AvailabilitySlot[] = [
  { id: 'a1', type: AvailabilityType.SLEEP, startTime: '00:00', endTime: '07:00', daysOfWeek: [0,1,2,3,4,5,6] },
  { id: 'a2', type: AvailabilityType.WORK, startTime: '09:00', endTime: '17:00', daysOfWeek: [1,2,3,4,5] },
  { id: 'a3', type: AvailabilityType.SLEEP, startTime: '23:00', endTime: '23:59', daysOfWeek: [0,1,2,3,4,5,6] },
];

export const useStore = create<AppState>((set) => ({
  user: MOCK_USER,
  goals: MOCK_GOALS,
  tasks: MOCK_TASKS,
  availability: MOCK_AVAILABILITY,
  isLoading: false,
  setUser: (user) => set({ user }),
  setGoals: (goals) => set({ goals }),
  setTasks: (tasks) => set({ tasks }),
  addGoal: (goal) => set((state) => ({ goals: [goal, ...state.goals] })),
  updateGoal: (goalId, updates) =>
    set((state) => ({
      goals: state.goals.map((g) => (g.id === goalId ? { ...g, ...updates, updatedAt: new Date() } : g)),
    })),
  removeGoal: (goalId) =>
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== goalId),
      tasks: state.tasks.filter((t) => t.goalId !== goalId),
    })),
  updateTaskStatus: (taskId, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status } : t
      ),
    })),
}));

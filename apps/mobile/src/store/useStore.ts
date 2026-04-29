import { Alert } from 'react-native';
import { create } from 'zustand';
import {
  Goal,
  GoalPriority,
  GoalType,
  Notification,
  NotificationSummary,
  Task,
  TaskStatus,
  TaskType,
  User,
  AvailabilitySlot,
} from '@packages/shared';
import {
  ApiError,
  UnauthorizedError,
  createAvailabilityRequest,
  createGoalRequest,
  createTaskRequest,
  deleteAvailabilityRequest,
  fetchAvailabilityRequest,
  fetchCurrentUser,
  fetchGoal,
  fetchGoals,
  fetchNotificationSummaryRequest,
  fetchNotificationsRequest,
  fetchTasks,
  loginRequest,
  markNotificationReadRequest,
  refreshNotificationsRequest,
  registerDeviceRequest,
  registerRequest,
  sendTestPushRequest,
  updateAvailabilityRequest,
  updateTaskRequest,
  updateTaskStatusRequest,
  type CreateAvailabilityInput,
  type CreateGoalInput,
  type CreateTaskInput,
  type TestPushResult,
  type UpdateAvailabilityInput,
  type UpdateTaskInput,
  type UpdateTaskStatusInput,
} from '../lib/api';
import {
  NOTIFICATION_PERMISSION_MESSAGE,
  registerForPushNotificationsAsync,
} from '../lib/pushNotifications';
import { clearStoredToken, getStoredToken, storeToken } from '../lib/tokenStorage';

interface AppState {
  token: string | null;
  user: User | null;
  goals: Goal[];
  tasks: Task[];
  notifications: Notification[];
  notificationSummary: NotificationSummary | null;
  availability: AvailabilitySlot[];
  notificationPermissionNotice: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  clearNotificationPermissionNotice: () => void;
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchGoals: () => Promise<void>;
  fetchGoal: (goalId: string) => Promise<Goal>;
  createGoal: (input: CreateGoalInput) => Promise<Goal>;
  fetchTasks: (goalId?: string) => Promise<Task[]>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (taskId: string, input: UpdateTaskInput) => Promise<Task>;
  updateTaskStatus: (taskId: string, input: UpdateTaskStatusInput) => Promise<void>;
  fetchAvailability: () => Promise<AvailabilitySlot[]>;
  createAvailability: (input: CreateAvailabilityInput) => Promise<AvailabilitySlot>;
  updateAvailability: (slotId: string, input: UpdateAvailabilityInput) => Promise<AvailabilitySlot>;
  deleteAvailability: (slotId: string) => Promise<void>;
  fetchNotifications: () => Promise<Notification[]>;
  fetchNotificationSummary: () => Promise<NotificationSummary>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  sendTestPush: () => Promise<TestPushResult>;
}

export const useStore = create<AppState>((set, get) => ({
  token: null,
  user: null,
  goals: [],
  tasks: [],
  notifications: [],
  notificationSummary: null,
  availability: [],
  notificationPermissionNotice: null,
  isLoading: false,
  isInitialized: false,

  clearNotificationPermissionNotice: () => {
    set({ notificationPermissionNotice: null });
  },

  initializeAuth: async () => {
    if (get().isInitialized) {
      return;
    }

    set({ isLoading: true });

    try {
      const token = await getStoredToken();

      if (!token) {
        set({
          token: null,
          user: null,
          goals: [],
          tasks: [],
          notifications: [],
          notificationSummary: null,
          availability: [],
          notificationPermissionNotice: null,
          isInitialized: true,
          isLoading: false,
        });
        return;
      }

      const user = await fetchCurrentUser(token);
      set({ token, user });
      await hydrateAppData(token, set);
      await syncPushRegistration(token, set);
      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      await clearStoredToken();
      set({
        token: null,
        user: null,
        goals: [],
        tasks: [],
        notifications: [],
        notificationSummary: null,
        availability: [],
        notificationPermissionNotice: null,
        isInitialized: true,
        isLoading: false,
      });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });

    try {
      const response = await loginRequest(email.trim().toLowerCase(), password);
      await storeToken(response.accessToken);
      set({
        token: response.accessToken,
        user: response.user,
      });
      await hydrateAppData(response.accessToken, set);
      await syncPushRegistration(response.accessToken, set);
      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw normalizeError(error);
    }
  },

  register: async (email: string, password: string) => {
    set({ isLoading: true });

    try {
      const response = await registerRequest(email.trim().toLowerCase(), password);
      await storeToken(response.accessToken);
      set({
        token: response.accessToken,
        user: response.user,
      });
      await hydrateAppData(response.accessToken, set);
      await syncPushRegistration(response.accessToken, set);
      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw normalizeError(error);
    }
  },

  logout: async () => {
    await clearStoredToken();
    set({
      token: null,
      user: null,
      goals: [],
      tasks: [],
      notifications: [],
      notificationSummary: null,
      availability: [],
      notificationPermissionNotice: null,
      isLoading: false,
      isInitialized: true,
    });
  },

  fetchGoals: async () => {
    const token = requireToken(get);

    try {
      const goals = await fetchGoals(token);
      set({ goals });
    } catch (error) {
      await handleApiError(error, set);
      throw normalizeError(error);
    }
  },

  fetchGoal: async (goalId: string) => {
    const token = requireToken(get);

    try {
      const goal = await fetchGoal(token, goalId);
      set((state) => ({
        goals: upsertById(state.goals, goal),
      }));
      return goal;
    } catch (error) {
      await handleApiError(error, set);
      throw normalizeError(error);
    }
  },

  createGoal: async (input: CreateGoalInput) => {
    const token = requireToken(get);

    try {
      const goal = await createGoalRequest(token, input);
      set((state) => ({
        goals: [goal, ...state.goals.filter((item) => item.id !== goal.id)],
      }));
      return goal;
    } catch (error) {
      await handleApiError(error, set);
      throw normalizeError(error);
    }
  },

  fetchTasks: async (goalId?: string) => {
    const token = requireToken(get);

    try {
      const fetchedTasks = await fetchTasks(token, goalId);

      set((state) => ({
        tasks: goalId
          ? mergeTasksForGoal(state.tasks, goalId, fetchedTasks)
          : fetchedTasks,
      }));

      return fetchedTasks;
    } catch (error) {
      await handleApiError(error, set);
      throw normalizeError(error);
    }
  },

  createTask: async (input: CreateTaskInput) => {
    const token = requireToken(get);

    try {
      const task = await createTaskRequest(token, input);
      set((state) => ({
        tasks: upsertById(state.tasks, task),
      }));
      return task;
    } catch (error) {
      await handleApiError(error, set);
      throw normalizeError(error);
    }
  },

  updateTask: async (taskId: string, input: UpdateTaskInput) => {
    const token = requireToken(get);

    try {
      const task = await updateTaskRequest(token, taskId, input);
      set((state) => ({
        tasks: upsertById(state.tasks, task),
      }));
      return task;
    } catch (error) {
      await handleApiError(error, set);
      throw normalizeError(error);
    }
  },

  updateTaskStatus: async (taskId: string, input: UpdateTaskStatusInput) => {
    const token = requireToken(get);
    const task = get().tasks.find((item) => item.id === taskId || item.seriesId === taskId);

    try {
      const result = await updateTaskStatusRequest(token, taskId, input);
      const goalId = task?.goalId ?? result.task.goalId;

      await Promise.all([
        get().fetchTasks(goalId),
        ...(goalId ? [get().fetchGoal(goalId)] : []),
        get().fetchNotifications(),
        get().fetchNotificationSummary(),
      ]);
    } catch (error) {
      await handleApiError(error, set);
      throw normalizeError(error);
    }
  },

  fetchAvailability: async () => {
    const token = requireToken(get);

    try {
      const availability = await fetchAvailabilityRequest(token);
      set({ availability });
      return availability;
    } catch (error) {
      await handleApiError(error, set);
      throw normalizeError(error);
    }
  },

  createAvailability: async (input: CreateAvailabilityInput) => {
    const token = requireToken(get);

    try {
      const slot = await createAvailabilityRequest(token, input);
      set((state) => ({
        availability: upsertById(state.availability, slot).sort(compareAvailabilitySlots),
      }));
      return slot;
    } catch (error) {
      await handleApiError(error, set);
      throw normalizeError(error);
    }
  },

  updateAvailability: async (slotId: string, input: UpdateAvailabilityInput) => {
    const token = requireToken(get);

    try {
      const slot = await updateAvailabilityRequest(token, slotId, input);
      set((state) => ({
        availability: upsertById(state.availability, slot).sort(compareAvailabilitySlots),
      }));
      return slot;
    } catch (error) {
      await handleApiError(error, set);
      throw normalizeError(error);
    }
  },

  deleteAvailability: async (slotId: string) => {
    const token = requireToken(get);

    try {
      await deleteAvailabilityRequest(token, slotId);
      set((state) => ({
        availability: state.availability.filter((slot) => slot.id !== slotId),
      }));
    } catch (error) {
      await handleApiError(error, set);
      throw normalizeError(error);
    }
  },

  fetchNotifications: async () => {
    const token = requireToken(get);

    try {
      const notifications = await fetchNotificationsRequest(token);
      set({ notifications });
      return notifications;
    } catch (error) {
      await handleApiError(error, set);
      throw normalizeError(error);
    }
  },

  fetchNotificationSummary: async () => {
    const token = requireToken(get);

    try {
      const notificationSummary = await fetchNotificationSummaryRequest(token);
      set({ notificationSummary });
      return notificationSummary;
    } catch (error) {
      await handleApiError(error, set);
      throw normalizeError(error);
    }
  },

  markNotificationRead: async (notificationId: string) => {
    const token = requireToken(get);

    try {
      const notification = await markNotificationReadRequest(token, notificationId);
      set((state) => ({
        notifications: upsertById(state.notifications, notification).sort((left, right) => {
          if (left.status !== right.status) {
            return left.status.localeCompare(right.status);
          }

          return right.createdAt.getTime() - left.createdAt.getTime();
        }),
      }));

      await get().fetchNotificationSummary();
    } catch (error) {
      await handleApiError(error, set);
      throw normalizeError(error);
    }
  },

  refreshNotifications: async () => {
    const token = requireToken(get);

    try {
      await refreshNotificationsRequest(token);
      await Promise.all([get().fetchNotifications(), get().fetchNotificationSummary()]);
    } catch (error) {
      await handleApiError(error, set);
      throw normalizeError(error);
    }
  },

  sendTestPush: async () => {
    const token = requireToken(get);

    try {
      const pushSync = await syncPushRegistration(token, set);

      if (pushSync.permissionStatus === 'denied') {
        throw new Error('Enable notifications first, then try the push test again.');
      }

      if (!pushSync.registrationSucceeded) {
        throw new Error(pushSync.lastError ?? 'Push registration did not complete on this device.');
      }

      const result = await sendTestPushRequest(token);

      if (result.deviceCount === 0) {
        throw new Error('No push-ready Android device is registered yet. Grant permission and try again.');
      }

      return result;
    } catch (error) {
      await handleApiError(error, set);
      throw normalizeError(error);
    }
  },
}));

async function hydrateAppData(
  token: string,
  set: (partial: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void,
) {
  const [goals, tasks, availability] = await Promise.all([
    fetchGoals(token),
    fetchTasks(token),
    fetchAvailabilityRequest(token).catch((error) => {
      if (error instanceof ApiError && error.status === 404) {
        return [];
      }

      throw error;
    }),
  ]);
  const [notifications, notificationSummary] = await Promise.all([
    fetchNotificationsRequest(token),
    fetchNotificationSummaryRequest(token),
  ]);
    set({
      goals,
      tasks,
      notifications,
      notificationSummary,
      availability,
    });
}

async function syncPushRegistration(
  token: string,
  set: (partial: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void,
) {
  try {
    const result = await registerForPushNotificationsAsync();

    if (result.permissionStatus === 'denied') {
      set({ notificationPermissionNotice: NOTIFICATION_PERMISSION_MESSAGE });
      return {
        permissionStatus: 'denied' as const,
        registrationSucceeded: false,
        lastError: result.registrationError ?? NOTIFICATION_PERMISSION_MESSAGE,
      };
    }

    if (result.permissionStatus === 'unavailable') {
      return {
        permissionStatus: 'unavailable' as const,
        registrationSucceeded: false,
        lastError: result.registrationError ?? 'Push notifications are unavailable in this runtime.',
      };
    }

    if (!result.registration) {
      return {
        permissionStatus: 'granted' as const,
        registrationSucceeded: false,
        lastError: result.registrationError ?? 'Push token was not created on this device.',
      };
    }

    await attemptDeviceRegistration(token, result.registration);
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[push] Device registration succeeded');
    }
    set({ notificationPermissionNotice: null });
    return {
      permissionStatus: 'granted' as const,
      registrationSucceeded: true,
      lastError: null,
    };
  } catch (error) {
    // Push registration must not block app startup.
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[push] Device registration failed');
    }
    const safeError = error instanceof Error ? error.message : 'Push device registration failed.';
    return {
      permissionStatus: 'granted' as const,
      registrationSucceeded: false,
      lastError: safeError,
    };
  }
}

async function attemptDeviceRegistration(
  token: string,
  registration: {
    token: string;
    platform: 'ios' | 'android' | 'expo';
  },
) {
  try {
    return await registerDeviceRequest(token, registration);
  } catch (error) {
    await delay(1500);
    return registerDeviceRequest(token, registration);
  }
}

function requireToken(get: () => AppState) {
  const token = get().token;

  if (!token) {
    throw new Error('Not authenticated');
  }

  return token;
}

async function handleApiError(
  error: unknown,
  set: (partial: Partial<AppState>) => void,
) {
  if (error instanceof UnauthorizedError) {
    await clearStoredToken();
    set({
      token: null,
      user: null,
      goals: [],
      tasks: [],
      notifications: [],
      notificationSummary: null,
      availability: [],
      notificationPermissionNotice: null,
      isLoading: false,
      isInitialized: true,
    });
  }
}

function normalizeError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Unexpected error');
}

function upsertById<T extends { id: string }>(items: T[], nextItem: T) {
  return [nextItem, ...items.filter((item) => item.id !== nextItem.id)];
}

function mergeTasksForGoal(existingTasks: Task[], goalId: string, nextTasks: Task[]) {
  return [
    ...existingTasks.filter((task) => task.goalId !== goalId),
    ...nextTasks,
  ].sort((left, right) => {
    const dateDiff = left.plannedDate.getTime() - right.plannedDate.getTime();

    if (dateDiff !== 0) {
      return dateDiff;
    }

    return left.order - right.order;
  });
}

function compareAvailabilitySlots(left: AvailabilitySlot, right: AvailabilitySlot) {
  if (left.dayOfWeek !== right.dayOfWeek) {
    return left.dayOfWeek - right.dayOfWeek;
  }

  if (left.startTime !== right.startTime) {
    return left.startTime.localeCompare(right.startTime);
  }

  return left.endTime.localeCompare(right.endTime);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

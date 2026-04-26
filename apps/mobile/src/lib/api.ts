import Constants from 'expo-constants';
import type {
  AvailabilitySlot,
  AvailabilityType,
  Goal,
  Notification,
  NotificationStatus,
  NotificationSummary,
  NotificationType,
  GoalPriority,
  GoalStatus,
  GoalType,
  SubscriptionPlan,
  Task,
  TaskProgressLog,
  TaskStatus,
  TaskType,
  User,
} from '@packages/shared';

export interface AuthPayload {
  accessToken: string;
  user: User;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  type: GoalType;
  targetDate: Date;
  priority?: GoalPriority;
}

export interface CreateTaskInput {
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
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  type?: TaskType;
  plannedDate?: Date;
  startTime?: string | null;
  endTime?: string | null;
  estimatedMinutes?: number | null;
  targetValue?: number | null;
  targetUnit?: string | null;
}

export interface UpdateTaskStatusInput {
  status: TaskStatus;
  completionPercent?: number;
  completedValue?: number;
  note?: string;
}

export interface TaskStatusUpdateResult {
  task: Task;
  progressLog: TaskProgressLog;
  projectedDate: Date;
}

export interface RegisterDeviceInput {
  token: string;
  platform: 'ios' | 'android' | 'expo';
}

export interface CreateAvailabilityInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: AvailabilityType;
  label?: string;
}

export interface UpdateAvailabilityInput {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  type?: AvailabilityType;
  label?: string | null;
}

interface ApiGoal {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  type: GoalType;
  priority: GoalPriority;
  status: GoalStatus;
  targetDate: string;
  projectedDate: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiTask {
  id: string;
  goalId: string;
  planId?: string | null;
  milestoneId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  type: TaskType;
  plannedDate: string;
  startTime?: string | null;
  endTime?: string | null;
  completedDate?: string | null;
  estimatedMinutes?: number | null;
  targetValue?: number | null;
  completedValue?: number | null;
  targetUnit?: string | null;
  source: Task['source'];
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiProgressLog {
  id: string;
  userId: string;
  taskId: string;
  status: TaskStatus;
  completionPercent?: number | null;
  completedValue?: number | null;
  note?: string | null;
  loggedAt: string;
}

interface ApiAvailabilitySlot {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: AvailabilityType;
  label?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiUser {
  id: string;
  email: string;
  subscriptionPlan: SubscriptionPlan;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  status: NotificationStatus;
  dedupeKey?: string | null;
  metadata?: unknown;
  readAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

interface ApiNotificationSummary {
  currentStreak: number;
  bestStreak: number;
  todayCompletionRate: number;
  todayCompletedTasks: number;
  todayTotalTasks: number;
  missedTasksCount: number;
  behindGoalsCount: number;
  aheadGoalsCount: number;
  unreadCount: number;
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

const API_BASE_URL = resolveBaseUrl();
const REQUEST_TIMEOUT_MS = 10_000;

console.log('API_BASE_URL:', API_BASE_URL);

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export class UnauthorizedError extends ApiError {}

export async function testConnection() {
  const response = await request<{ status: string }>('/health');
  console.log('Health response:', response);
  return response;
}

export async function loginRequest(email: string, password: string) {
  const response = await request<{ accessToken: string; user: ApiUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return {
    accessToken: response.accessToken,
    user: normalizeUser(response.user),
  };
}

export async function registerRequest(email: string, password: string) {
  const response = await request<{ accessToken: string; user: ApiUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return {
    accessToken: response.accessToken,
    user: normalizeUser(response.user),
  };
}

export async function fetchCurrentUser(token: string) {
  const response = await request<ApiUser>('/users/me', {
    token,
  });

  return normalizeUser(response);
}

export async function fetchGoals(token: string) {
  const response = await request<ApiGoal[]>('/goals', { token });
  return response.map(normalizeGoal);
}

export async function fetchGoal(token: string, goalId: string) {
  const response = await request<ApiGoal>(`/goals/${goalId}`, { token });
  return normalizeGoal(response);
}

export async function createGoalRequest(token: string, input: CreateGoalInput) {
  const response = await request<ApiGoal>('/goals', {
    method: 'POST',
    token,
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      type: input.type,
      targetDate: input.targetDate.toISOString(),
      priority: input.priority,
    }),
  });

  return normalizeGoal(response);
}

export async function fetchTasks(token: string, goalId?: string) {
  const query = goalId ? `?goalId=${encodeURIComponent(goalId)}` : '';
  const response = await request<ApiTask[]>(`/tasks${query}`, { token });
  return response.map(normalizeTask);
}

export async function createTaskRequest(token: string, input: CreateTaskInput) {
  const response = await request<ApiTask>('/tasks', {
    method: 'POST',
    token,
    body: JSON.stringify({
      goalId: input.goalId,
      title: input.title,
      description: input.description,
      type: input.type,
      plannedDate: input.plannedDate.toISOString(),
      startTime: input.startTime,
      endTime: input.endTime,
      estimatedMinutes: input.estimatedMinutes,
      targetValue: input.targetValue,
      targetUnit: input.targetUnit,
    }),
  });

  return normalizeTask(response);
}

export async function updateTaskRequest(token: string, taskId: string, input: UpdateTaskInput) {
  const response = await request<ApiTask>(`/tasks/${taskId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({
      ...input,
      plannedDate: input.plannedDate?.toISOString(),
    }),
  });

  return normalizeTask(response);
}

export async function updateTaskStatusRequest(token: string, taskId: string, input: UpdateTaskStatusInput) {
  const response = await request<{
    task: ApiTask;
    progressLog: ApiProgressLog;
    projectedDate: string;
  }>(`/tasks/${taskId}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });

  return {
    task: normalizeTask(response.task),
    progressLog: normalizeProgressLog(response.progressLog),
    projectedDate: new Date(response.projectedDate),
  };
}

export async function fetchNotificationsRequest(token: string) {
  const response = await request<ApiNotification[]>('/notifications', { token });
  return response.map(normalizeNotification);
}

export async function fetchAvailabilityRequest(token: string) {
  const response = await request<ApiAvailabilitySlot[]>('/availability', { token });
  return response.map(normalizeAvailabilitySlot);
}

export async function createAvailabilityRequest(token: string, input: CreateAvailabilityInput) {
  const response = await request<ApiAvailabilitySlot>('/availability', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });

  return normalizeAvailabilitySlot(response);
}

export async function updateAvailabilityRequest(token: string, slotId: string, input: UpdateAvailabilityInput) {
  const response = await request<ApiAvailabilitySlot>(`/availability/${slotId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });

  return normalizeAvailabilitySlot(response);
}

export async function deleteAvailabilityRequest(token: string, slotId: string) {
  await request(`/availability/${slotId}`, {
    method: 'DELETE',
    token,
  });
}

export async function fetchNotificationSummaryRequest(token: string) {
  const response = await request<ApiNotificationSummary>('/notifications/summary', { token });
  return response;
}

export async function markNotificationReadRequest(token: string, notificationId: string) {
  const response = await request<ApiNotification>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
    token,
  });

  return normalizeNotification(response);
}

export async function refreshNotificationsRequest(token: string) {
  return request<{
    generatedCount: number;
  }>('/notifications/refresh', {
    method: 'POST',
    token,
  });
}

export async function registerDeviceRequest(token: string, input: RegisterDeviceInput) {
  return request('/notifications/devices', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    console.log('Request URL:', url);
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    console.log('Response status:', response.status);
  } catch (error) {
    console.log('NETWORK ERROR:', error);
    throw new ApiError(0, 'Cannot reach server. Check connection.', error);
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    throw buildApiError(path, response.status, data);
  }

  return data as T;
}

function normalizeUser(user: ApiUser): User {
  return {
    id: user.id,
    email: user.email,
    subscriptionPlan: user.subscriptionPlan,
    createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
    updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
  };
}

function normalizeGoal(goal: ApiGoal): Goal {
  return {
    ...goal,
    description: goal.description ?? undefined,
    targetDate: new Date(goal.targetDate),
    projectedDate: new Date(goal.projectedDate),
    createdAt: new Date(goal.createdAt),
    updatedAt: new Date(goal.updatedAt),
  };
}

function normalizeTask(task: ApiTask): Task {
  return {
    ...task,
    planId: task.planId ?? undefined,
    milestoneId: task.milestoneId ?? undefined,
    description: task.description ?? undefined,
    plannedDate: new Date(task.plannedDate),
    startTime: task.startTime ?? undefined,
    endTime: task.endTime ?? undefined,
    completedDate: task.completedDate ? new Date(task.completedDate) : undefined,
    estimatedMinutes: task.estimatedMinutes ?? undefined,
    targetValue: task.targetValue ?? undefined,
    completedValue: task.completedValue ?? undefined,
    targetUnit: task.targetUnit ?? undefined,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
  };
}

function normalizeProgressLog(progressLog: ApiProgressLog): TaskProgressLog {
  return {
    ...progressLog,
    completionPercent: progressLog.completionPercent ?? undefined,
    completedValue: progressLog.completedValue ?? undefined,
    note: progressLog.note ?? undefined,
    loggedAt: new Date(progressLog.loggedAt),
  };
}

function normalizeNotification(notification: ApiNotification): Notification {
  return {
    ...notification,
    dedupeKey: notification.dedupeKey ?? undefined,
    readAt: notification.readAt ? new Date(notification.readAt) : undefined,
    createdAt: new Date(notification.createdAt),
    updatedAt: notification.updatedAt ? new Date(notification.updatedAt) : undefined,
  };
}

function normalizeAvailabilitySlot(slot: ApiAvailabilitySlot): AvailabilitySlot {
  return {
    ...slot,
    label: slot.label ?? undefined,
    createdAt: new Date(slot.createdAt),
    updatedAt: new Date(slot.updatedAt),
  };
}

function extractErrorMessage(data: unknown) {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }
  }

  return null;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function buildApiError(path: string, status: number, data: unknown) {
  const message = mapApiErrorMessage(path, status, data);

  if (status === 401 && !path.startsWith('/auth')) {
    return new UnauthorizedError(status, message, data);
  }

  return new ApiError(status, message, data);
}

function mapApiErrorMessage(path: string, status: number, data: unknown) {
  if (status === 404 && path.startsWith('/availability')) {
    return 'Planner schedule API is unavailable. Backend may need redeploy.';
  }

  if (status === 401 && !path.startsWith('/auth')) {
    return 'Session expired. Please log in again.';
  }

  return extractErrorMessage(data) ?? `Request failed with status ${status}`;
}

function resolveBaseUrl() {
  const apiBaseUrl =
    Constants.expoConfig?.extra?.apiUrl ||
    process.env?.EXPO_PUBLIC_API_URL ||
    process.env?.EXPO_PUBLIC_API_BASE_URL ||
    process.env?.VITE_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error('API_BASE_URL is undefined');
  }

  const normalizedApiBaseUrl = String(apiBaseUrl).replace(/\/$/, '');
  validateApiBaseUrl(normalizedApiBaseUrl);

  return normalizedApiBaseUrl;
}

function validateApiBaseUrl(apiBaseUrl: string) {
  const isDevRuntime =
    typeof globalThis !== 'undefined' &&
    '__DEV__' in globalThis &&
    Boolean((globalThis as { __DEV__?: boolean }).__DEV__);

  if (isDevRuntime) {
    return;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(apiBaseUrl);
  } catch {
    throw new Error(`API_BASE_URL is invalid: ${apiBaseUrl}`);
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error(`API_BASE_URL must use https in production: ${apiBaseUrl}`);
  }

  if (parsedUrl.hostname === 'localhost') {
    throw new Error(`API_BASE_URL must not use localhost in production: ${apiBaseUrl}`);
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(parsedUrl.hostname)) {
    throw new Error(`API_BASE_URL must not use a raw IP address in production: ${apiBaseUrl}`);
  }
}

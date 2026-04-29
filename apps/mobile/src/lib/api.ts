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
  RecurrenceType,
  SubscriptionPlan,
  Task,
  TaskOccurrence,
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
  goalId?: string;
  title: string;
  description?: string;
  type: TaskType;
  plannedDate: Date;
  startTime?: string;
  endTime?: string;
  estimatedMinutes?: number;
  targetValue?: number;
  targetUnit?: string;
  recurrenceType?: RecurrenceType;
  recurrenceDaysOfWeek?: number[];
  recurrenceEndDate?: Date;
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
  recurrenceType?: RecurrenceType;
  recurrenceDaysOfWeek?: number[];
  recurrenceEndDate?: Date | null;
}

export interface UpdateTaskStatusInput {
  status: TaskStatus;
  completionPercent?: number;
  completedValue?: number;
  note?: string;
  occurrenceDate?: Date;
}

export interface TaskStatusUpdateResult {
  task: Task;
  progressLog: TaskProgressLog;
  projectedDate: Date | null;
}

export interface RegisterDeviceInput {
  token: string;
  platform: 'ios' | 'android' | 'expo';
}

export interface CreateAvailabilityInput {
  dayOfWeek: number;
  startDate?: Date;
  startTime: string;
  endTime: string;
  type: AvailabilityType;
  label?: string;
  recurrenceType?: RecurrenceType;
  recurrenceDaysOfWeek?: number[];
  recurrenceEndDate?: Date;
}

export interface UpdateAvailabilityInput {
  dayOfWeek?: number;
  startDate?: Date | null;
  startTime?: string;
  endTime?: string;
  type?: AvailabilityType;
  label?: string | null;
  recurrenceType?: RecurrenceType;
  recurrenceDaysOfWeek?: number[];
  recurrenceEndDate?: Date | null;
}

export interface TestPushResult {
  status: string;
  deviceCount: number;
  pushesAttempted: number;
  sentCount: number;
  invalidTokenCount: number;
}

export interface RegisterDeviceResult {
  status: string;
  registered: boolean;
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
  userId?: string;
  goalId?: string | null;
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
  recurrenceType?: RecurrenceType;
  recurrenceDaysOfWeek?: number[];
  recurrenceEndDate?: string | null;
  occurrences?: ApiTaskOccurrence[];
  seriesId?: string;
  occurrenceDate?: string;
  isRecurringInstance?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiTaskOccurrence {
  id: string;
  taskId: string;
  occurrenceDate: string;
  status: TaskStatus;
  completionPercent?: number | null;
  completedValue?: number | null;
  note?: string | null;
  completedDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiProgressLog {
  id: string;
  userId: string;
  taskId: string;
  status: TaskStatus;
  completionPercent?: number | null;
  completedValue?: number | null;
  note?: string | null;
  occurrenceDate?: string | null;
  loggedAt: string;
}

interface ApiAvailabilitySlot {
  id: string;
  userId: string;
  dayOfWeek: number;
  startDate?: string;
  startTime: string;
  endTime: string;
  type: AvailabilityType;
  label?: string | null;
  recurrenceType?: RecurrenceType;
  recurrenceDaysOfWeek?: number[];
  recurrenceEndDate?: string | null;
  seriesId?: string;
  occurrenceDate?: string;
  isRecurringInstance?: boolean;
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
  return request<{ status: string }>('/health');
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
      recurrenceType: input.recurrenceType,
      recurrenceDaysOfWeek: input.recurrenceDaysOfWeek,
      recurrenceEndDate: input.recurrenceEndDate?.toISOString(),
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
      recurrenceEndDate: input.recurrenceEndDate?.toISOString() ?? (input.recurrenceEndDate === null ? null : undefined),
    }),
  });

  return normalizeTask(response);
}

export async function updateTaskStatusRequest(token: string, taskId: string, input: UpdateTaskStatusInput) {
  const response = await request<{
    task: ApiTask;
    progressLog: ApiProgressLog;
    projectedDate: string | null;
  }>(`/tasks/${taskId}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({
      ...input,
      occurrenceDate: input.occurrenceDate?.toISOString(),
    }),
  });

  return {
    task: normalizeTask(response.task),
    progressLog: normalizeProgressLog(response.progressLog),
    projectedDate: response.projectedDate ? new Date(response.projectedDate) : null,
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
    body: JSON.stringify({
      ...input,
      startDate: input.startDate?.toISOString(),
      recurrenceEndDate: input.recurrenceEndDate?.toISOString(),
    }),
  });

  return normalizeAvailabilitySlot(response);
}

export async function updateAvailabilityRequest(token: string, slotId: string, input: UpdateAvailabilityInput) {
  const response = await request<ApiAvailabilitySlot>(`/availability/${slotId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({
      ...input,
      startDate: input.startDate?.toISOString() ?? (input.startDate === null ? null : undefined),
      recurrenceEndDate: input.recurrenceEndDate?.toISOString() ?? (input.recurrenceEndDate === null ? null : undefined),
    }),
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
  return request<RegisterDeviceResult>('/notifications/devices', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export async function sendTestPushRequest(token: string) {
  return request<TestPushResult>('/notifications/test-push', {
    method: 'POST',
    token,
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
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
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
    userId: task.userId ?? undefined,
    goalId: task.goalId ?? undefined,
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
    recurrenceType: task.recurrenceType ?? undefined,
    recurrenceDaysOfWeek: task.recurrenceDaysOfWeek ?? undefined,
    recurrenceEndDate: task.recurrenceEndDate ? new Date(task.recurrenceEndDate) : undefined,
    occurrences: task.occurrences?.map(normalizeTaskOccurrence),
    seriesId: task.seriesId ?? undefined,
    occurrenceDate: task.occurrenceDate ? new Date(task.occurrenceDate) : undefined,
    isRecurringInstance: task.isRecurringInstance ?? undefined,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
  };
}

function normalizeTaskOccurrence(occurrence: ApiTaskOccurrence): TaskOccurrence {
  return {
    ...occurrence,
    completionPercent: occurrence.completionPercent ?? undefined,
    completedValue: occurrence.completedValue ?? undefined,
    note: occurrence.note ?? undefined,
    occurrenceDate: new Date(occurrence.occurrenceDate),
    completedDate: occurrence.completedDate ? new Date(occurrence.completedDate) : undefined,
    createdAt: occurrence.createdAt ? new Date(occurrence.createdAt) : undefined,
    updatedAt: occurrence.updatedAt ? new Date(occurrence.updatedAt) : undefined,
  };
}

function normalizeProgressLog(progressLog: ApiProgressLog): TaskProgressLog {
  return {
    ...progressLog,
    completionPercent: progressLog.completionPercent ?? undefined,
    completedValue: progressLog.completedValue ?? undefined,
    note: progressLog.note ?? undefined,
    occurrenceDate: progressLog.occurrenceDate ? new Date(progressLog.occurrenceDate) : undefined,
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
    startDate: slot.startDate ? new Date(slot.startDate) : undefined,
    recurrenceType: slot.recurrenceType ?? undefined,
    recurrenceDaysOfWeek: slot.recurrenceDaysOfWeek ?? undefined,
    recurrenceEndDate: slot.recurrenceEndDate ? new Date(slot.recurrenceEndDate) : undefined,
    seriesId: slot.seriesId ?? undefined,
    occurrenceDate: slot.occurrenceDate ? new Date(slot.occurrenceDate) : undefined,
    isRecurringInstance: slot.isRecurringInstance ?? undefined,
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

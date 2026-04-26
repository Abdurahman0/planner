export enum SubscriptionPlan {
  FREE = 'free',
  AI_BASIC = 'ai_basic',
  AI_PRO = 'ai_pro',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum PaymentProvider {
  CLICK = 'click',
  PAYME = 'payme',
}

export enum PaymentStatus {
  INITIATED = 'initiated',
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export enum GoalType {
  MANUAL = 'manual',
  AI_MANAGED = 'ai_managed',
}

export enum GoalStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ARCHIVED = 'archived',
}

export enum GoalPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

export enum TaskType {
  TIME_BASED = 'time_based',
  UNIT_BASED = 'unit_based',
}

export enum TaskSource {
  MANUAL = 'manual',
  AI = 'ai',
}

export enum AvailabilityType {
  SLEEP = 'sleep',
  WORK = 'work',
  AVAILABLE = 'available',
  BLOCKED = 'blocked',
  EATING = 'eating',
  STUDY = 'study',
  CUSTOM = 'custom',
}

export enum AiActionType {
  INITIAL_PLAN = 'initial_plan',
  REPLAN = 'replan',
}

export enum NotificationType {
  REMINDER = 'reminder',
  MISSED_TASK = 'missed_task',
  PROGRESS_FEEDBACK = 'progress_feedback',
  STREAK_REWARD = 'streak_reward',
  GOAL_UPDATE = 'goal_update',
  SYSTEM = 'system',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

export interface User {
  id: string;
  email: string;
  subscriptionPlan: SubscriptionPlan;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: GoalType;
  priority: GoalPriority;
  status: GoalStatus;
  targetDate: Date;
  projectedDate: Date;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  goalId: string;
  version: number;
  isCurrent: boolean;
  createdAt: Date;
}

export interface Milestone {
  id: string;
  planId: string;
  title: string;
  description?: string;
  order: number;
  targetDate?: Date;
}

export interface AvailabilitySlot {
  id: string;
  userId: string;
  type: AvailabilityType;
  dayOfWeek: number; // 0-6
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  label?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Task {
  id: string;
  goalId: string;
  planId?: string;
  milestoneId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  type: TaskType;
  plannedDate: Date;
  startTime?: string; // HH:mm for scheduled tasks
  endTime?: string; // HH:mm
  completedDate?: Date;
  estimatedMinutes?: number;
  targetValue?: number;
  completedValue?: number;
  targetUnit?: string;
  source: TaskSource;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskProgressLog {
  id: string;
  userId: string;
  taskId: string;
  status: TaskStatus;
  completionPercent?: number;
  completedValue?: number;
  note?: string;
  loggedAt: Date;
}

export interface AiUsageLog {
  id: string;
  userId: string;
  goalId?: string;
  actionType: AiActionType;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  planType: SubscriptionPlan;
  provider: PaymentProvider;
  status: PaymentStatus;
  amountMinor: number;
  currency: string;
  localReference: string;
  externalId?: string;
  providerPayload?: unknown;
  errorMessage?: string;
  webhookAttempts: number;
  initiatedAt: Date;
  paidAt?: Date;
  processedAt?: Date;
  cancelledAt?: Date;
  expiresAt?: Date;
  lastWebhookAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  status: NotificationStatus;
  dedupeKey?: string;
  metadata?: unknown;
  readAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface NotificationSummary {
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

export interface AIPlanRequest {
  goalTitle: string;
  description?: string;
  targetDate: string;
  availability: AvailabilitySlot[];
}

export type AIPlanTask = Omit<
  Task,
  'id' | 'goalId' | 'planId' | 'milestoneId' | 'status' | 'completedDate' | 'completedValue' | 'createdAt' | 'updatedAt'
>;

export interface AIPlanResponse {
  tasks: AIPlanTask[];
  milestones: Array<Omit<Milestone, 'id' | 'planId'>>;
}

export * from './deadlineCalculator';

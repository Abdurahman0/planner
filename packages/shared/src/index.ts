export enum SubscriptionPlan {
  FREE = 'free',
  AI_BASIC = 'ai_basic',
  AI_PRO = 'ai_pro',
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

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TaskStatus {
  TODO = 'todo',
  DONE = 'done',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

export enum TaskType {
  TIME_BASED = 'time_based',
  UNIT_BASED = 'unit_based',
}

export interface User {
  id: string;
  email: string;
  subscriptionPlan: SubscriptionPlan;
  createdAt: Date;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: GoalType;
  priority: Priority;
  status: GoalStatus;
  targetDate: Date;
  projectedDate: Date;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum AvailabilityType {
  SLEEP = 'sleep',
  WORK = 'work',
  UNAVAILABLE = 'unavailable',
  AVAILABLE = 'available',
}

export interface AvailabilitySlot {
  id: string;
  type: AvailabilityType;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  daysOfWeek: number[]; // 0-6
}

export interface Task {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  type: TaskType;
  plannedDate: Date;
  startTime?: string; // HH:mm for scheduled tasks
  endTime?: string; // HH:mm
  completedDate?: Date;
  timeEstimateMinutes?: number;
  unitTarget?: number;
  unitCompleted?: number;
  unitName?: string;
  isAiGenerated: boolean;
  order: number;
}

export interface AIPlanRequest {
  goalTitle: string;
  description: string;
  targetDate: string;
  availability: string; // JSON string of schedule
}

export interface AIPlanResponse {
  tasks: Omit<Task, 'id' | 'goalId' | 'status' | 'completedDate'>[];
  milestones: string[];
}

export * from './deadlineCalculator';

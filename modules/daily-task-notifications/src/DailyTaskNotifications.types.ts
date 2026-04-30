export interface DailyTaskNotificationTaskInput {
  id: string;
  title: string;
  occurrenceDate?: string | null;
}

export interface DailyTaskNotificationInput {
  notificationKey: string;
  title: string;
  tasks: DailyTaskNotificationTaskInput[];
  moreCount: number;
  openPlannerUrl: string;
}

export interface DailyTaskNotificationActionPayload {
  id: string;
  notificationKey: string;
  taskId: string;
  occurrenceDate?: string | null;
}

export interface DailyTaskNotificationsModuleEvents {
  [eventName: string]: (...args: any[]) => void;
  onActionPressed: (payload: DailyTaskNotificationActionPayload) => void;
}

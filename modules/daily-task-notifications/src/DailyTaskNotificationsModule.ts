import { NativeModule, requireNativeModule } from 'expo';
import type {
  DailyTaskNotificationsModuleEvents,
} from './DailyTaskNotifications.types';

declare class DailyTaskNotificationsModule extends NativeModule<DailyTaskNotificationsModuleEvents> {
  showDailyTaskNotification(notificationJson: string): Promise<void>;
  updateDailyTaskNotification(notificationJson: string): Promise<void>;
  cancelDailyTaskNotification(notificationKey: string): Promise<void>;
  getPendingActionsAsync(): Promise<string>;
  removePendingActionsAsync(actionIds: string[]): Promise<void>;
}

export default requireNativeModule<DailyTaskNotificationsModule>('DailyTaskNotifications');

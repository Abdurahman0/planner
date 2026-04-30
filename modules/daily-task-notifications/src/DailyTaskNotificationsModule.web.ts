import { registerWebModule, NativeModule } from 'expo';
import type { DailyTaskNotificationsModuleEvents } from './DailyTaskNotifications.types';

class DailyTaskNotificationsModule extends NativeModule<DailyTaskNotificationsModuleEvents> {
  async showDailyTaskNotification(): Promise<void> {
    return;
  }

  async updateDailyTaskNotification(): Promise<void> {
    return;
  }

  async cancelDailyTaskNotification(): Promise<void> {
    return;
  }

  async getPendingActionsAsync(): Promise<string> {
    return '[]';
  }

  async removePendingActionsAsync(): Promise<void> {
    return;
  }
}

export default registerWebModule(DailyTaskNotificationsModule, 'DailyTaskNotifications');

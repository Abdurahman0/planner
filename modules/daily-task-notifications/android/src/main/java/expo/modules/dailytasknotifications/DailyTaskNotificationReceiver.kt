package expo.modules.dailytasknotifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class DailyTaskNotificationReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != ACTION_COMPLETE_TASK) {
      return
    }

    val notificationKey = intent.getStringExtra(EXTRA_NOTIFICATION_KEY)?.trim().orEmpty()
    val taskId = intent.getStringExtra(EXTRA_TASK_ID)?.trim().orEmpty()
    val occurrenceDate = intent.getStringExtra(EXTRA_OCCURRENCE_DATE)?.trim()?.ifBlank { null }

    if (notificationKey.isEmpty() || taskId.isEmpty()) {
      return
    }

    val action = DailyTaskNotificationAction(
      id = buildPendingActionId(notificationKey, taskId, occurrenceDate),
      notificationKey = notificationKey,
      taskId = taskId,
      occurrenceDate = occurrenceDate,
    )

    val applicationContext = context.applicationContext
    DailyTaskNotificationPreferences.appendPendingAction(applicationContext, action)
    DailyTaskNotificationRenderer.refreshPendingState(applicationContext, notificationKey)
    DailyTaskNotificationsModule.emitActionPressed(action)
  }

  companion object {
    const val ACTION_COMPLETE_TASK = "expo.modules.dailytasknotifications.COMPLETE_TASK"
    const val EXTRA_NOTIFICATION_KEY = "notificationKey"
    const val EXTRA_TASK_ID = "taskId"
    const val EXTRA_OCCURRENCE_DATE = "occurrenceDate"
  }
}

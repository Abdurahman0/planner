package expo.modules.dailytasknotifications

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.lang.ref.WeakReference

class DailyTaskNotificationsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DailyTaskNotifications")

    Events(EVENT_ACTION_PRESSED)

    OnCreate {
      moduleRef = WeakReference(this@DailyTaskNotificationsModule)
    }

    OnDestroy {
      if (moduleRef?.get() === this@DailyTaskNotificationsModule) {
        moduleRef = null
      }
    }

    AsyncFunction("showDailyTaskNotification") { notificationJson: String ->
      DailyTaskNotificationRenderer.show(requireContext(), notificationJson)
    }

    AsyncFunction("updateDailyTaskNotification") { notificationJson: String ->
      DailyTaskNotificationRenderer.show(requireContext(), notificationJson)
    }

    AsyncFunction("cancelDailyTaskNotification") { notificationKey: String ->
      DailyTaskNotificationRenderer.cancel(requireContext(), notificationKey)
    }

    AsyncFunction("getPendingActionsAsync") {
      DailyTaskNotificationPreferences.getPendingActionsJson(requireContext())
    }

    AsyncFunction("removePendingActionsAsync") { actionIds: List<String> ->
      DailyTaskNotificationPreferences.removePendingActions(requireContext(), actionIds)
    }
  }

  private fun requireContext() = requireNotNull(appContext.reactContext) {
    "React context is unavailable"
  }.applicationContext

  internal fun emitActionPressed(action: DailyTaskNotificationAction) {
    sendEvent(
      EVENT_ACTION_PRESSED,
      mapOf(
        "id" to action.id,
        "notificationKey" to action.notificationKey,
        "taskId" to action.taskId,
        "occurrenceDate" to action.occurrenceDate,
      ),
    )
  }

  companion object {
    const val CHANNEL_ID = "planner-reminders"
    private const val EVENT_ACTION_PRESSED = "onActionPressed"
    private var moduleRef: WeakReference<DailyTaskNotificationsModule>? = null

    internal fun emitActionPressed(action: DailyTaskNotificationAction) {
      moduleRef?.get()?.emitActionPressed(action)
    }
  }
}

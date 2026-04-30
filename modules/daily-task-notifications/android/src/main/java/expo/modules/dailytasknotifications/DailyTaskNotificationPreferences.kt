package expo.modules.dailytasknotifications

import android.content.Context
import org.json.JSONArray

internal object DailyTaskNotificationPreferences {
  private const val PREFERENCES_NAME = "planner_daily_task_notifications"
  private const val NOTIFICATION_PREFIX = "notification:"
  private const val PENDING_ACTIONS_KEY = "pending_actions"

  fun saveNotification(context: Context, inputJson: String) {
    val input = parseNotificationInput(inputJson)
    prefs(context)
      .edit()
      .putString("$NOTIFICATION_PREFIX${input.notificationKey}", inputJson)
      .apply()
  }

  fun removeNotification(context: Context, notificationKey: String) {
    prefs(context)
      .edit()
      .remove("$NOTIFICATION_PREFIX$notificationKey")
      .apply()
  }

  fun getNotificationJson(context: Context, notificationKey: String): String? {
    return prefs(context).getString("$NOTIFICATION_PREFIX$notificationKey", null)
  }

  fun appendPendingAction(context: Context, action: DailyTaskNotificationAction) {
    val actions = getPendingActionsArray(context)

    for (index in 0 until actions.length()) {
      val existing = actions.optJSONObject(index) ?: continue

      if (existing.optString("id") == action.id) {
        return
      }
    }

    actions.put(action.toJson())
    storePendingActions(context, actions)
  }

  fun getPendingActionsJson(context: Context): String {
    return getPendingActionsArray(context).toString()
  }

  fun hasPendingAction(context: Context, actionId: String): Boolean {
    val actions = getPendingActionsArray(context)

    for (index in 0 until actions.length()) {
      val item = actions.optJSONObject(index) ?: continue

      if (item.optString("id") == actionId) {
        return true
      }
    }

    return false
  }

  fun removePendingActions(context: Context, actionIds: List<String>) {
    if (actionIds.isEmpty()) {
      return
    }

    val existing = getPendingActionsArray(context)
    val filtered = JSONArray()

    for (index in 0 until existing.length()) {
      val item = existing.optJSONObject(index) ?: continue

      if (!actionIds.contains(item.optString("id"))) {
        filtered.put(item)
      }
    }

    storePendingActions(context, filtered)
  }

  private fun getPendingActionsArray(context: Context): JSONArray {
    val raw = prefs(context).getString(PENDING_ACTIONS_KEY, null) ?: return JSONArray()

    return try {
      JSONArray(raw)
    } catch (_: Throwable) {
      JSONArray()
    }
  }

  private fun storePendingActions(context: Context, actions: JSONArray) {
    prefs(context)
      .edit()
      .putString(PENDING_ACTIONS_KEY, actions.toString())
      .apply()
  }

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
}

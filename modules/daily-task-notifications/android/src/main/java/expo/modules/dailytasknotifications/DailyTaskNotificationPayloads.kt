package expo.modules.dailytasknotifications

import org.json.JSONArray
import org.json.JSONObject

internal data class DailyTaskNotificationTask(
  val id: String,
  val title: String,
  val occurrenceDate: String?,
)

internal data class DailyTaskNotificationInput(
  val notificationKey: String,
  val title: String,
  val tasks: List<DailyTaskNotificationTask>,
  val moreCount: Int,
  val openPlannerUrl: String,
)

internal data class DailyTaskNotificationAction(
  val id: String,
  val notificationKey: String,
  val taskId: String,
  val occurrenceDate: String?,
) {
  fun toJson(): JSONObject {
    val json = JSONObject()
      .put("id", id)
      .put("notificationKey", notificationKey)
      .put("taskId", taskId)

    if (occurrenceDate != null) {
      json.put("occurrenceDate", occurrenceDate)
    }

    return json
  }
}

internal fun buildPendingActionId(
  notificationKey: String,
  taskId: String,
  occurrenceDate: String?,
) = listOf(notificationKey, taskId, occurrenceDate.orEmpty()).joinToString(":")

internal fun parseNotificationInput(notificationJson: String): DailyTaskNotificationInput {
  val payload = JSONObject(notificationJson)
  val tasks = payload.optJSONArray("tasks") ?: JSONArray()

  return DailyTaskNotificationInput(
    notificationKey = payload.getString("notificationKey"),
    title = payload.optString("title", "Daily Tasks"),
    tasks = buildList {
      for (index in 0 until tasks.length()) {
        val task = tasks.optJSONObject(index) ?: continue
        val id = task.optString("id")
        val title = task.optString("title")

        if (id.isBlank() || title.isBlank()) {
          continue
        }

        add(
          DailyTaskNotificationTask(
            id = id,
            title = title,
            occurrenceDate = task.optString("occurrenceDate").takeIf { it.isNotBlank() },
          ),
        )
      }
    },
    moreCount = payload.optInt("moreCount", 0).coerceAtLeast(0),
    openPlannerUrl = payload.optString("openPlannerUrl", "aiplanner://calendar"),
  )
}

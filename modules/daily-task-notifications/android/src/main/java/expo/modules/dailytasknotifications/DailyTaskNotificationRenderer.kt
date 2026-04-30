package expo.modules.dailytasknotifications

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

internal object DailyTaskNotificationRenderer {
  fun show(context: Context, inputJson: String) {
    val input = parseNotificationInput(inputJson)
    val applicationContext = context.applicationContext
    val remoteViews = buildRemoteViews(applicationContext, input)
    val notification = NotificationCompat.Builder(applicationContext, DailyTaskNotificationsModule.CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_stat_daily_tasks)
      .setCategory(NotificationCompat.CATEGORY_REMINDER)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOnlyAlertOnce(true)
      .setAutoCancel(false)
      .setContentIntent(buildBodyPendingIntent(applicationContext, input))
      .setCustomContentView(remoteViews)
      .setCustomBigContentView(remoteViews)
      .setStyle(NotificationCompat.DecoratedCustomViewStyle())
      .build()

    DailyTaskNotificationPreferences.saveNotification(applicationContext, inputJson)
    NotificationManagerCompat.from(applicationContext)
      .notify(input.notificationKey, buildNotificationId(input.notificationKey), notification)
  }

  fun refreshPendingState(context: Context, notificationKey: String) {
    val applicationContext = context.applicationContext
    val inputJson = DailyTaskNotificationPreferences.getNotificationJson(applicationContext, notificationKey)
      ?: return

    show(applicationContext, inputJson)
  }

  fun cancel(context: Context, notificationKey: String) {
    val applicationContext = context.applicationContext
    NotificationManagerCompat.from(applicationContext)
      .cancel(notificationKey, buildNotificationId(notificationKey))
    DailyTaskNotificationPreferences.removeNotification(applicationContext, notificationKey)
  }

  private fun buildRemoteViews(
    context: Context,
    input: DailyTaskNotificationInput,
  ): RemoteViews {
    val remoteViews = RemoteViews(context.packageName, R.layout.notification_daily_tasks)
    remoteViews.setTextViewText(R.id.notification_title, input.title)

    bindTaskRow(context, remoteViews, input, 0, R.id.task_row_1, R.id.task_icon_1, R.id.task_text_1)
    bindTaskRow(context, remoteViews, input, 1, R.id.task_row_2, R.id.task_icon_2, R.id.task_text_2)
    bindTaskRow(context, remoteViews, input, 2, R.id.task_row_3, R.id.task_icon_3, R.id.task_text_3)

    if (input.moreCount > 0) {
      remoteViews.setViewVisibility(R.id.more_text, View.VISIBLE)
      remoteViews.setTextViewText(
        R.id.more_text,
        "+${input.moreCount} more task${if (input.moreCount == 1) "" else "s"}",
      )
    } else {
      remoteViews.setViewVisibility(R.id.more_text, View.GONE)
    }

    return remoteViews
  }

  private fun bindTaskRow(
    context: Context,
    remoteViews: RemoteViews,
    input: DailyTaskNotificationInput,
    taskIndex: Int,
    rowViewId: Int,
    iconViewId: Int,
    textViewId: Int,
  ) {
    val task = input.tasks.getOrNull(taskIndex)

    if (task == null) {
      remoteViews.setViewVisibility(rowViewId, View.GONE)
      return
    }

    val isPending = DailyTaskNotificationPreferences.hasPendingAction(
      context,
      buildPendingActionId(input.notificationKey, task.id, task.occurrenceDate),
    )

    remoteViews.setViewVisibility(rowViewId, View.VISIBLE)
    remoteViews.setImageViewResource(
      iconViewId,
      if (isPending) R.drawable.ic_notification_check else R.drawable.ic_notification_circle,
    )
    remoteViews.setTextViewText(textViewId, task.title)
    remoteViews.setOnClickPendingIntent(
      iconViewId,
      buildCompleteTaskPendingIntent(context, input.notificationKey, task),
    )
  }

  private fun buildBodyPendingIntent(
    context: Context,
    input: DailyTaskNotificationInput,
  ): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(input.openPlannerUrl)).apply {
      setPackage(context.packageName)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }

    return PendingIntent.getActivity(
      context,
      requestCode("${input.notificationKey}:open"),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun buildCompleteTaskPendingIntent(
    context: Context,
    notificationKey: String,
    task: DailyTaskNotificationTask,
  ): PendingIntent {
    val intent = Intent(context, DailyTaskNotificationReceiver::class.java).apply {
      action = DailyTaskNotificationReceiver.ACTION_COMPLETE_TASK
      putExtra(DailyTaskNotificationReceiver.EXTRA_NOTIFICATION_KEY, notificationKey)
      putExtra(DailyTaskNotificationReceiver.EXTRA_TASK_ID, task.id)
      putExtra(DailyTaskNotificationReceiver.EXTRA_OCCURRENCE_DATE, task.occurrenceDate)
    }

    return PendingIntent.getBroadcast(
      context,
      requestCode("$notificationKey:${task.id}:${task.occurrenceDate.orEmpty()}"),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun buildNotificationId(notificationKey: String): Int {
    return notificationKey.hashCode() and Int.MAX_VALUE
  }

  private fun requestCode(value: String): Int {
    return value.hashCode() and Int.MAX_VALUE
  }
}

import ExpoModulesCore

public class DailyTaskNotificationsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DailyTaskNotifications")
    Events("onActionPressed")

    AsyncFunction("showDailyTaskNotification") { (_ notificationJson: String) in
      return
    }

    AsyncFunction("updateDailyTaskNotification") { (_ notificationJson: String) in
      return
    }

    AsyncFunction("cancelDailyTaskNotification") { (_ notificationKey: String) in
      return
    }

    AsyncFunction("getPendingActionsAsync") {
      return "[]"
    }

    AsyncFunction("removePendingActionsAsync") { (_ actionIds: [String]) in
      return
    }
  }
}

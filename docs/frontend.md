# Frontend

## Stack

- React Native
- Expo / Expo Router
- Zustand
- Expo Notifications
- Expo Task Manager
- Expo Secure Store
- react-native-safe-area-context
- react-native-edge-to-edge
- local Expo module: `modules/daily-task-notifications`

## Main surface

### Dashboard

- purpose: answer `what should I do now?` immediately
- sections:
  - `Next Action`
- primary CTA: `Plan Today`
- secondary action: `View all today tasks`
- removed:
  - task lists
  - summary cards
  - streak/completion reporting
  - overdue report section
  - any competing cards

### Goals

- purpose: manage goals, not day planning
- goal cards show:
  - priority
  - target date
  - projected date
- goal detail shows:
  - goal summary
  - progress bar
  - linked tasks
  - button to open Planner
- goal task rows can be completed directly from the page
- removed:
  - inline duplicate task-creation form
  - extra planning controls from goal detail

### Planner

- purpose: central planning screen
- default view: `day`
- day view contains:
  - timeline
  - scheduled tasks
  - unscheduled tasks
  - recurring availability blocks
- day view CTA: `Plan Day`
- task recurrence and priority overrides live under `More options`

### Progress

- purpose: read-only progress stats
- simplified to small stat cards
- removed:
  - heavy chart stack
  - duplicate planner CTA

### Profile

- purpose: account/settings only
- removed:
  - push-debug UI
  - raw notification feed
  - floating test-push CTA

## Task priority UX

Tasks now support priority behavior in the mobile UI.

- goal-linked tasks can inherit goal priority
- task modal supports explicit override:
  - `High`
  - `Medium`
  - `Low`
- standalone tasks default to medium unless changed
- task cards show priority pills
- scheduled Planner cards visually highlight high priority
- Dashboard uses a `getNextAction(tasks)` rule:
  - nearest upcoming scheduled task after current time
  - same-time tie break: higher priority, then `createdAt`
  - unscheduled fallback: priority, then `createdAt`
- `Start Now` behavior:
  - goal-linked task -> Goal detail
  - standalone task -> Planner with focus params
- Planner day view consumes focus params and:
  - opens the correct day
  - scrolls once near the scheduled block if the task has time
  - scrolls once into `Unscheduled Tasks` if it does not
  - applies a temporary highlight to the matched task card
  - releases scroll control immediately after that one focus pass

Priority explanation shown in task modal:

- `High = alarm-like`
- `Medium = normal reminder`
- `Low = soft reminder`

## Notifications

### Standard push channels

Android channels configured by the app:

- `planner-high-priority`
- `planner-reminders`
- `planner-low-priority`

Use:

- high-priority scheduled reminders -> `planner-high-priority`
- medium reminders -> `planner-reminders`
- low reminders -> `planner-low-priority`

### Daily-task notification

- Android-only native custom notification
- still rendered through the local Expo module
- one visible notification per user/day
- up to 3 rows
- sorted by effective priority, then creation time

### Body vs circle tap

- body tap opens Planner
- circle tap targets the exact row
- backend still confirms completion

## Safe area / CTA

- floating CTA remains edge-to-edge aware
- bottom rule:
  - `Math.max(insets.bottom - 4, 2)`
- Dashboard and Planner keep the only primary planning CTAs
- Progress and Profile no longer add duplicate floating actions

## Security

- no tokens or JWTs shown in UI
- no debug panels in production UI
- planner logic is not delegated to AI
- backend remains source of truth for task state and notification state

## Build notes

- any Android notification-channel or native-module change requires a fresh EAS build
- Expo Go is not valid for real Android push validation in this project

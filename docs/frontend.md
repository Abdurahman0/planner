# Frontend

## Stack

- React Native
- Expo / Expo Router
- Zustand
- Expo Secure Store
- Expo Notifications
- Expo Task Manager
- React Native Safe Area Context
- react-native-edge-to-edge
- local Expo module: `modules/daily-task-notifications`

## Structure

- Expo project root: repo root
- route root: `apps/mobile/app`
- shared mobile source: `apps/mobile/src`
- Expo config: [app.config.ts](/c:/Users/Abdurahmon/planner/app.config.ts)
- EAS config: [eas.json](/c:/Users/Abdurahmon/planner/eas.json)

## Backend Integration

Connected:

- auth
- current user
- goals
- tasks
- availability
- notifications APIs
- Expo push token registration
- recurring task / routine-block forms

Not connected:

- frontend AI entry flow
- frontend billing flow

## Notifications

Implemented:

- Expo push token registration after authenticated bootstrap/login only
- Android notification channel: `planner-reminders`
- non-blocking permission notice when notifications are denied
- JWT-protected device registration
- test push from Profile
- Android tap routing for normal notifications

Push vs in-app records:

- Android system notifications are the primary user-facing notification surface
- backend notification rows still exist, but they are not rendered as a user-facing daily reminder feed
- no push token, JWT, or raw backend notification data is exposed in the UI

### Daily-task notification

Current Android implementation:

- visible daily-task UI is Android-only
- visible daily-task UI is rendered by the local Expo module in `modules/daily-task-notifications`
- backend sends a headless data-only Expo push for daily-task reminder updates
- the app uses that payload to show or update one native Android custom notification
- there is no parallel visible Expo alert for the same daily-task reminder

Visible behavior:

- one notification per user/day
- up to 3 task rows
- each row shows:
  - empty circle
  - task title
- if more tasks remain: `+N more tasks`
- ordering: oldest created incomplete unscheduled tasks first
- tapping notification body opens Planner Day view
- tapping a circle targets that exact task row

Action behavior:

- if the app process is alive, the circle action is completed through the authenticated JS API path without opening Planner
- if the app process is killed and JS/auth is unavailable, the action is queued locally and processed on the next authenticated resume
- after a circle tap, the exact row icon is replaced immediately with a checked state while backend completion is pending
- after backend confirmation and task refresh, the completed row is removed and the next task moves into view if one exists
- backend remains the source of truth; tasks are never completed purely locally

Known Android limitation:

- this uses `RemoteViews`, so layout space and decoration are controlled by Android
- Android 12+ may decorate custom notifications more aggressively
- this is not a true non-dismissible ongoing notification

### Standard push flow

- after authenticated app bootstrap, the app configures the Android channel
- it checks permission state
- if permission is `undetermined`, it requests once
- if permission is denied, it shows a non-blocking notice and does not spam prompts
- if permission is granted, it resolves the Expo project ID from:
  - `Constants.expoConfig?.extra?.eas?.projectId`
  - fallback: `Constants.easConfig?.projectId`
- it fetches an Expo push token
- it registers that token with `POST /notifications/devices`
- device registration retries once on transient failure

### Tap routing

- notification with `goalId` opens `goals/[id]`
- reminder/system notification without a goal target opens Planner
- daily-task notification body tap opens Planner Day view

## Planner UX

### Day View

Implemented:

- full 00:00-24:00 timeline
- current-hour auto-scroll for today
- safe bottom spacing for the end marker and bottom UI
- scheduled tasks rendered by time
- unscheduled tasks section
- recurring occurrences rendered in day/week/month views
- standalone tasks render in planner views without requiring a goal

### Shared floating CTA

- shared CTA system across Dashboard, Goals, Planner, Progress, and Profile
- bottom anchor rule: `Math.max(insets.bottom - 4, 2)`
- no `tabBarHeight` dependency
- intended to sit low against the edge-to-edge bottom area without overlapping Android system navigation

## Task Creation UX

- tasks can be created with a goal or as standalone tasks
- goal selector includes `No goal / Standalone task`
- recurrence controls live under `More options`
- task and routine-block modals stay keyboard-safe with safe-area footer padding

## Safe Area and Android System UI

- `SafeAreaProvider` at app root
- config-level edge-to-edge via `react-native-edge-to-edge`
- content renders under system bars while interactive UI still respects insets
- planner modals/sheets use safe-area-aware bottom action padding
- floating CTAs use safe-area anchoring instead of tab-bar-height anchoring

## Build Notes

- run Expo and EAS commands from repo root
- Expo Go is not valid for Android remote push validation in this project
- the APK must include:
  - valid EAS project ID
  - valid `google-services.json` for `com.aiplanner.mobile`
  - valid EAS FCM V1 credentials
- the Android custom daily-task notification icon is provided by the local Expo module
- any change to Firebase config, edge-to-edge config, or local Expo module native code requires a fresh EAS rebuild
- the local Expo module is validated through CNG/prebuild; generated `android/` output is not committed

## Current Limitations

- recurring single-occurrence edit/delete is not implemented
- no drag-and-drop or drag-resize planner interactions
- cross-midnight routine blocks still require manual splitting
- Android custom notification layout is constrained by `RemoteViews`
- killed-app circle-tap completion is best-effort and may queue until the next authenticated resume
- true non-dismissible Android ongoing notifications are not implemented
- real-device QA is still required

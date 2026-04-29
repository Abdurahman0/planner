# Frontend

## Stack

- React Native
- Expo
- Expo Router
- Zustand
- Expo Secure Store
- Expo Notifications
- React Native Safe Area Context

## Structure

- Expo project root: repo root
- route root: `apps/mobile/app`
- shared mobile source: `apps/mobile/src`
- Expo config: [app.config.ts](/c:/Users/Abdurahmon/planner/app.config.ts)
- EAS config: [eas.json](/c:/Users/Abdurahmon/planner/eas.json)

## Backend Integration Status

Connected:

- auth
- current user
- goals
- tasks
- availability
- notifications summary/list
- authenticated Expo push token registration
- Expo push token registration
- Android push tap routing
- recurring task and recurring routine-block mobile forms
- local daily-task notification mirroring for authenticated planner state

Not connected yet:

- frontend AI flow
- frontend billing flow

## Current Mobile Screens

- `auth`
- `/(tabs)/index`
- `/(tabs)/goals`
- `/(tabs)/progress`
- `/(tabs)/calendar`
- `/(tabs)/profile`
- `goals/create`
- `goals/[id]`

## Notifications

Implemented:

- backend-driven push notifications for Android system delivery
- Android system push notifications are the primary notification experience
- Expo notification permission request only after authenticated bootstrap/login
- non-blocking in-app notice when notification permission is denied
- Expo push token registration to backend using JWT-protected device registration
- Android notification channel: `planner-reminders`
- foreground notification presentation through `expo-notifications`
- notification tap handling
- daily-task notification action handling

In-app notifications vs push notifications:

- in-app notifications are database records shown inside the Profile notifications panel
- push notifications are Android system notifications delivered through Expo to registered device tokens
- push delivery does not require the app UI to be open once the backend has a stored Expo token and the backend triggers notification generation
- the mobile app registers an Expo push token, not a raw FCM token

Current tap behavior:

- notification with `goalId` opens `goals/[id]`
- daily-task notification body tap opens Planner Day view
- reminder/system notification without a goal target opens Planner
- other notifications without a goal target open Profile/Notifications

Current supported push scenarios:

- task reminders
- missed task alerts
- progress feedback
- streak rewards
- daily planning reminders

Current push flow:

- after authenticated app bootstrap, the app configures the Android notification channel
- it checks permission status
- if permission is `undetermined`, it requests permission once
- if permission is already denied, it shows a non-blocking message and does not spam the prompt
- if granted, it resolves the Expo project ID from:
  - `Constants.expoConfig?.extra?.eas?.projectId`
  - fallback: `Constants.easConfig?.projectId`
- if the runtime is web preview or an emulator, it exits early with a safe unsupported-runtime message
- if granted, it fetches the Expo push token using that EAS project ID
- it registers that token with `POST /notifications/devices`
- if device registration fails, it retries once safely
- authenticated push QA can use backend `POST /notifications/test-push` to confirm closed-app delivery on a real APK
- in development only, the app logs safe push debug signals:
  - permission status
  - whether project ID was found
  - whether a token was created
  - whether backend registration succeeded

Daily unscheduled task notification MVP:

- the app mirrors incomplete unscheduled tasks for today into a local Android notification while the user is authenticated and synced
- the body shows up to 3 task titles
- if more tasks remain, the body ends with `+N more tasks`
- ordering is oldest created task first
- when all incomplete unscheduled tasks for today are done, the local reminder is cleared
- Android system daily-task notifications register a `✓ Done` action
- the `✓ Done` action completes the first visible daily task through the secure backend status endpoint when the app resumes from the notification action
- after completion, the next task moves into the top 3 and the reminder refreshes or clears
- if the notification is swiped away, it can appear again on a later app sync or backend sweep while incomplete daily tasks remain
- identical daily-task reminders are not pushed again on every sweep; unchanged content is re-sent only after a cooldown or when the task list changes
- Expo/Android notification actions do not support a custom animated circle/tick control here; the supported MVP is a `✓ Done` action button
- this is not a verified true Android ongoing/non-dismissible notification or guaranteed killed-app background completion; it is the safest Expo-compatible MVP

Current production-facing notification UX:

- Profile keeps the authenticated `Send test notification` action for QA
- temporary push-debug panels have been removed from the UI
- Profile no longer renders raw backend notification records
- the in-app Profile list is not the primary notification experience
- custom in-app daily reminder banners have been removed; system notifications are primary

Foreground vs background behavior:

- foreground: Expo handler requests native banner/list presentation through the OS notification surface
- background/closed app: Android system notification depends on backend-generated Expo push delivery, not the in-app list
- the `✓ Done` action is handled safely when the app resumes from the notification action
- Profile keeps the authenticated test-push action, but it is not the primary user notification surface

## Planner UX

### Day View

Implemented:

- hourly timeline
- full 00:00-24:00 visible range
- every hour from `00:00` to `23:00` is tappable
- bottom marker for the end of the day
- default auto-scroll near the current hour for today
- non-today default scroll near `06:00`
- consistent hour row spacing
- safe bottom spacing after the final hour
- visually distinct availability blocks
- scheduled tasks rendered as time blocks
- unscheduled tasks section
- tap empty hour to quick-add task
- `Plan Day` floating action
- `Plan Day` floating action anchored from the calendar screen root, just above the bottom tab bar
- `Plan Day` and other shared floating CTAs use `Math.max(insets.bottom - 4, 2)` as the bottom anchor
- `PlanDaySheet`
- add/edit routine blocks
- quick task scheduling modal
- recurring tasks:
  - `none`
  - `daily`
  - `weekly`
  - `monthly`
  - `yearly`
- recurring routine blocks:
  - `none`
  - `daily`
  - `weekly`
  - `monthly`
  - `yearly`
- weekly recurrence day picker
- optional recurrence end date
- recurring occurrences rendered in day/week/month views
- recurring items show repeat badges in the planner UI
- main tab screens now use a shared floating CTA system:
  - Dashboard: `Quick plan`
  - Goals: `New goal`
  - Planner: `Plan Day`
  - Progress: `Open planner`
  - Profile: `Test push`

### Week View

Implemented:

- seven-day summary
- scheduled vs unscheduled counts
- schedule density
- done / partial / failed indicators

### Month View

Implemented:

- month grid
- task counts
- goal indicators
- completed / failed markers
- recurring occurrences are expanded before month counting, so daily/weekly/monthly/yearly series show up on their real calendar days

## Task Creation UX

Current behavior:

- task creation works from goal detail
- task creation works from planner quick add
- tasks can be created with a goal or as standalone tasks without a goal
- tapped-hour quick add pre-fills:
  - `plannedDate`
  - `startTime`
  - `endTime = startTime + 1 hour`
- simplified modal keeps advanced options hidden until needed
- recurrence controls live under `More options`
- goal selection now includes `No goal / Standalone task`
- task and schedule modals are keyboard-safe:
  - scroll remains available when the Android keyboard is open
  - description and footer actions stay reachable
  - footer actions keep safe-area bottom padding

## Auth UX

Implemented:

- password visibility toggle on the auth password field
- keyboard-safe auth layout using `KeyboardAvoidingView` and `ScrollView`
- bottom safe-area padding so the password field and submit button stay reachable on Android

Security-relevant behavior:

- password visibility toggle is UI-only
- plain passwords are not persisted in Zustand, SecureStore, or local storage
- only the JWT access token is persisted after successful auth

## Safe Area and Android System UI

Implemented:

- `SafeAreaProvider` at app root
- tab bar respects bottom safe area
- Android system bars now use config-level edge-to-edge plus `react-native-edge-to-edge`
- root layout uses `SystemBars` instead of depending on deprecated runtime nav-bar background APIs
- app content renders under the Android system navigation area while still respecting `insets.bottom`
- main screens padded to avoid overlap with bottom navigation/system area
- planner modals and sheets apply safe-area-aware bottom padding for action buttons
- `Plan Day` floating button sits above tab bar and Android system navigation on device
- tab bar remains safe-area aware above the Android navigation buttons
- planner screens should only keep enough bottom spacing to clear the tab bar, Android nav area, and floating action button
- avoid double-counting bottom spacing between:
  - tab scene padding
  - planner scroll content padding
  - floating action positioning
- floating CTA buttons on main tabs use `Math.max(insets.bottom - 4, 2)` instead of tab-bar-height anchoring or larger artificial offsets

Edge-to-edge note:

- `expo-navigation-bar` runtime calls alone are not reliable enough on some OEM Android builds
- the stronger fix is config-level edge-to-edge with `react-native-edge-to-edge`
- built-in planner modals now also set:
  - `statusBarTranslucent`
  - `navigationBarTranslucent`
- if a specific OEM still forces a non-transparent nav area, document that device behavior during QA instead of treating it as proof the old implementation is still active

## Native Compatibility

Implemented:

- Recharts/web-only chart usage removed from native path
- charts replaced with React Native-compatible components
- no web DOM elements in native app path

## Build and APK Notes

Run Expo and EAS commands from the **repo root**.

Current setup:

- `main: expo-router/entry`
- `expo-router` root points to `./apps/mobile/app`
- EAS project ID is set in dynamic Expo config
- `preview` EAS profile builds an APK
- Expo notifications plugin sets default Android channel and accent color

Environment requirement:

- `EXPO_PUBLIC_API_URL` must be set for EAS builds
- the APK must also have a valid EAS project association so Expo push token creation can resolve the project ID at runtime
- Android push token creation also requires native Firebase client config:
  - `GOOGLE_SERVICES_FILE=./google-services.json` or another valid path
  - the file must match `com.aiplanner.mobile`

Current example in repo env:

```env
EXPO_PUBLIC_API_URL="https://planner-v79c.onrender.com"
```

Availability API note:

- the mobile app calls `GET ${API_BASE_URL}/availability` with `Authorization: Bearer <token>`
- if the backend responds with `404`, the user-facing message is `Planner schedule API is unavailable. Backend may need redeploy.`
- if the backend responds with `401`, the user-facing message is `Session expired. Please log in again.`
- network failures map to `Cannot reach server. Check connection.`
- the currently deployed Render backend at `planner-v79c.onrender.com` returned `404` for `/availability` during verification, so the service must be redeployed from the latest backend commit
- Profile includes a `Send test notification` button that calls backend `POST /notifications/test-push` after ensuring push permission / device registration

Production note:

- Expo push token registration depends on the EAS project ID embedded in [app.config.ts](/c:/Users/Abdurahmon/planner/app.config.ts)
- Android Expo push token creation also depends on a valid `google-services.json` being wired into the native build
- Expo Go is not a valid environment for Android remote push testing in this project
- proper Android notification icon asset is still not configured; Android will fall back to the app/default notification icon until a dedicated monochrome asset is added
- testing true background/closed-app push requires a physical-device EAS APK or dev build, not the web preview
- any change to `google-services.json`, edge-to-edge plugin config, or native notification config requires a fresh EAS rebuild

Troubleshooting `No push-ready Android device is registered yet`:

- grant notification permission on the device
- rebuild the APK from the linked EAS project if project configuration is stale
- if token creation fails with `Default FirebaseApp is not initialized`, rebuild with a valid `google-services.json` and EAS FCM credentials
- if backend registration fails, inspect `POST /notifications/devices` deployment and JWT-authenticated routing
- if daily-task reminder behavior is missing:
  - confirm the task has `plannedDate = today`
  - confirm it has no `startTime` / `endTime`
  - confirm it is still incomplete
  - confirm the app is running on a physical Android device with notification permission granted
  - if the `✓ Done` action was pressed from a killed app, reopen/resume the app once so the secure completion request can run

## Current Limitations

- recurring series editing currently updates the whole series; single-occurrence edit/delete is not implemented
- no drag-and-drop rescheduling
- no drag resize by duration
- no frontend AI generation/replan UI
- no frontend payment UI
- overlap handling in planner UI is still limited
- cross-midnight routine blocks must still be split manually
- Android notification styling is still constrained by OS defaults
- Android edge-to-edge behavior still requires real-device QA across OEM skins
- push notification reliability still requires real-device APK validation
- true non-dismissible Android ongoing notifications are not claimed in the current Expo/EAS setup
- real-device QA is still required

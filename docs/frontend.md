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
- Expo push token registration
- Android push tap routing

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

- Expo notification permission request after authenticated bootstrap
- Expo push token registration to backend using JWT-protected device registration
- Android notification channel: `planner-reminders`
- foreground notification presentation through `expo-notifications`
- notification tap handling

Current tap behavior:

- notification with `goalId` opens `goals/[id]`
- reminder/system notification without a goal target opens Planner
- other notifications without a goal target open Profile/Notifications

Current supported push scenarios:

- task reminders
- missed task alerts
- progress feedback
- streak rewards
- daily planning reminders

## Planner UX

### Day View

Implemented:

- hourly timeline
- visually distinct availability blocks
- scheduled tasks rendered as time blocks
- unscheduled tasks section
- tap empty hour to quick-add task
- `Plan Day` floating action
- `PlanDaySheet`
- add/edit routine blocks
- quick task scheduling modal

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

## Task Creation UX

Current behavior:

- task creation works from goal detail
- task creation works from planner quick add
- tapped-hour quick add pre-fills:
  - `plannedDate`
  - `startTime`
  - `endTime = startTime + 1 hour`
- simplified modal keeps advanced options hidden until needed

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
- Android navigation bar forced dark
- light status bar
- main screens padded to avoid overlap with bottom navigation/system area

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

Current example in repo env:

```env
EXPO_PUBLIC_API_URL="https://planner-v79c.onrender.com"
```

Production note:

- Expo push token registration depends on the EAS project ID embedded in [app.config.ts](/c:/Users/Abdurahmon/planner/app.config.ts)
- proper Android notification icon asset is still not configured; Android will fall back to the app/default notification icon until a dedicated monochrome asset is added

## Current Limitations

- no drag-and-drop rescheduling
- no drag resize by duration
- no frontend AI generation/replan UI
- no frontend payment UI
- overlap handling in planner UI is still limited
- Android notification styling is still constrained by OS defaults
- push notification reliability still requires real-device APK validation
- real-device QA is still required

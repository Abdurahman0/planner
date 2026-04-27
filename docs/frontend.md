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

- in-app notifications list in Profile
- backend-driven push notifications for Android system delivery
- Android system push notifications are the primary notification experience
- Expo notification permission request only after authenticated bootstrap/login
- non-blocking in-app notice when notification permission is denied
- Expo push token registration to backend using JWT-protected device registration
- Android notification channel: `planner-reminders`
- foreground notification presentation through `expo-notifications`
- in-app foreground notification banner fallback
- notification tap handling

In-app notifications vs push notifications:

- in-app notifications are database records shown inside the Profile notifications panel
- push notifications are Android system notifications delivered through Expo to registered device tokens
- push delivery does not require the app UI to be open once the backend has a stored Expo token and the backend triggers notification generation

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

Current push flow:

- after authenticated app bootstrap, the app configures the Android notification channel
- it checks permission status
- if permission is `undetermined`, it requests permission once
- if permission is already denied, it shows a non-blocking message and does not spam the prompt
- if granted, it resolves the Expo project ID from:
  - `Constants.expoConfig?.extra?.eas?.projectId`
  - fallback: `Constants.easConfig?.projectId`
- if granted, it fetches the Expo push token using that EAS project ID
- it registers that token with `POST /notifications/devices`
- if device registration fails, it retries once safely
- authenticated push QA can use backend `POST /notifications/test-push` to confirm closed-app delivery on a real APK
- Profile exposes a temporary `Push Debug` section with safe status only:
  - permission status
  - project ID present yes/no
  - token created yes/no
  - backend registration confirmed yes/no
  - backend device count if a test push was attempted
  - last safe error summary
- in development only, the app logs safe push debug signals:
  - permission status
  - whether project ID was found
  - whether a token was created
  - whether backend registration succeeded

Foreground vs background behavior:

- foreground: Expo handler requests banner/list presentation, and the app also shows an in-app fallback banner
- background/closed app: Android system notification depends on backend-generated Expo push delivery, not the in-app list
- Profile still exposes recent backend notification records, but that list is not the primary user notification surface

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
- `Plan Day` uses `insets.bottom` with a small offset as its bottom anchor
- `PlanDaySheet`
- add/edit routine blocks
- quick task scheduling modal
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

## Task Creation UX

Current behavior:

- task creation works from goal detail
- task creation works from planner quick add
- tapped-hour quick add pre-fills:
  - `plannedDate`
  - `startTime`
  - `endTime = startTime + 1 hour`
- simplified modal keeps advanced options hidden until needed
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
- Android navigation bar is configured edge-to-edge on Android
- Android navigation bar uses absolute positioning and transparent background
- light status bar
- app content can render under the Android system navigation area
- main screens padded to avoid overlap with bottom navigation/system area
- planner modals and sheets apply safe-area-aware bottom padding for action buttons
- `Plan Day` floating button sits above tab bar and Android system navigation on device
- tab bar remains safe-area aware above the Android navigation buttons
- planner screens should only keep enough bottom spacing to clear the tab bar, Android nav area, and floating action button
- avoid double-counting bottom spacing between:
  - tab scene padding
  - planner scroll content padding
  - floating action positioning
- floating CTA buttons on main tabs use `insets.bottom` plus a minimal offset instead of tab-bar-height anchoring

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
- proper Android notification icon asset is still not configured; Android will fall back to the app/default notification icon until a dedicated monochrome asset is added
- testing true background/closed-app push requires an EAS-built APK, not the web preview

Troubleshooting `No push-ready Android device is registered yet`:

- check Profile `Push Debug`
- if `Permission = denied`, allow notifications in Android settings or app prompt
- if `Project ID = missing`, rebuild the APK from the linked EAS project
- if `Token created = no`, Expo token generation failed on-device
- if `Backend registration = not confirmed`, inspect backend route deployment or JWT-authenticated device registration
- if `Backend device count = 0`, the backend still has no usable Expo token for the authenticated user

## Current Limitations

- no drag-and-drop rescheduling
- no drag resize by duration
- no frontend AI generation/replan UI
- no frontend payment UI
- overlap handling in planner UI is still limited
- cross-midnight routine blocks must still be split manually
- Android notification styling is still constrained by OS defaults
- Android edge-to-edge behavior still requires real-device QA across OEM skins
- push notification reliability still requires real-device APK validation
- real-device QA is still required

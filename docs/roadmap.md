# Roadmap

## DONE

- schema and database foundation
- migrations and seed
- backend bootstrap
- auth
- goals API
- tasks API
- progress logs
- deadline movement logic
- frontend auth/goals/tasks integration
- AI backend integration
- payments backend
- notifications and retention backend
- planner scheduling layer
- Expo/EAS setup
- Android safe-area and system UI fixes
- planner modal safe-area fixes
- full 24-hour day timeline
- React Native chart/native compatibility fixes
- shared floating CTA system on main tab screens
- Profile test-push UX for real device notification validation
- auth screen UX hardening:
  - password visibility toggle
  - keyboard-safe layout
- Android push notification presentation:
  - Expo push token flow
  - Android channel setup
  - notification tap routing
  - authenticated permission request timing
  - foreground in-app fallback banner
  - backend test push endpoint
  - internal cron-triggerable notification sweep
- config-level Android edge-to-edge system bar setup
- recurring task and recurring routine-block model
- recurring occurrence expansion in planner views
- recurrence month-view counting/rendering fix
- unscheduled daily-task notification MVP
- notification dedupe hardening for unchanged daily-task reminders

## CURRENT

- real-device QA
- preview APK testing
- fixing mobile runtime issues
- planner UX polish
- full-day planner QA on real devices
- push notification real-device validation
- Expo push device registration validation on real APKs
- planner bottom spacing and floating action tuning on Android
- Render deployment verification for newly added API modules
- background/closed-app push verification on deployed backend
- real Android keyboard QA for planner/task modals
- Render redeploy verification for `/availability`, `/notifications/test-push`, and `/notifications/run-sweep`
- Firebase `google-services.json` and EAS FCM credential verification for APK push token creation
- OEM-specific Android nav bar transparency QA on physical devices
- final production QA after removing temporary push debug/profile record surfaces
- recurrence QA across day/week/month views
- daily-task notification QA on real Android devices

## NEXT

1. full Android QA
2. production environment verification and Render redeploy validation
3. AI planning improvement using saved availability
4. billing UI and payment status UX
5. dedicated Android notification icon asset and final push credential verification
6. single-occurrence edit/delete for recurring series
7. onboarding polish
8. launch preparation

## Notes

Not yet done:

- frontend AI flow
- frontend billing flow
- deep planner conflict handling
- drag-and-drop rescheduling
- native support for cross-midnight planner blocks without manual splitting
- true native ongoing/non-dismissible Android task notification if the product still requires it after Expo MVP validation
- full production scheduler/queue infrastructure beyond current cron + in-process fallback
- launch-grade QA and production verification

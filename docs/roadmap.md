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

## CURRENT

- real-device QA
- preview APK testing
- fixing mobile runtime issues
- planner UX polish
- full-day planner QA on real devices
- push notification real-device validation
- planner bottom spacing and floating action tuning on Android
- Render deployment verification for newly added API modules
- background/closed-app push verification on deployed backend
- Render redeploy verification for `/availability`, `/notifications/test-push`, and `/notifications/run-sweep`

## NEXT

1. full Android QA
2. production environment verification and Render redeploy validation
3. AI planning improvement using saved availability
4. billing UI and payment status UX
5. dedicated Android notification icon asset and final push credential verification
6. onboarding polish
7. launch preparation

## Notes

Not yet done:

- frontend AI flow
- frontend billing flow
- deep planner conflict handling
- drag-and-drop rescheduling
- native support for cross-midnight planner blocks without manual splitting
- full production scheduler/queue infrastructure beyond current cron + in-process fallback
- launch-grade QA and production verification

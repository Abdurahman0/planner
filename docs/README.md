# AI Planner Docs

## Overview

AI Planner is a mobile-first planner with:

- real auth
- real goals and tasks APIs
- planner scheduling and availability
- recurring tasks / routine blocks
- deadline projection from real progress
- backend AI plan generation / replan
- payment backend
- notifications / retention backend

## Current state

- backend: functional and deployable
- database: real and migrated
- mobile app: backend-connected and buildable
- planner UX: functional, still under real-device polish
- launch readiness: not complete

## Implemented

- Prisma schema and migrations
- auth / users / goals / tasks / availability
- recurring planner model
- standalone task ownership
- notifications backend with:
  - device registration
  - test push
  - sweep endpoint
- Expo push token registration
- Android native custom daily-task notification module
- Expo/EAS configuration at repo root

## Still unfinished

- final Android real-device QA
- frontend AI entry flow
- frontend billing flow
- single-occurrence edit/delete for recurring series
- true non-dismissible Android ongoing task notification

## Run backend

```bash
npm run backend:dev
```

Health check:

```text
http://localhost:3001/health
```

## Run mobile

```bash
npm install
npm run mobile:start
```

## Build Android APK

```bash
npx eas build -p android --profile preview --clear-cache
```

## Android push requirements

- `EXPO_PUBLIC_API_URL`
- valid Expo project ID in app config
- physical Android device for real push validation
- valid `google-services.json` for `com.aiplanner.mobile`
- valid EAS FCM V1 credentials
- deployed backend routes for:
  - `POST /notifications/devices`
  - `POST /notifications/test-push`
  - `POST /notifications/run-sweep`

If Expo push token creation fails with `Default FirebaseApp is not initialized`, the APK was built without correct Firebase client configuration. That is a native build/config issue, not a backend auth issue.

## Daily-task notification note

- visible daily-task reminder is Android-only
- visible daily-task reminder is rendered by the local Expo module in `modules/daily-task-notifications`
- backend sends a headless data-only push for daily-task reminder sync
- only one daily-task notification should exist per user/day
- up to 3 task rows are shown
- body tap opens Planner
- circle tap targets the exact task row
- circle tap shows an immediate checked-state update for that row while backend completion is being confirmed
- if JS/auth is unavailable in a killed app, the action may queue until the next authenticated resume

## Quick links

- [frontend.md](./frontend.md)
- [backend.md](./backend.md)
- [product.md](./product.md)
- [planner-logic.md](./planner-logic.md)
- [roadmap.md](./roadmap.md)
- [coding-rules.md](./coding-rules.md)

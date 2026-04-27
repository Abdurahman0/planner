# AI Planner Docs

## Overview

AI Planner is a mobile-first planner application with:

- real auth
- real goals and tasks APIs
- planner scheduling with availability blocks
- deadline projection from real progress logs
- AI plan generation and replanning
- payment backend for premium upgrades
- notification and retention backend

This is not a launched product. It is a **working production-style foundation plus active mobile QA/polish work**.

## Current Maturity

Current maturity level:

- backend: strong functional foundation
- database: real and migrated
- mobile app: backend-connected and buildable
- planner UX: functional, still being polished
- production launch readiness: not complete yet

## Implemented

- Prisma schema and migrations
- PostgreSQL/Neon integration
- backend bootstrap and health endpoint
- secure auth: register, login, JWT, `GET /users/me`
- goals API with ownership checks and premium AI-goal rules
- tasks API with status updates and `TaskProgressLog` writes
- projected deadline recalculation from real progress
- availability API and planner scheduling layer
- AI backend: generate plan, replan, quota checks, usage logging
- payments backend: Click, Payme, webhook-driven upgrades
- notifications backend: reminders, missed-task alerts, streaks, device registration
- backend-driven Expo push notifications with test-push and cron-triggered sweep endpoints
- real-device push debugging path in Profile for permission / project ID / token / registration verification
- mobile auth/goals/tasks/availability/notifications integration
- Android-safe-area and system navigation fixes
- Expo/EAS build configuration at repo root

## Still Unfinished

- real-device QA across Android flows
- frontend AI entry flow
- frontend billing/payment UX
- push notification production validation
- cron/scheduler production validation for closed-app push delivery
- deeper AI use of saved availability
- drag-and-drop or resize-based planner interactions

## Run Backend

Run from the repo root:

```bash
npm run backend:dev
```

Health check:

```text
http://localhost:3001/health
```

Expected response:

```json
{ "status": "ok" }
```

## Run Mobile App

Expo project root is the **repo root**, not `apps/mobile`.

Run from the repo root:

```bash
npm install
npm run mobile:start
```

Or:

```bash
npx expo start --lan --clear
```

## Build Mobile App

Run from the repo root:

```bash
npx eas build -p android --profile preview
```

`preview` currently builds an installable APK.

## API URL Configuration

For local mobile testing:

- set `EXPO_PUBLIC_API_URL` in the repo-root `.env`
- use a reachable backend URL

Example current production/deployment URL in this repo:

```env
EXPO_PUBLIC_API_URL="https://planner-v79c.onrender.com"
```

For EAS preview builds, `EXPO_PUBLIC_API_URL` must be set in the EAS environment so the APK resolves the backend correctly.

Push delivery note:

- Expo push notifications on the APK require:
  - notification permission on-device
  - valid Expo push token generation
  - working backend device registration
  - deployed backend routes for `POST /notifications/devices` and `POST /notifications/test-push`

## Quick Links

- [product.md](./product.md)
- [architecture.md](./architecture.md)
- [frontend.md](./frontend.md)
- [backend.md](./backend.md)
- [database.md](./database.md)
- [ai.md](./ai.md)
- [planner-logic.md](./planner-logic.md)
- [pricing.md](./pricing.md)
- [roadmap.md](./roadmap.md)
- [coding-rules.md](./coding-rules.md)

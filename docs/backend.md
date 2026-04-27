# Backend

## Status

The backend is functional and structured for deployment-style use. It is not a toy scaffold anymore.

Implemented areas:

- bootstrap
- auth
- users
- goals
- tasks
- availability
- AI
- payments
- notifications
- retention logic

## Implemented Endpoints

### Health

- `GET /health`

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Users

- `GET /users/me`

### Goals

- `POST /goals`
- `GET /goals`
- `GET /goals/:id`
- `PATCH /goals/:id`
- `DELETE /goals/:id`

### Tasks

- `POST /tasks`
- `GET /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `PATCH /tasks/:id/status`

### Availability

- `POST /availability`
- `GET /availability`
- `PATCH /availability/:id`
- `DELETE /availability/:id`

### AI

- `POST /ai/generate-plan`
- `POST /ai/replan`

### Payments

- `POST /payments/initiate`
- `POST /payments/webhook`

### Notifications

- `GET /notifications`
- `GET /notifications/summary`
- `POST /notifications/refresh`
- `POST /notifications/devices`
- `POST /notifications/test-push`
- `POST /notifications/run-sweep`
- `PATCH /notifications/:id/read`

## Security Protections

Implemented protections:

- JWT on user-owned routes
- DTO validation with global `ValidationPipe`
- ownership checks on goals, tasks, availability, notifications
- safe auth responses
- password hashing with `bcryptjs`
- passwords stored only as `passwordHash`
- password hashes never returned from API responses
- generic invalid-credentials behavior
- premium AI-goal enforcement in backend
- AI quota enforcement in backend
- payment webhook verification
- idempotent payment processing

Auth UX note:

- frontend password visibility toggle does not change backend auth or password storage behavior
- backend does not log or persist plain-text passwords

## Goal Rules

Implemented:

- free users cannot create AI goals
- premium users can create AI goals
- premium users can have at most 3 active AI-managed goals
- `projectedDate` starts equal to `targetDate`
- deletes are soft archive for goals

## Task and Progress Rules

Implemented:

- tasks are goal-owned
- task status changes write `TaskProgressLog`
- projected deadline recalculation happens from real task progress
- scheduled tasks support:
  - `plannedDate`
  - `startTime`
  - `endTime`
- unscheduled tasks remain valid

## Availability Rules

Implemented:

- weekly recurring schedule blocks
- supported types:
  - `sleep`
  - `eating`
  - `work`
  - `study`
  - `available`
  - `blocked`
  - `custom`
- time format validation
- `endTime > startTime`
- overlapping blocks rejected

Deployment note:

- the route exists in local code and is registered in `AppModule`
- if a deployed environment returns `Cannot GET /availability`, that deployment is stale or misbuilt rather than missing the controller locally
- verified on April 26, 2026:
  - `https://planner-v79c.onrender.com/availability` returned `404`
  - Render must be redeployed from the latest commit before planner availability works on the APK

## AI Rules

Implemented:

- generate-plan
- replan
- strict JSON validation
- usage logging
- provider call isolation from DB writes

Current limitation:

- saved availability exists, but AI does not yet deeply schedule against it in the way the planner now supports

## Payment Rules

Implemented:

- Click integration
- Payme integration
- `PaymentTransaction` persistence
- webhook-only subscription upgrades
- idempotent repeated webhook handling

Current limitation:

- production credentials and provider ops still need full live verification
- no refund/reconciliation UI

## Notification and Retention Rules

Implemented:

- notification storage
- device registration
- device registration happens through `POST /notifications/devices` after authenticated mobile bootstrap
- reminder generation
- missed-task alerts
- progress feedback
- streak summary/rewards
- Expo push delivery for Android system notifications
- daily planning reminder generation
- `POST /notifications/refresh` is available for authenticated manual QA
- `POST /notifications/test-push` sends a direct test push to the authenticated user's registered Expo devices
- `POST /notifications/run-sweep` exists for internal scheduler/cron use and requires `x-internal-cron-secret`
- `POST /notifications/devices` returns a safe registration summary:
  - `status`
  - `registered`
- `POST /notifications/test-push` returns a safe delivery summary:
  - `deviceCount`
  - `pushesAttempted`
  - `sentCount`
  - `invalidTokenCount`
- `POST /notifications/run-sweep` returns a safe operational summary:
  - `status`
  - `processedUsers`
  - `notificationsCreated`
  - `pushesAttempted`

In-app notifications vs push notifications:

- in-app notifications are rows stored in the `Notification` table and returned by `GET /notifications`
- push notifications are best-effort Expo deliveries sent to `UserDevice` tokens after a notification is created
- a saved in-app notification does not guarantee Android system delivery unless the Expo push send succeeds and the device token is valid

Current limitation:

- push delivery reliability still needs real-device validation
- no Expo receipts polling yet beyond immediate ticket parsing

Current supported push content:

- task reminder:
  - `Time to continue your plan`
- missed task alert:
  - `Task missed`
- progress feedback:
  - behind schedule -> `You are falling behind`
  - on track / ahead -> `You are on track`
- streak reward:
  - `3-day streak`, `7-day streak`, and other configured milestones
- daily planning reminder:
  - `Plan your day`

Expo push payload shape:

```json
{
  "to": "ExpoPushToken[...]",
  "title": "Time to continue your plan",
  "body": "You have 2 tasks scheduled for today.",
  "sound": "default",
  "priority": "high",
  "channelId": "planner-reminders",
  "data": {
    "notificationId": "uuid",
    "type": "reminder",
    "goalId": "optional-uuid",
    "taskId": "optional-uuid"
  }
}
```

Security properties:

- device registration remains JWT-protected
- test-push remains JWT-protected and only targets the authenticated user's devices
- device registration never accepts a client-controlled `userId`
- Expo device tokens are validated before storage and empty/invalid values are rejected
- push payloads contain routing metadata only
- no secrets or private account data are sent in Expo push payloads
- notification access remains user-scoped
- push delivery parameters are backend-controlled:
  - `channelId: planner-reminders`
  - `sound: default`
  - `priority: high`
- invalid Expo tokens are removed when Expo tickets indicate `DeviceNotRegistered` or malformed token errors

Background / closed-app delivery:

- the backend still keeps the in-process hourly sweep as a simple fallback
- the safer trigger is `POST /notifications/run-sweep` with `x-internal-cron-secret`
- use that endpoint from Render Cron Job or another scheduler if the deployed service can sleep
- `INTERNAL_CRON_SECRET` must stay server-side only
- recommended MVP cron schedule:
  - every 5 minutes for timely reminders
  - every 10 minutes if resource-sensitive
- if the Render instance can sleep, cron-triggered delivery may still be delayed by wake-up time
- reliable Telegram-style closed-app notifications need an always-on backend or equivalent paid uptime

## Deployment Notes

Current environment in repo points to:

- backend base URL: `https://planner-v79c.onrender.com`

Recommended Render configuration:

- build command:
  - `npm install && npx prisma generate --schema apps/backend/prisma/schema.prisma && npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma`
- start command:
  - `npm run backend:start`
- required environment variables:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
  - `GEMINI_API_KEY`
  - `APP_BASE_URL`
  - `INTERNAL_CRON_SECRET`
  - payment provider variables as needed

Route verification after redeploy:

- `GET /health`
- `GET /availability` with Bearer token
- `POST /notifications/devices` with Bearer token
- `POST /notifications/test-push` with Bearer token
- `POST /notifications/run-sweep` with `x-internal-cron-secret`

This documents the current deployment target/example. It does not mean launch readiness is complete.

## Known Backend Limitations

- no admin feature set
- no task delete endpoint
- planner conflict handling is still basic
- no background job system beyond current in-process scheduling logic
- live payment and push reliability still need end-to-end QA
- deployment verification is still required when new modules/routes are added

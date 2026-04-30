# Backend

## Status

Implemented:

- auth
- users
- goals
- tasks
- availability
- AI plan generation / replan
- payments
- notifications / retention

## Endpoints

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

### Notifications

- `GET /notifications`
- `GET /notifications/summary`
- `POST /notifications/refresh`
- `POST /notifications/devices`
- `POST /notifications/test-push`
- `POST /notifications/run-sweep`
- `PATCH /notifications/:id/read`

## Security

- JWT on user-owned routes
- DTO validation
- no client-controlled `userId`
- ownership checks on goals, tasks, availability, notifications, and devices
- passwords stored only as hashes
- push device registration remains JWT-protected
- task completion from notification actions still goes through the JWT-protected task status endpoint

## Tasks and Recurrence

- tasks are directly user-owned
- tasks may optionally belong to a goal
- standalone tasks are valid and user-scoped through `Task.userId`
- recurring task series support:
  - `none`
  - `daily`
  - `weekly`
  - `monthly`
  - `yearly`
- recurring occurrence overrides are stored in `TaskOccurrence`
- recurrence expansion is bounded to visible/query ranges
- monthly/yearly recurrence uses calendar-date clamping for end-of-month and leap-year safety

## Availability

- recurring routine blocks support:
  - `none`
  - `daily`
  - `weekly`
  - `monthly`
  - `yearly`
- overlap checks remain enforced
- cross-midnight single-block availability is still not supported

## Notifications

### Standard notifications

Backend creates notification rows and sends Expo push for:

- scheduled reminders
- missed-task alerts
- progress feedback
- streak rewards
- day-planning reminders

### Daily-task notification architecture

Current Android daily-task reminder path:

- backend remains the source of truth for task state
- backend still creates one logical daily-task reminder record per user/day
- backend does **not** send a visible Expo alert for that reminder
- backend sends a headless data-only Expo push for daily-task notification updates
- mobile JS receives that background payload and asks the Android local Expo module to show/update one native custom notification

Visible reminder rules:

- one notification per user/day
- up to 3 task rows
- ordering: oldest created incomplete unscheduled tasks first
- if more remain: `+N more tasks`

Headless daily-task payload shape:

```json
{
  "to": "ExpoPushToken[...]",
  "_contentAvailable": true,
  "priority": "high",
  "ttl": 60,
  "data": {
    "notificationKind": "daily_tasks",
    "notificationKey": "daily_tasks_<userId>_<YYYY-MM-DD>",
    "displayTitle": "Daily Tasks",
    "tasks": [
      { "id": "uuid", "label": "Read book", "occurrenceDate": "2026-04-30T00:00:00.000Z" }
    ],
    "moreCount": 2,
    "plannerDate": "2026-04-30T00:00:00.000Z",
    "mode": "upsert"
  }
}
```

Cancel payload:

- same `notificationKind`
- same `notificationKey`
- `mode: "cancel"`
- empty `tasks`

### Daily-task completion

- circle taps from the native Android notification do not trust local state
- completion still uses `PATCH /tasks/:id/status`
- recurring occurrences use `occurrenceDate` when needed
- the Android notification may show a temporary checked state immediately after the tap, but backend confirmation still determines the final task state
- if the app process is alive, JS completes the task immediately
- if the app process is killed and JS/auth is unavailable, the action may queue until the next authenticated resume

### Dedupe

- one logical daily-task notification key:
  - `daily_tasks_${userId}_${YYYY-MM-DD}`
- unchanged content is not re-pushed on every sweep
- sweep uses dedupe/cooldown instead of creating unlimited duplicates

### Device registration and push test

- `POST /notifications/devices` returns:
  - `status`
  - `registered`
- `POST /notifications/test-push` returns:
  - `deviceCount`
  - `pushesAttempted`
  - `sentCount`
  - `invalidTokenCount`
- invalid Expo tokens are removed when provider feedback marks them unregistered or malformed

## Deployment

Recommended Render config:

- build:
  - `npm install && npx prisma generate --schema apps/backend/prisma/schema.prisma && npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma`
- start:
  - `npm run backend:start`

Required env:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `GEMINI_API_KEY`
- `APP_BASE_URL`
- `INTERNAL_CRON_SECRET`
- payment provider variables as needed

Verification after redeploy:

- `GET /health`
- `GET /availability` with Bearer token
- `POST /notifications/devices` with Bearer token
- `POST /notifications/test-push` with Bearer token
- `POST /notifications/run-sweep` with `x-internal-cron-secret`

## Known Limitations

- single-occurrence edit/delete is not implemented
- no true non-dismissible Android ongoing notification
- closed-app daily-task circle completion is best-effort; it may queue until next authenticated resume
- push reliability still needs final real-device QA on the target APK/OEMs

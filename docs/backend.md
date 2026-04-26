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
- reminder generation
- missed-task alerts
- progress feedback
- streak summary/rewards
- Expo push delivery for Android system notifications
- daily planning reminder generation

Current limitation:

- push delivery reliability still needs real-device validation
- no receipt processing yet

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
- push payloads contain routing metadata only
- no secrets or private account data are sent in Expo push payloads
- notification access remains user-scoped

## Deployment Notes

Current environment in repo points to:

- backend base URL: `https://planner-v79c.onrender.com`

This documents the current deployment target/example. It does not mean launch readiness is complete.

## Known Backend Limitations

- no admin feature set
- no task delete endpoint
- planner conflict handling is still basic
- no background job system beyond current in-process scheduling logic
- live payment and push reliability still need end-to-end QA
- deployment verification is still required when new modules/routes are added

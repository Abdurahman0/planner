# Backend

## Current Backend Status

The backend is now runnable and has real API foundation.

Implemented:

- NestJS bootstrap
- `main.ts`
- CORS
- global `ValidationPipe`
- Prisma integration
- health endpoint
- auth endpoints
- protected current-user endpoint
- JWT-protected goals API
- JWT-protected tasks API
- TaskProgressLog writes on task status updates
- projected deadline recalculation on task status updates
- JWT-protected AI planning endpoints
- AI usage logging
- AI task creation through backend services
- payment initiation endpoint
- payment webhook processing
- subscription upgrades from verified payment webhooks
- notifications API
- retention summary API
- device registration for Expo push
- daily reminder generation
- missed task alert generation
- progress feedback generation
- streak notification generation

Not implemented yet:

- admin

## Current Structure

Main backend areas:

- `apps/backend/src/main.ts`
- `apps/backend/src/app.module.ts`
- `apps/backend/src/prisma`
- `apps/backend/src/modules/health`
- `apps/backend/src/modules/auth`
- `apps/backend/src/modules/users`
- `apps/backend/src/modules/goals`
- `apps/backend/src/modules/tasks`
- `apps/backend/src/modules/ai`
- `apps/backend/src/modules/payments`
- `apps/backend/src/modules/notifications`
- scaffold `subscriptions` module remains, but payment logic now lives in `payments`

## Modules

### Health

Implemented:

- `GET /health`

Response:

```json
{ "status": "ok" }
```

### Auth

Implemented:

- `POST /auth/register`
- `POST /auth/login`
- JWT signing
- password hashing with `bcryptjs`
- DTO validation
- JWT Bearer auth strategy

### Users

Implemented:

- `GET /users/me`

This route is protected and returns the authenticated user's safe profile.

### Goals

Implemented:

- `POST /goals`
- `GET /goals`
- `GET /goals/:id`
- `PATCH /goals/:id`
- `DELETE /goals/:id`

Rules enforced:

- all goal routes require JWT
- authenticated user id is the only source of `userId`
- ownership is enforced on read/update/delete
- non-owned goals return `404`
- free users cannot create AI-managed goals
- premium users can create AI-managed goals
- premium users can have at most 3 active AI-managed goals
- create sets `projectedDate = targetDate`
- delete soft-archives goal by setting `status = archived`

### Tasks

Current status:

- `POST /tasks`
- `GET /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `PATCH /tasks/:id/status`

Rules enforced:

- all task routes require JWT
- authenticated user id is the only source of ownership
- goal ownership is validated before task creation
- task ownership is enforced through the related goal on read/update/status update
- non-owned tasks return `404`
- `goalId` cannot be changed through the update endpoint
- protected fields such as `createdAt` and `updatedAt` are not writable
- status changes are isolated to `PATCH /tasks/:id/status`
- every status update writes a `TaskProgressLog` record
- every status update recalculates `Goal.projectedDate`

Current limitations:

- no delete endpoint yet
- no task-specific planner scheduling rules beyond field validation
- deadline recalculation currently runs from task status/progress events, not from task create/update

### AI

Current status:

- `POST /ai/generate-plan`
- `POST /ai/replan`

Rules enforced:

- all AI routes require JWT
- free users cannot use AI planning
- AI usage is quota-limited per user
- AI output must be strict JSON
- AI output is schema-validated before persistence
- AI never writes directly to DB
- backend persists AI-generated tasks through `TasksService`
- replan replaces incomplete AI-generated tasks only

Required env vars:

- `GEMINI_API_KEY`
- optional `AI_MODEL`

### Subscriptions

Current status:

- subscription rows are updated from successful payment webhooks
- `User.subscriptionPlan` is updated only by backend payment processing
- plan extension duration is currently 30 days per paid transaction

### Payments

Current status:

- `POST /payments/initiate`
- `POST /payments/webhook`

Rules enforced:

- `POST /payments/initiate` requires JWT
- webhook confirmation is the only path that upgrades a user
- frontend success is not trusted
- every payment attempt is stored in `PaymentTransaction`
- successful webhook processing updates both `Subscription` and `User.subscriptionPlan`
- duplicate webhook processing is idempotent
- Click webhooks verify the signed payload before processing
- Payme webhooks verify Basic auth credentials and source IP before processing
- payment upgrades are provider-driven but backend-controlled

Providers:

- Click:
  - initiate returns a hosted checkout URL payload
  - webhook handles prepare/complete callbacks
- Payme:
  - initiate returns a checkout URL and checkout form fields
  - webhook handles Merchant API methods:
    - `CheckPerformTransaction`
    - `CreateTransaction`
    - `PerformTransaction`
    - `CancelTransaction`
    - `CheckTransaction`
    - `GetStatement`

Current limitations:

- no frontend billing screen yet
- no refund workflow
- no fiscal receipt handling
- no provider reconciliation dashboard

### Notifications

Current status:

- `GET /notifications`
- `GET /notifications/summary`
- `POST /notifications/refresh`
- `POST /notifications/devices`
- `PATCH /notifications/:id/read`

Rules enforced:

- all notification routes require JWT
- notifications are always user-scoped
- device registration is user-scoped
- notifications are deduplicated with backend-generated `dedupeKey`
- push delivery is best-effort and never changes notification truth in DB
- the frontend cannot mark another user's notifications as read

Retention behavior implemented:

- daily task reminder notification when the user has tasks scheduled for today
- missed task alert when overdue tasks remain incomplete
- progress feedback notification when projected deadlines move behind or ahead of target dates
- streak reward notification when the user hits configured completion streak milestones

Current implementation details:

- notification generation is backed by real `Task`, `TaskProgressLog`, and `Goal.projectedDate` data
- streaks are derived from real `TaskProgressLog` `done` entries, not frontend counters
- task status updates trigger streak evaluation
- a periodic backend sweep generates daily reminders, missed-task alerts, and progress feedback
- Expo push tokens are stored in `UserDevice` and push delivery is sent through the Expo push API

Current limitations:

- there is no native push receipt processing yet
- there is no notification preference system yet
- there is no background job infrastructure beyond the in-process sweep interval

## Implemented Endpoints

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`
- `POST /goals`
- `GET /goals`
- `GET /goals/:id`
- `PATCH /goals/:id`
- `DELETE /goals/:id`
- `POST /tasks`
- `GET /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `PATCH /tasks/:id/status`
- `POST /ai/generate-plan`
- `POST /ai/replan`
- `POST /payments/initiate`
- `POST /payments/webhook`
- `GET /notifications`
- `GET /notifications/summary`
- `POST /notifications/refresh`
- `POST /notifications/devices`
- `PATCH /notifications/:id/read`

## Auth Response Shape

Register/login currently return:

```json
{
  "accessToken": "jwt",
  "user": {
    "id": "string",
    "email": "user@example.com",
    "subscriptionPlan": "free"
  }
}
```

`GET /users/me` currently returns:

```json
{
  "id": "string",
  "email": "user@example.com",
  "subscriptionPlan": "free"
}
```

## Required Env Vars

- `DATABASE_URL`
- `JWT_SECRET`
- optional `JWT_EXPIRES_IN`
- optional `BACKEND_PORT`
- `APP_BASE_URL`
- optional `PAYMENT_RETURN_URL`
- `PAYME_MERCHANT_ID`
- optional `PAYME_MERCHANT_LOGIN`
- `PAYME_MERCHANT_KEY`
- optional `PAYME_CHECKOUT_URL`
- `CLICK_SERVICE_ID`
- `CLICK_MERCHANT_ID`
- `CLICK_SECRET_KEY`
- optional `CLICK_CHECKOUT_URL`

## Deadline Projection Logic

Current implementation:

- expected workload is derived from task definitions
  - `estimatedMinutes` for `time_based`
  - `targetValue` for `unit_based`
- completed workload is derived from `TaskProgressLog`
  - `completionPercent` for `time_based`
  - `completedValue` for `unit_based`
- due workload is based on tasks planned on or before the current date
- if completed workload is below due workload, `projectedDate` extends
- if completed workload is above due workload, `projectedDate` shrinks
- all projected date updates are done by backend code only

## Immediate Backend Next Step

The next backend implementation target is launch readiness and growth execution:

- production-safe background job infrastructure for notifications
- launch instrumentation and retention analytics
- growth loops on top of the current subscription and notification system

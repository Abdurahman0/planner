# Backend

## Current Backend Status

The backend is a NestJS scaffold, not a usable production API yet.

Current files:

- `apps/backend/src/app.module.ts`: Imports auth, users, goals, tasks, AI, and subscriptions modules.
- `apps/backend/src/prisma/prisma.service.ts`: Prisma client service with connect/disconnect hooks.
- `apps/backend/src/modules/ai/ai.controller.ts`: Exposes AI plan generation and replan endpoints.
- `apps/backend/src/modules/ai/ai.service.ts`: Placeholder AI service returning empty arrays.
- `apps/backend/src/modules/goals/goals.service.ts`: Contains partial goal creation and goal query logic.
- `apps/backend/src/modules/tasks/tasks.service.ts`: Contains partial task status update and projected date recalculation logic.
- `apps/backend/src/modules/auth/auth.module.ts`: Empty module.
- `apps/backend/src/modules/users/users.module.ts`: Empty module.
- `apps/backend/src/modules/subscriptions/subscriptions.module.ts`: Empty module.

## Missing Backend Foundation

The backend currently lacks:

- `main.ts` bootstrap.
- HTTP server startup configuration.
- Controllers for users, goals, tasks, plans, progress, subscriptions, notifications, and devices.
- Auth implementation.
- Guards.
- JWT/session logic.
- Password hashing flow.
- DTO classes.
- Request validation pipes.
- Response serializers.
- Error handling policy.
- Logging.
- Rate limiting.
- CORS configuration.
- API versioning.
- Frontend integration.

## Current Modules

### Auth

Current status: missing.

What exists:

- Empty `AuthModule`.

Required:

- Register/login endpoints.
- Password hashing.
- JWT or session issuance.
- Refresh/session handling.
- Auth guard.
- Current user context.
- Device/session tracking integration.

### Users

Current status: missing.

What exists:

- Empty `UsersModule`.
- Prisma `User` model.

Required:

- User profile endpoint.
- Subscription status read model.
- User settings.
- Availability/schedule endpoints once modeled.

### Goals

Current status: partial service only.

What exists:

- `GoalsService.createGoal(userId, data)`.
- `GoalsService.getGoals(userId)`.
- Partial AI goal limit logic.

Problems:

- No `GoalsController`.
- No DTO validation.
- No auth guard.
- Limit logic is inconsistent for free users. It calculates a limit of 3 for non-pro users, then only throws for free users when `aiGoalsCount >= limit`, which would allow a free user with fewer than 3 AI goals.
- No transaction when creating AI goal, plan, milestones, and tasks.

### Tasks

Current status: partial service only.

What exists:

- `TasksService.updateTaskStatus(taskId, status)`.
- Recalculates projected date after update.

Problems:

- No `TasksController`.
- No auth/user ownership checks.
- No progress log write.
- No partial completion handling.
- No failed-task flow.
- No unit/time validation.
- Projection logic is too weak for product requirements.

### Plans

Current status: schema only.

Required:

- Current plan retrieval.
- Plan version creation.
- Replan transition.
- Milestone persistence.
- Link tasks to plan versions.

### Progress

Current status: schema only.

Required:

- Task progress log write API.
- Unit-based progress API.
- Time-based progress API.
- Analytics query endpoints.

### AI

Current status: placeholder endpoint and service.

What exists:

- `POST /ai/generate-plan`.
- `POST /ai/replan`.
- Empty `generatePlan()` and `replan()` return values.

Problems:

- No auth guard.
- No subscription/quota enforcement.
- No provider call.
- No schema validation of AI output.
- No usage logging.
- Uses `any` for replan request body.

### Subscriptions

Current status: missing.

What exists:

- Empty `SubscriptionsModule`.
- Prisma `Subscription` model.

Required:

- Payment provider integration.
- Webhook endpoint.
- Subscription status sync.
- Premium entitlement resolver.

### Notifications

Current status: schema only.

Required:

- Notification preferences.
- Push token registration.
- Reminder scheduling.
- Delivery provider integration.
- Notification read state API.

## API Structure Expectations

Minimum first API surface:

- `POST /auth/register`
- `POST /auth/login`
- `GET /me`
- `GET /goals`
- `POST /goals`
- `GET /goals/:id`
- `PATCH /goals/:id`
- `GET /goals/:id/tasks`
- `POST /goals/:id/tasks`
- `PATCH /tasks/:id/status`
- `POST /tasks/:id/progress`
- `POST /ai/goals/:goalId/generate-plan`
- `POST /ai/goals/:goalId/replan`
- `GET /subscriptions/current`
- `POST /devices`

## Can Frontend Move To Real Backend Quickly?

Partially, but not safely without backend foundation work first.

Fast path:

- Add NestJS bootstrap.
- Add auth.
- Add goals and tasks controllers.
- Add DTOs and validation.
- Add ownership checks.
- Add typed frontend API client.
- Replace mock Zustand server data with React Query.

Do not connect the frontend directly to the current backend services without fixing auth, validation, and ownership. That would create insecure API behavior.


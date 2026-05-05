# Backend

## Current role

Backend remains the source of truth for:

- users
- goals
- tasks
- availability
- progress logs
- notifications
- push device registration

## Security

- JWT protects user-owned routes
- no client-controlled `userId`
- ownership checks on goals, tasks, notifications, devices, and availability
- push completion actions still go through authenticated task-status updates
- no sensitive data is placed into notification payloads beyond task titles and safe routing metadata

## Priority model

### Goal

- `Goal.priority` exists and remains required

### Task

- `Task.priority` now exists and is optional
- if `Task.priority` is null:
  - it inherits goal priority when a goal exists
  - otherwise it falls back to `medium`

Effective priority:

- `task.priority ?? goal.priority ?? medium`

## Task behavior

- standalone tasks remain directly user-owned through `Task.userId`
- goal-linked tasks still validate goal ownership
- recurring tasks still expand by visible/query range
- recurring occurrence completion still uses `TaskOccurrence`
- backend responses now include:
  - `priority`
  - `goalPriority`
  - `effectivePriority`

## Notification behavior

### Scheduled reminders

Scheduled reminders now use effective priority.

Behavior:

- backend selects the current due scheduled task for the user
- reminder copy changes by effective priority
- Android channel changes by effective priority
- high-priority reminders can re-alert while still incomplete through resend cooldown

Selection order for due work:

1. effective priority descending
2. scheduled time ascending
3. `createdAt` ascending

Channels:

- `planner-high-priority`
- `planner-reminders`
- `planner-low-priority`

### Missed task alerts

- missed-task alerts now use the highest-priority missed task when building copy/channel behavior

### Daily tasks

- one logical daily-task notification key per user/day
- body still shows max 3 tasks
- ordering is now:
  - priority descending
  - createdAt ascending
- visible daily-task UI is still Android native custom notification, not standard Expo alert

## Endpoints

Main relevant routes:

- `POST /tasks`
- `PATCH /tasks/:id`
- `PATCH /tasks/:id/status`
- `POST /notifications/devices`
- `POST /notifications/test-push`
- `POST /notifications/run-sweep`

## Deployment

Render backend must be redeployed after this change because:

- Prisma schema changed
- task serialization changed
- notification generation and channel routing changed

Recommended build command:

```bash
npm install && npx prisma generate --schema apps/backend/prisma/schema.prisma && npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma
```

Recommended start command:

```bash
npm run backend:start
```

## Limitations

- no true Android alarm/full-screen wake flow
- current high-priority behavior is stronger reminder routing, not a full native alarm app
- recurring single-occurrence edit/delete is still future work

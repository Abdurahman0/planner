# Database

## Current Schema Status

The Prisma schema is located at `apps/backend/prisma/schema.prisma`.

It validates successfully when `DATABASE_URL` is supplied. The repository `.env.example` is empty, so local Prisma validation fails unless the environment variable is set manually.

Current database provider:

- PostgreSQL.

## Current Entities

### User

Fields:

- `id`
- `email`
- `passwordHash`
- `subscriptionPlan`
- `createdAt`
- `updatedAt`

Relations:

- Goals
- Devices
- Subscriptions
- Referrals
- Admin audit logs

Notes:

- `subscriptionPlan` is a string, not a Prisma enum.
- No role field exists for admin behavior.
- No user settings or schedule/availability relation exists.

### UserDevice

Fields:

- `id`
- `userId`
- `token`
- `platform`
- `createdAt`

Purpose:

- Intended for push notification device tracking.

Gaps:

- No last seen timestamp.
- No disabled/revoked state.
- No notification permission state.

### Subscription

Fields:

- `id`
- `userId`
- `planType`
- `status`
- `paymentId`
- `startDate`
- `endDate`
- `createdAt`

Purpose:

- Intended to track premium entitlement.

Gaps:

- No provider field.
- No external customer ID.
- No external subscription ID.
- No webhook event tracking.
- No currency or price reference.

### Goal

Fields:

- `id`
- `userId`
- `title`
- `description`
- `type`
- `targetDate`
- `projectedDate`
- `isCompleted`
- `createdAt`
- `updatedAt`

Relations:

- User
- Plans
- Tasks

Purpose:

- Represents manual or AI-managed user goals.

Gaps:

- `type` is a string, not an enum.
- No priority field, while shared frontend `Goal` has `priority`.
- No status field, while shared frontend `Goal` has `status`.
- No archived/completed timestamp.
- No explicit AI consistency flag.

### Plan

Fields:

- `id`
- `goalId`
- `version`
- `isCurrent`
- `createdAt`

Relations:

- Goal
- Milestones

Purpose:

- Intended for AI plan versioning and replanning.

Gaps:

- Tasks are not linked to a plan version.
- No prompt/input snapshot.
- No AI output snapshot.
- No reason for replan.
- No status.

### Milestone

Fields:

- `id`
- `planId`
- `title`
- `description`
- `order`

Purpose:

- Plan-level milestone grouping.

Gaps:

- No target date.
- No completion state.
- No task relation.

### Task

Fields:

- `id`
- `goalId`
- `title`
- `description`
- `status`
- `type`
- `plannedDate`
- `completedDate`
- `timeEstimateMinutes`
- `unitTarget`
- `unitCompleted`
- `unitName`
- `isAiGenerated`
- `order`
- `createdAt`
- `updatedAt`

Purpose:

- Represents planned work for a goal.

Gaps:

- `status` and `type` are strings, not enums.
- No `startTime` or `endTime`, while frontend scheduled tasks use these fields.
- No duration layout fields for calendar rendering.
- No `planId`, so task cannot be tied to a specific plan version.
- No priority.
- No recurrence.
- No source metadata for AI/manual edits.

### TaskProgressLog

Fields:

- `id`
- `taskId`
- `status`
- `unitCompleted`
- `notes`
- `createdAt`

Purpose:

- Intended history of task completion and progress.

Gaps:

- No `userId`.
- No time spent field.
- No planned vs actual comparison fields.
- Not written by current frontend.
- Not written by current backend task update service.

### AiUsageLog

Fields:

- `id`
- `userId`
- `goalId`
- `action`
- `tokens`
- `createdAt`

Purpose:

- Intended AI cost and quota tracking.

Gaps:

- No Prisma relations to User or Goal.
- No provider.
- No model name.
- No input/output token split.
- No cost estimate.
- No success/failure status.
- No error fields.

### Referral

Fields:

- `id`
- `referrerId`
- `referredId`
- `status`
- `createdAt`

Purpose:

- Intended referral tracking.

Gaps:

- `referredId` has no relation to User.
- No reward tracking.
- No referral code.

### Notification

Fields:

- `id`
- `userId`
- `title`
- `body`
- `type`
- `isRead`
- `createdAt`

Purpose:

- Intended in-app notification record.

Gaps:

- No Prisma relation to User.
- No scheduled time.
- No delivered time.
- No push provider receipt.
- No deep link.
- No notification preferences.

### AdminAuditLog

Fields:

- `id`
- `adminId`
- `action`
- `target`
- `createdAt`

Purpose:

- Intended admin audit logging.

Gaps:

- No admin role model.
- No metadata JSON.
- No target type/ID split.

## Missing Data Concepts

The intended product needs these concepts before production:

- Prisma enums for subscription plans, goal types, goal statuses, task statuses, task types, notification types, and AI actions.
- User availability/schedule model.
- Plan-to-task version relationship.
- Scheduled task start/end fields.
- Task progress logs that support time-based and unit-based progress.
- AI usage logs with provider/model/cost metadata and relations.
- Subscription provider identifiers and webhook event tracking.
- Notification delivery and scheduling fields.
- Device/session state.


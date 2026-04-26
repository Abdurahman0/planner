# Database

## Overview

The app uses Prisma with PostgreSQL.

Current repo/environment indicates:

- PostgreSQL on Neon
- migrations applied
- seed runnable and aligned with current schema

## Core Models

### User

Purpose:

- identity
- auth ownership root
- subscription plan root

Key relations:

- `goals`
- `devices`
- `subscriptions`
- `availabilitySlots`
- `taskProgressLogs`
- `aiUsageLogs`
- `paymentTransactions`
- `notifications`
- `referrals`
- `auditLogs`

### UserDevice

Purpose:

- stores push notification device tokens

Key fields:

- `token`
- `platform`

### Subscription

Purpose:

- stores subscription periods and status

Key fields:

- `planType`
- `status`
- `paymentId`
- `startDate`
- `endDate`

### PaymentTransaction

Purpose:

- durable record for payment initiation and webhook processing

Key fields:

- `userId`
- `planType`
- `provider`
- `status`
- `amountMinor`
- `currency`
- `localReference`
- `externalId`
- `providerPayload`
- `errorMessage`
- `webhookAttempts`
- `processedAt`

### Goal

Purpose:

- high-level planning container

Key fields:

- `type`
- `priority`
- `status`
- `targetDate`
- `projectedDate`
- `isCompleted`

Relations:

- `user`
- `plans`
- `tasks`
- `aiUsageLogs`

### Plan

Purpose:

- versioned plan record for a goal

Key fields:

- `goalId`
- `version`
- `isCurrent`

Relations:

- `goal`
- `milestones`
- `tasks`

### Milestone

Purpose:

- optional intermediate plan structure

Key fields:

- `planId`
- `title`
- `description`
- `order`
- `targetDate`

### Task

Purpose:

- executable work item under a goal

Key fields:

- `goalId`
- `planId`
- `milestoneId`
- `title`
- `description`
- `status`
- `type`
- `plannedDate`
- `startTime`
- `endTime`
- `estimatedMinutes`
- `targetValue`
- `completedValue`
- `targetUnit`
- `source`
- `order`

Scheduled task fields:

- `plannedDate`
- optional `startTime`
- optional `endTime`

This is the current scheduling foundation used by the planner UI.

### TaskProgressLog

Purpose:

- immutable progress history per task status/progress event

Key fields:

- `userId`
- `taskId`
- `status`
- `completionPercent`
- `completedValue`
- `note`
- `loggedAt`

This model drives projected deadline recalculation and retention metrics.

### AvailabilitySlot

Purpose:

- persistent weekly routine/schedule blocks

Key fields:

- `userId`
- `dayOfWeek`
- `startTime`
- `endTime`
- `type`
- `label`

### AiUsageLog

Purpose:

- track AI calls and quota usage

Key fields:

- `userId`
- `goalId`
- `actionType`
- `model`
- `inputTokens`
- `outputTokens`
- `estimatedCost`
- `success`
- `errorMessage`

### Notification

Purpose:

- user-specific in-app notification storage

Key fields:

- `userId`
- `title`
- `body`
- `type`
- `status`
- `dedupeKey`
- `metadata`
- `readAt`

### Referral

Purpose:

- placeholder foundation for referral/growth flows

### AdminAuditLog

Purpose:

- placeholder foundation for admin audit activity

## Important Relationships

```text
User -> Goal -> Task
User -> Goal -> Plan -> Milestone
Plan -> Task
Milestone -> Task
Task -> TaskProgressLog
User -> AvailabilitySlot
User -> PaymentTransaction
User -> Notification
User -> UserDevice
User -> AiUsageLog
```

## targetDate vs projectedDate

### targetDate

- user-intended deadline

### projectedDate

- backend-calculated expected completion date
- moves based on actual workload completion vs planned workload

The client does not own `projectedDate`.

## Payment and Notification Data

Payments:

- `PaymentTransaction` is the operational payment record
- `Subscription` stores the granted subscription state
- `User.subscriptionPlan` is the current plan shortcut used in auth/app logic

Notifications:

- `Notification` stores user-visible items
- `UserDevice` stores push targets
- real push confirmation/receipt processing is still limited

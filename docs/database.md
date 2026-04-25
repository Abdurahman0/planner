# Database

## Current Status

Database foundation is in place.

Current real state:

- PostgreSQL database used through Prisma
- schema aligned with shared domain types
- migration executed
- seed executed successfully
- payment transaction model added and migrated

Seed currently creates:

- a user
- an AI goal
- a current plan
- seeded tasks
- seeded availability slots

## Core Models

### User

Fields include:

- `id`
- `email`
- `passwordHash`
- `subscriptionPlan`
- timestamps

Relations:

- goals
- subscriptions
- payment transactions
- availability slots
- task progress logs
- AI usage logs
- notifications
- devices

### Goal

Fields include:

- `type`
- `priority`
- `status`
- `targetDate`
- `projectedDate`
- `isCompleted`

Relations:

- user
- plans
- tasks
- AI usage logs

### Plan

Fields include:

- `goalId`
- `version`
- `isCurrent`
- `createdAt`

Relations:

- goal
- milestones
- tasks

### Milestone

Fields include:

- `planId`
- `title`
- `description`
- `order`
- optional `targetDate`

Relations:

- plan
- tasks

### Task

Fields include:

- `goalId`
- optional `planId`
- optional `milestoneId`
- `title`
- `description`
- `status`
- `type`
- `plannedDate`
- optional `startTime`
- optional `endTime`
- optional `estimatedMinutes`
- optional `targetValue`
- optional `completedValue`
- optional `targetUnit`
- `source`
- `order`

Relations:

- goal
- optional plan
- optional milestone
- progress logs

### TaskProgressLog

Fields include:

- `userId`
- `taskId`
- `status`
- optional `completionPercent`
- optional `completedValue`
- optional `note`
- `loggedAt`

Current usage:

- written on every task status update
- used by backend deadline recalculation

### AvailabilitySlot

Fields include:

- `userId`
- `dayOfWeek`
- `startTime`
- `endTime`
- `type`

This is the persistent foundation for planner availability.

### PaymentTransaction

Fields include:

- `userId`
- `planType`
- `provider`
- `status`
- `amountMinor`
- `currency`
- `localReference`
- optional `externalId`
- optional `providerPayload`
- optional `errorMessage`
- `webhookAttempts`
- `initiatedAt`
- optional `paidAt`
- optional `processedAt`
- optional `cancelledAt`
- optional `expiresAt`
- optional `lastWebhookAt`

Purpose:

- stores every initiated payment attempt
- gives the backend an idempotency anchor for repeated webhooks
- keeps provider transaction state separate from frontend state

## Supporting Models

- `Subscription`
- `UserDevice`
- `AiUsageLog`
- `Notification`
- `Referral`
- `AdminAuditLog`

Live usage today:

- `Subscription` is updated when verified payment webhooks succeed
- `PaymentTransaction` is used in live payment flows

Other supporting models above are mostly not used in live product flows yet.

## Key Date Semantics

### targetDate

- the user's intended goal deadline

### projectedDate

- the system's calculated expected completion date
- moves based on actual progress vs planned workload

Current note:

- the field exists
- deadline movement logic is implemented in backend task status flows

## Important Relations

```text
User -> Goal -> Plan -> Milestone
User -> Goal -> Task
Plan -> Task
Milestone -> Task
Task -> TaskProgressLog
User -> PaymentTransaction
User -> AvailabilitySlot
User -> AiUsageLog
User -> Notification
```

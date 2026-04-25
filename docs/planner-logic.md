# Planner Logic

## Product Meaning

The planner is intended to be a scheduling system, not only a task list.

It must eventually support:

- month view
- week view
- day view with hours
- scheduled tasks
- unscheduled tasks
- user availability
- progress-aware deadline movement

## Domain Concepts Already Present

Current schema/shared foundation already supports:

- task type: `time_based` or `unit_based`
- scheduled task fields: `startTime`, `endTime`
- estimated task duration: `estimatedMinutes`
- unit-based targets: `targetValue`, `targetUnit`
- completed value tracking
- availability slots
- plan and milestone structure

## Scheduled vs Unscheduled Tasks

### Scheduled

Task has:

- `plannedDate`
- `startTime`
- optional `endTime`

### Unscheduled

Task has:

- `plannedDate`
- no time slot assigned yet

## Task Types

### Time-Based Tasks

Use:

- `estimatedMinutes`
- optional scheduled time range

### Unit-Based Tasks

Use:

- `targetValue`
- `targetUnit`
- optional `completedValue`

## Intended Planner Behavior

Eventually the backend should support:

- creating tasks under goals
- assigning tasks to dates
- assigning optional time slots
- recording partial and full progress
- moving projected goal deadline based on real progress

## Current Status

Planner logic is partially implemented in backend flows.

Current real state:

- schema supports planner-relevant fields
- frontend has planner UI prototypes
- backend now exposes task creation/list/get/update/status APIs
- backend validates task ownership and goal ownership
- backend writes `TaskProgressLog` on each task status update request
- backend recalculates `Goal.projectedDate` on each task status update

## Current Implemented Backend Task Behavior

- `POST /tasks` creates a task under an owned goal
- `GET /tasks` lists owned tasks and supports `goalId` filtering
- `GET /tasks/:id` returns only owned tasks
- `PATCH /tasks/:id` updates non-status task fields only
- `PATCH /tasks/:id/status` updates status and writes a progress log
- `PATCH /tasks/:id/status` also recalculates the parent goal's `projectedDate`

Current validation rules:

- `startTime` and `endTime` must be supplied together
- `endTime` must be later than `startTime`
- `unit_based` tasks require `targetValue` and `targetUnit`
- `completedValue` is only accepted on status updates for `unit_based` tasks

## Still Pending

- planner-specific scheduling conflict logic
- calendar/availability APIs

## Projected Deadline Logic

Current backend logic is deterministic and workload-based.

Inputs:

- `Goal.targetDate`
- all tasks under the goal
- all `TaskProgressLog` records for those tasks

Workload rules:

- `time_based` expected workload = `estimatedMinutes`
- `unit_based` expected workload = `targetValue`
- `time_based` completed workload = best logged `completionPercent`
- `unit_based` completed workload = best logged `completedValue`
- `done` tasks count as fully completed

Schedule rules:

- tasks with `plannedDate` on or before now count as due workload
- completed workload is compared against due workload
- behind schedule extends `projectedDate`
- ahead of schedule shrinks `projectedDate`
- fully completed workload sets `projectedDate` to the current time

Security rules:

- `projectedDate` is not client-writeable
- only backend status/progress flow updates it
- ownership checks happen before task progress updates are accepted

## Important Rule

Planner logic belongs to backend domain logic.

It must not be delegated to:

- frontend local state
- AI output alone

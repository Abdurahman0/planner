# Planner Logic

## Status

The planner scheduling layer exists and is functional.

This is no longer just goals plus a task list.

## Availability API

Implemented endpoints:

- `POST /availability`
- `GET /availability`
- `PATCH /availability/:id`
- `DELETE /availability/:id`

Supported block types:

- `sleep`
- `eating`
- `work`
- `study`
- `available`
- `blocked`
- `custom`

Each block supports:

- `dayOfWeek`
- `startTime`
- `endTime`
- `type`
- optional `label`

## Scheduled vs Unscheduled Tasks

### Scheduled

Task has:

- `plannedDate`
- `startTime`
- `endTime`

### Unscheduled

Task has:

- `plannedDate`
- no `startTime`
- no `endTime`

Unscheduled tasks stay visible in their own section until scheduled.

## Day / Week / Month Behavior

### Day View

Implemented:

- hourly timeline
- routine blocks rendered by time
- scheduled tasks rendered by duration
- tap hour to add task
- `Plan Day` sheet
- quick task defaults from tapped hour
- unscheduled tasks section

### Week View

Implemented:

- seven-day summary
- schedule density
- scheduled/unscheduled counts
- task status indicators

### Month View

Implemented:

- month grid
- task counts
- goal indicators
- completed/failed markers

## Deadline Projection Logic

Implemented:

- expected workload from task definitions
- completed workload from `TaskProgressLog`
- due workload from planned schedule
- dynamic `projectedDate`

Rules:

- behind schedule extends the deadline
- ahead of schedule can shrink the deadline
- `projectedDate` is backend-controlled only

## Current UX State

The planner is usable as a scheduling surface.

Strong areas:

- daily planning by hour
- routine block visibility
- quick add workflow
- scheduled vs unscheduled distinction

Still weak:

- no drag-and-drop
- no resize by duration
- overlap handling is still limited
- task rescheduling UX can still be improved
- AI does not yet fully generate against saved availability

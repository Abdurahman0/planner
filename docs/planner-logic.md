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
- full 00:00-24:00 range
- reachable `00:00` start and `24:00` end marker
- consistent hour row heights
- default auto-scroll:
  - today opens near the current hour
  - other days open near `06:00`
- explicit end-of-day marker
- routine blocks rendered by time
- scheduled tasks rendered by duration
- tap hour to add task
- `Plan Day` sheet
- quick task defaults from tapped hour
- unscheduled tasks section
- floating planner action positioned above tab bar/system navigation
- planner bottom spacing trimmed to the minimum needed to keep `24:00`, unscheduled tasks, and floating actions visible

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
- Android-safe modal actions for planner sheets

Still weak:

- no drag-and-drop
- no resize by duration
- overlap handling is still limited
- task rescheduling UX can still be improved
- AI does not yet fully generate against saved availability
- cross-midnight schedule blocks are not supported as one block:
  - users must split them, for example `23:00-24:00` and `00:00-07:00`
- planner overlap handling is still intentionally simple; there is no drag/drop or resize yet

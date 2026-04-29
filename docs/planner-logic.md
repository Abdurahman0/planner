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
- `startDate`
- `startTime`
- `endTime`
- `type`
- optional `label`
- `recurrenceType`
- optional `recurrenceDaysOfWeek`
- optional `recurrenceEndDate`

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
- optional `goalId`

Unscheduled tasks stay visible in their own section until scheduled.

Recurring tasks and routine blocks support:

- `none`
- `daily`
- `weekly`
- `monthly`
- `yearly`

Weekly recurrence can specify explicit weekdays.

Current series behavior:

- calendar views expand occurrences for the visible date range
- the app does not pre-create thousands of task rows for long-running series
- monthly/yearly recurrence clamps to the last valid calendar day when the exact day does not exist in a target month or year
- updating from the mobile planner currently updates the whole series
- single-occurrence edit/delete is not implemented yet

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
- standalone tasks render in the same day/week/month views because ownership is task-level, not goal-only
- recurring task occurrences rendered inside the same day timeline
- recurring routine-block occurrences rendered inside the same day timeline
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
- recurring occurrences included in weekly summaries

### Month View

Implemented:

- month grid
- task counts
- goal indicators
- completed/failed markers
- recurring occurrences included in monthly counts/indicators

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
- recurring series now modeled and rendered across planner views

## Daily Task Notification Behavior

Implemented MVP:

- incomplete unscheduled tasks for today participate in reminder logic
- criteria:
  - `plannedDate = today`
  - `startTime = null`
  - `endTime = null`
  - `status != done`
- ordering:
  - oldest created task first
- notification body:
  - up to 3 task titles
  - then `+N more tasks` if more remain
- notification body tap opens Planner
- notification action uses supported Android/Expo action button text (`✓ Done`) rather than a custom circle animation
- the `✓ Done` action targets the first visible task in the reminder
- completing tasks changes the next notification refresh
- if no incomplete unscheduled tasks remain, the local daily-task reminder is cleared
- identical daily-task notifications are deduplicated so the backend does not push the same payload every sweep

Current platform limitation:

- true Android non-dismissible ongoing notifications are not claimed in the current Expo/EAS setup
- current behavior is a safe Expo-compatible MVP:
  - backend sweep can re-send the reminder while incomplete tasks remain
  - unchanged reminder content is throttled by cooldown/dedupe instead of being sent every sweep
  - the app can mirror/update a local reminder while it is open and synced
  - if the user swipes it away, it may return on the next sync/sweep
  - if the app was fully killed, the `✓ Done` action completes safely once the app resumes from the notification action

Still weak:

- no drag-and-drop
- no resize by duration
- overlap handling is still limited
- task rescheduling UX can still be improved
- AI does not yet fully generate against saved availability
- cross-midnight schedule blocks are not supported as one block:
  - users must split them, for example `23:00-24:00` and `00:00-07:00`
- planner overlap handling is still intentionally simple; there is no drag/drop or resize yet

# Planner Logic

## Product model

- goals define direction
- tasks define work
- Planner places work into a day
- progress is derived from task completion

## Task priority

Priority order:

- high
- medium
- low

Effective priority:

- task override if present
- otherwise goal priority
- otherwise medium

## Scheduled vs unscheduled

### Scheduled task

- has `plannedDate`
- has `startTime`
- has `endTime`

### Unscheduled task

- has `plannedDate`
- no `startTime`
- no `endTime`
- can still be goal-linked or standalone

## Planner behavior

### Dashboard

- not a planning surface
- instruction only
- shows one `Next Action`
- pushes user into Planner through `Plan Today`
- does not show secondary task lists or reporting sections

### Next Action engine

`getNextAction(tasks, date, now)` works like this:

1. take today’s incomplete tasks
2. choose the nearest upcoming scheduled task after the current time
3. if multiple tasks share that time:
   - higher priority first
   - then `createdAt`
4. if no future scheduled task remains today:
   - choose the first unscheduled task
   - order by priority, then `createdAt`
5. if no unscheduled task exists:
   - fall back to the remaining incomplete scheduled task list

Planner handoff:

- goal-linked task -> Goal detail
- standalone task -> Planner route params with task id + date
- Planner switches to day view
- scheduled task focus scrolls once near the task time block
- unscheduled task focus scrolls once into the unscheduled section
- focused task gets a temporary subtle highlight
- focus scroll is consumed once per `focusNonce` and does not trap later scrolling

### Planner day view

- central planning screen
- scheduled tasks still render on the timeline
- unscheduled tasks still render below the timeline
- scheduled task chips stay inside each timeline card
- status / priority / recurrence chips wrap within the card when space is tight
- overlapping scheduled tasks use a simple offset layout instead of direct overlap
- recurring tasks and recurring blocks expand into the day view

### Week / month

- week and month still show recurring occurrences
- month still reflects priority indirectly through task indicators and counts

## Recurrence

Supported:

- none
- daily
- weekly
- monthly
- yearly

Rules:

- visible/query range expansion only
- no large up-front row generation
- end-of-month and leap-year clamping still applied
- single-occurrence edit/delete is still not implemented

## Daily-task reminder ordering

Daily unscheduled reminder candidates are:

- `plannedDate = today`
- no `startTime`
- no `endTime`
- `status != done`

Sort order:

1. effective priority desc
2. createdAt asc

Visible output:

- one notification
- up to 3 tasks
- `+N more tasks` if needed

## Notification priority behavior

### High

- strongest reminder channel
- stronger reminder copy
- allowed to re-alert while task remains incomplete

### Medium

- standard reminder channel
- standard copy

### Low

- softer reminder channel
- softer copy

## Android limit

This is not a full alarm implementation.

Not implemented:

- full-screen alarms
- guaranteed wake-from-killed-state alarm behavior
- true non-dismissible ongoing alarm UX

## Progress analytics

- Progress uses simple client-side calculations from already fetched user-scoped goals and tasks
- weekly completion is based on completed tasks in the last 7 days
- priority breakdown is based on effective priority and current task status
- goal progress detail is derived from the goal-linked task set

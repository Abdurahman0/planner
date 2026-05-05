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

`getNextAction(tasks)` works like this:

1. take today’s incomplete tasks
2. sort by effective priority desc
3. then scheduled time asc
4. then `createdAt` asc
5. return the first task

Planner handoff:

- `Start Now` sends task id + date into Planner route params
- Planner switches to day view
- scheduled task focus scrolls near the task time block
- unscheduled task focus scrolls into the unscheduled section
- focused task gets a temporary subtle highlight

### Planner day view

- central planning screen
- scheduled tasks sorted by priority, then time, then creation order
- unscheduled tasks sorted by effective priority, then creation time
- recurring tasks and recurring blocks expand into the day view

### Week / month

- week and month still show recurring occurrences
- month now reflects priority indirectly through task indicators and counts

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

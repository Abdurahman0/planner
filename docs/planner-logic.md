# Planner Logic

## Scheduled vs Unscheduled Tasks

Scheduled task:

- `plannedDate`
- `startTime`
- `endTime`

Unscheduled task:

- `plannedDate`
- no `startTime`
- no `endTime`
- optional `goalId`

Unscheduled tasks remain visible until completed or scheduled.

## Recurrence

Tasks and routine blocks support:

- `none`
- `daily`
- `weekly`
- `monthly`
- `yearly`

Rules:

- backend/shared logic expands occurrences for visible ranges
- the app does not pre-create large numbers of physical rows
- weekly recurrence can specify weekdays
- monthly/yearly recurrence clamps to the last valid calendar day when needed
- mobile editing currently updates the whole series
- single-occurrence edit/delete is not implemented

## Day / Week / Month

### Day View

- full 00:00-24:00 timeline
- current-hour auto-scroll for today
- recurring occurrences render in the timeline
- standalone tasks render normally
- unscheduled tasks render below the timeline

### Week View

- recurring occurrences included in weekly summaries

### Month View

- recurring occurrences included in month counts and indicators

## Daily-task notification logic

Daily-task reminder eligibility:

- `plannedDate = today`
- `startTime = null`
- `endTime = null`
- `status != done`

Ordering:

- oldest created task first

Visible Android reminder:

- one notification per user/day
- up to 3 task rows
- each row shows an empty circle plus task title
- if more remain: `+N more tasks`

Interaction:

- body tap opens Planner
- circle tap targets that exact task row
- circle tap immediately replaces that row icon with a checked state while backend completion is pending
- completion removes that task from the next notification state
- if no tasks remain, the notification is cancelled

Implementation path:

- backend generates one logical daily-task reminder state
- backend sends a headless data-only Expo push for Android daily-task sync
- mobile background JS asks the Android local Expo module to show/update the native custom notification
- visible daily-task UI is not a standard Expo notification alert

Limitations:

- Android custom notification layout uses `RemoteViews`
- Android 12+ can decorate custom notifications
- if the app process is killed and authenticated JS cannot run, circle taps may queue until the next authenticated resume
- true non-dismissible ongoing notification behavior is not implemented

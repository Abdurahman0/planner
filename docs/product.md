# Product

## Core flow

The app now follows one simple loop:

1. create a goal or task
2. place it into a day from Planner
3. get reminded based on priority
4. mark work done
5. progress updates automatically

Planner is the execution surface. Goals define direction. Dashboard tells the user what to do now. Progress is read-only stats. Profile is account only.

## Page purpose

### Dashboard

- zero-thinking today screen
- one dominant `Next Action`
- one main CTA: `Plan Today`
- one secondary action: `View all today tasks`
- no task lists, analytics, charts, streaks, or competing cards

### Goals

- list goals
- show goal priority clearly
- show target vs projected date
- create/edit goals
- goal detail shows task list and goal progress
- goal detail does not duplicate the full task-planning flow

### Planner

- main planning and execution screen
- day view first
- scheduled tasks on timeline
- unscheduled tasks below timeline
- recurring blocks and recurring tasks supported
- one main CTA in day view: `Plan Day`
- advanced recurrence and task options live under `More options`

### Progress

- simple stats only
- no planning controls
- no duplicate CTA

### Profile

- account and settings only
- no debug/dev panels
- no raw backend notification feed

## Priority behavior

Priority is now functional.

### Goal priority

- goals use `low`, `medium`, `high`
- tasks under a goal inherit goal priority unless the task overrides it

### Task priority

- standalone tasks can set their own priority
- goal-linked tasks can:
  - inherit from goal
  - override with low / medium / high

### High priority

- strongest reminder behavior available in the current Expo/Android setup
- Android channel: `planner-high-priority`
- stronger sound / vibration
- reminder copy uses stronger language:
  - `High priority task now`
- high priority only dominates `Next Action` as a tie-breaker for same-time scheduled work and for unscheduled fallback
- high-priority unscheduled tasks sort first in the daily-task notification
- high-priority tasks are visually marked in Planner

### Medium priority

- Android channel: `planner-reminders`
- normal reminder behavior
- reminder copy:
  - `Task time`

### Low priority

- Android channel: `planner-low-priority`
- softer reminder behavior
- lower visual emphasis
- reminder copy:
  - `Low priority task`

## Android limitation

This is not a true alarm-clock implementation.

Not implemented:

- native `AlarmManager` wakeup alarms
- full-screen alarm intents
- guaranteed repeating alarm behavior outside the existing backend sweep / Expo push model

Current high-priority behavior is the strongest safe Expo/EAS-compatible reminder path, not a full alarm app.

## Notifications

### Standard reminders

- scheduled reminders
- missed-task alerts
- progress feedback
- streak rewards

### Daily tasks

- still one Android custom notification per user/day
- up to 3 tasks shown
- sorted by effective priority first, then creation time
- circle tap targets the exact task row
- body tap opens Planner

## Next Action engine

Dashboard is now driven by one rule:

1. take today’s incomplete tasks
2. choose the nearest upcoming scheduled task after the current time
3. if multiple tasks share that time:
   - higher priority first
   - then `createdAt`
4. if no future scheduled task remains today:
   - choose the first unscheduled task
   - order unscheduled by priority, then `createdAt`
5. if neither exists:
   - fall back to remaining incomplete work for today

That result is the single dominant instruction on Dashboard.

Current routing behavior:

- goal-linked task -> `Start Now` opens Goal detail
- standalone task -> `Start Now` opens Planner with task focus
- Planner opens the correct day
- scheduled tasks scroll near their time block
- unscheduled tasks scroll into the `Unscheduled Tasks` section
- focused task receives a temporary subtle highlight

## Current limits

- recurring single-occurrence edit/delete is still not implemented
- true Android alarm/full-screen wake behavior is not implemented
- true non-dismissible ongoing notification behavior is not implemented
- final OEM-specific Android QA is still required

# Planner Logic

## Current Planner Status

The app currently has visual planner views:

- Month view: `apps/mobile/src/components/MonthView.tsx`
- Week view: `apps/mobile/src/components/WeekView.tsx`
- Day view: `apps/mobile/src/components/DayView.tsx`
- View switcher: `apps/mobile/src/components/PlannerHeader.tsx`
- Screen wrapper: `apps/mobile/app/(tabs)/calendar.tsx`

These views read tasks and availability from the local Zustand store.

## Calendar Views

### Month View

Current behavior:

- Renders days in the selected month.
- Shows a dot when tasks exist on a date.
- Uses a different dot color if any task for the day is AI-generated.
- Selecting a date switches to day view.

Limitations:

- Does not show task density beyond simple dots.
- Does not show overdue state.
- Does not show goal deadlines.
- Does not support schedule editing.

### Week View

Current behavior:

- Renders seven day sections.
- Lists tasks for each day.
- Shows task status color.

Limitations:

- This is a grouped task list, not a true weekly calendar grid.
- No hourly positioning.
- No duration rendering.
- No rescheduling.

### Day View

Current behavior:

- Renders hourly rows from 06:00 to 23:00.
- Splits tasks into scheduled and unscheduled.
- Scheduled tasks are detected by `task.startTime`.
- Availability blocks are shown from frontend mock availability.

Limitations:

- Only matches tasks by starting hour.
- Does not render task duration from start to end time.
- Does not support 00:00 through 05:00 except mock sleep availability is partly invisible.
- Does not support drag/drop, resize, or edit.
- Availability has no backend schema.
- Prisma `Task` does not include `startTime` or `endTime`.

## Scheduled vs Unscheduled Tasks

Current frontend concept:

- Scheduled task: has `startTime`.
- Unscheduled task: does not have `startTime`.

Required production behavior:

- Store scheduled start and end time in backend.
- Support timezone.
- Allow unscheduled backlog tasks.
- Allow moving unscheduled tasks into calendar slots.
- Prevent or warn on conflicts with unavailable blocks.

## Task Types

Current shared task types:

- `time_based`
- `unit_based`

Current task fields:

- Time estimate: `timeEstimateMinutes`
- Unit target: `unitTarget`
- Unit completed: `unitCompleted`
- Unit name: `unitName`

Current limitations:

- UI does not let users enter partial time or unit progress.
- Backend service only updates status.
- Progress logs do not capture time spent.

## Deadline Projection Logic

Intended behavior:

- Target date is the user's desired deadline.
- Projected date is the app/backend's current estimate based on actual completion behavior.
- Under-completion should extend projected deadline.
- Over-completion may shrink projected deadline.
- Plans remain fixed unless the user explicitly replans.

Current implementation:

- `packages/shared/src/deadlineCalculator.ts` has `calculateProjectedDate(originalTargetDate, tasks)`.
- It finds overdue `TODO` tasks.
- It adds one day per overdue task.
- It returns the original target date when no overdue tasks exist.

Current weaknesses:

- Does not consider planned workload size.
- Does not consider completed ahead of schedule.
- Does not consider partial progress.
- Does not consider failed tasks.
- Does not consider time estimates.
- Does not consider unit progress.
- Does not shrink projected deadlines.
- Uses current time directly, which makes testing harder.

## Partial Completion

Required behavior:

- User can record partial progress for unit-based and time-based tasks.
- Partial progress should reduce remaining workload.
- Partial progress should be stored in `TaskProgressLog`.

Current status:

- `TaskStatus.PARTIAL` exists in shared types and Prisma string comments.
- Some UI can display partial status.
- No UI action records partial completion.
- No backend API writes partial progress.

## Failed Tasks

Required behavior:

- User can mark a task failed.
- Failed tasks should affect projected deadline and analytics.
- User should be able to reschedule or replan after repeated failure.

Current status:

- `TaskStatus.FAILED` exists.
- Mock historical tasks can randomly be failed.
- UI can display failed status.
- No user action marks a task failed.
- Deadline projection does not handle failed tasks differently.

## Over-Completion

Required behavior:

- Completing more work than planned should be able to shrink projected deadline.
- Projection should compare actual throughput against planned workload.

Current status:

- Not implemented.

## Planner Verdict

The planner is a useful visual prototype, but it is not a real production planner yet. The day view is the strongest starting point because it has hourly rows and scheduled/unscheduled separation. The next implementation work should focus on a real scheduling model and task progress model before adding advanced calendar interactions.


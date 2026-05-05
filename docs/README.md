# AI Planner Docs

## Current product shape

AI Planner is now centered around one simpler flow:

1. create a goal or task
2. plan it in Planner
3. receive reminders based on priority
4. complete tasks
5. progress updates automatically

## Main surfaces

- Dashboard: today instruction only
- Goals: goal management and goal progress
- Planner: main planning and execution surface
- Progress: read-only stats
- Profile: account/settings only

## Important behavior

- task priority is now functional
- goal priority can be inherited by tasks
- Dashboard is driven by a single `Next Action`
- Dashboard no longer shows task lists or report sections
- Dashboard `Start Now` now hands off task focus into Planner day view
- scheduled reminders use priority-specific Android channels
- daily unscheduled task notification remains one notification per user/day
- daily-task ordering now uses priority first, then creation time

## Android reminder limits

Implemented:

- stronger high-priority reminder channel
- softer low-priority channel
- native Android custom daily-task notification

Not implemented:

- true alarm-clock wake behavior
- full-screen intent alarm UI
- true non-dismissible ongoing notification

## Build / deploy

Backend change in this pass requires:

- Render redeploy

Mobile change in this pass requires:

- fresh EAS Android build

## See also

- [frontend.md](./frontend.md)
- [backend.md](./backend.md)
- [product.md](./product.md)
- [planner-logic.md](./planner-logic.md)
- [roadmap.md](./roadmap.md)
- [coding-rules.md](./coding-rules.md)

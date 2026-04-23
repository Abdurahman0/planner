# Product Definition

AI Planner is a mobile-first planner for users who want to create goals, break them into executable tasks, track progress, view work on a real calendar, and use AI only when generating or replanning structured plans.

The product should feel closer to a planner, calendar, dashboard, and analytics app than a generic todo list.

## User Types

### Free Users

Intended behavior:

- Can create unlimited manual goals.
- Can create unlimited manual tasks.
- Cannot create AI-managed goals.
- Can still use calendar, task completion, and progress tracking.

Current codebase reality:

- There is no real auth or user account system.
- The frontend mock user in `apps/mobile/src/store/useStore.ts` is hardcoded as `AI_BASIC`.
- Free-user behavior is only represented through local conditionals in the create goal screen.

### Premium Users

Intended behavior:

- Can create manual goals and manual tasks.
- Can create up to 3 AI-managed goals.
- Can explicitly request AI plan generation.
- Can explicitly request AI replanning.

Current codebase reality:

- The create goal screen locally checks whether the user is premium and has fewer than 3 AI-managed goals.
- No payment provider exists.
- No server-side subscription enforcement is exposed through usable controllers.
- Backend limit logic exists partly in `GoalsService`, but it is not reachable through a controller.

## Goal System

### Manual Goals

Intended behavior:

- User creates the goal.
- User manually creates and manages tasks.
- No AI is involved.
- Deadline projection should still update based on completion behavior.

Current implementation:

- Manual goal creation exists locally in the frontend.
- Created goals are added only to Zustand memory.
- No task creation screen exists for manual goals.
- Manual goals are not persisted.

### AI-Managed Goals

Intended behavior:

- Premium user creates a goal and provides planning context.
- AI returns structured plan output, not chat text.
- The generated plan becomes fixed until the user explicitly replans.
- If the user edits AI-generated tasks, the app should warn that consistency may be broken and recommend replanning.

Current implementation:

- UI exists for selecting `AI Managed` during goal creation.
- AI planning context fields exist visually: available time, difficulty, and notes.
- Pressing `Generate AI Plan` does not call AI.
- The frontend only creates a goal object locally.
- Backend `AiService.generatePlan()` returns empty tasks and milestones.
- No task edit warning exists.
- No plan consistency or plan versioning flow exists in application behavior.

## Core Flows

### Create Goal

Intended flow:

1. User chooses manual or AI-managed.
2. User enters title, description, target date, and priority.
3. Manual goals are saved directly.
4. AI-managed goals call the backend, enforce premium limits, generate a plan, create tasks, and save a plan version.

Current status:

- Implemented as a local frontend form using React Hook Form and Zod.
- Uses local Zustand `addGoal`.
- Does not call a backend.
- Does not create tasks for the new goal.
- Does not create a plan record.

### Plan Generation

Intended flow:

1. Frontend sends structured goal, schedule, constraints, and target date to backend.
2. Backend checks subscription and AI quota.
3. Backend calls AI provider.
4. Backend validates structured JSON output.
5. Backend persists goal, plan, milestones, tasks, and AI usage log.

Current status:

- Placeholder only.
- Shared types define `AIPlanRequest` and `AIPlanResponse`.
- Backend AI service returns empty arrays.
- No persistence, validation, quota enforcement, or provider call exists.

### Task Execution

Intended flow:

1. User marks tasks done, partial, failed, or logs units/time.
2. Backend writes progress logs.
3. Backend recalculates goal progress and projected deadline.
4. UI reflects updated task state, analytics, and calendar.

Current status:

- Tapping a task only sets status to `DONE`.
- No partial completion entry exists.
- No failed-task action exists in UI.
- No progress log is written.
- Frontend task changes are not persisted.

### Replan

Intended flow:

1. User explicitly requests replanning on an AI-managed goal.
2. Backend sends current plan, completion history, and remaining workload to AI.
3. Backend creates a new plan version and tasks.
4. Old plan history remains available for audit and analytics.

Current status:

- Goal detail screen shows a `Request AI Replan` button for AI goals.
- The button has no behavior.
- Backend `AiService.replan()` returns empty arrays.
- No plan version transition is implemented.

## Differentiation

The app should be differentiated by:

- AI-generated structured plans, not AI chat.
- Real planner views: month, week, day with hours.
- Deadline projection based on actual completion behavior.
- Analytics that show whether the user is moving faster or slower than planned.
- Premium AI features that are bounded and cost-controlled.

Current code has early visual scaffolding for these ideas, but the production mechanics are mostly missing.


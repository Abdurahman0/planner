# Coding Rules

## Core Product Rules

- AI is only for initial plan generation and explicit replanning.
- Do not add AI chat.
- Do not make AI analyze every user action.
- Do not silently change a user's plan.
- Plans stay fixed unless the user explicitly replans.
- Deadline projection belongs to app/backend logic, not AI.
- Free users can have unlimited manual goals and manual tasks.
- Premium limits must be enforced by the backend.

## Architecture Rules

- Keep UI rendering separate from product business logic.
- Keep server data in API-backed flows, not long-lived mock Zustand state.
- Use React Query for backend data once APIs exist.
- Use Zustand only for local UI state if needed.
- Put deterministic shared logic in `packages/shared` only when both frontend and backend need it.
- Keep provider-specific AI code in the backend AI module, not shared package and not screens.
- Keep payment provider code in backend subscriptions/payments modules.

## Backend Rules

- Every mutating endpoint must require authenticated user context.
- Every user-owned resource must check ownership.
- Every request body must have DTO validation.
- Do not trust frontend premium checks.
- Do not use `any` for production request bodies.
- Use transactions when creating goals, plans, milestones, tasks, and AI usage logs together.
- Write progress logs for task completion, partial completion, and failure.
- Recalculate projected deadlines on the backend after progress changes.
- Log AI usage and provider failures.

## Frontend Rules

- Do not add new production features backed only by mock data.
- Do not put backend business rules only in screens.
- Do not use `Math.random()` IDs for persisted entities.
- All backend calls should go through a typed API layer.
- Screens should handle loading, empty, error, and disabled states.
- Task UI must support done, partial, failed, and unit/time progress before production.
- Calendar UI must distinguish scheduled and unscheduled tasks.

## Database Rules

- Prefer Prisma enums for stable domain statuses and types.
- Do not store important status values as unchecked strings.
- Keep shared TypeScript types and Prisma schema aligned.
- Add relations for entities that are queried together.
- Preserve plan history. Do not overwrite old AI plans when replanning.
- Track provider IDs and webhook events for subscriptions.
- Track device state for notifications.

## AI Rules

- AI output must be structured JSON.
- AI output must be validated before persistence.
- AI calls must be explicit user actions.
- AI calls must be quota-limited.
- AI calls must be logged.
- AI should return plans and tasks, not conversational advice.
- Replanning should create a new plan version.

## Documentation Rules

- Update `/docs` when product behavior, architecture, schema, or implementation order changes.
- Label features as current, mock/local, placeholder, or planned.
- Do not claim real auth, payment, AI, notification, or persistence behavior until code proves it.
- Keep docs implementation-oriented.

## What Not To Do

- Do not build a chat assistant.
- Do not wire frontend screens directly to insecure backend services.
- Do not ship frontend-only premium gating.
- Do not add more visual-only features before persistence and progress flows are real.
- Do not rewrite the entire UI before stabilizing backend contracts.
- Do not let AI own deterministic planner logic.


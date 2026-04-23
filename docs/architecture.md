# Architecture

## Current System Shape

The repo is organized like a monorepo:

- `apps/mobile`: Expo Router style React Native app files and mobile UI components.
- `apps/backend`: NestJS module scaffold and Prisma schema.
- `packages/shared`: Shared TypeScript enums, interfaces, and deadline calculation helper.
- `src`: Root Vite preview app that imports mobile screens and mocks Expo Router behavior.

The current runnable preview is the root Vite app. It renders a phone-frame web preview through `src/App.tsx`, maps tab routes manually, and aliases `react-native` to `react-native-web` in `vite.config.ts`.

## Current Data Flow

Current frontend flow:

1. Screens read from `apps/mobile/src/store/useStore.ts`.
2. `useStore` initializes hardcoded mock user, goals, tasks, and availability.
3. UI actions mutate Zustand memory.
4. No state is persisted to storage.
5. No frontend screen calls the backend.

Current backend flow:

1. `AppModule` imports auth, users, goals, tasks, AI, and subscriptions modules.
2. `AiController` exposes `POST /ai/generate-plan` and `POST /ai/replan`.
3. `AiService` returns empty plan output.
4. `GoalsService` and `TasksService` contain some Prisma logic but have no controllers.
5. There is no backend `main.ts`, so the NestJS app is not currently bootstrapped as a running server.

## Target Responsibility Split

### Frontend Responsibilities

- Render mobile planner, dashboard, goals, calendar, analytics, and profile UI.
- Collect user input with client-side validation for good UX.
- Call backend APIs through a typed API layer.
- Cache server state with React Query.
- Keep local UI-only state local: selected calendar date, active tab, modal visibility.
- Never enforce premium or AI quota as the only source of truth.

### Backend Responsibilities

- Own users, auth, sessions, devices, subscriptions, goals, plans, tasks, progress logs, notifications, and AI usage.
- Enforce premium limits and AI quotas.
- Persist plan versions and task changes.
- Recalculate projected deadlines from progress data.
- Validate all request DTOs.
- Expose APIs consumed by mobile.
- Integrate with payment, notification, and AI providers.

### Shared Package Responsibilities

- Define stable domain enums and interfaces shared by frontend and backend.
- Hold deterministic business logic that must match across clients and server.
- Keep AI provider code out of shared package.

Current warning: shared types and Prisma schema already diverge. For example, frontend `Task` supports `startTime` and `endTime`, but Prisma `Task` does not.

## AI Boundary

AI must be isolated to:

- Initial plan generation.
- Explicit manual replanning.

AI must not:

- Act as a chat assistant.
- Analyze every user action.
- Own deadline projection.
- Silently rewrite plans.
- Replace deterministic app/backend logic.

## Major Modules

Current modules:

- Mobile screens: dashboard, goals, create goal, goal detail, calendar, progress, profile.
- Mobile components: goal cards, task items, planner header, month/week/day views, chart widgets.
- Store: single Zustand store with mock data.
- Backend modules: auth, users, goals, tasks, AI, subscriptions.
- Database schema: Prisma models for users, goals, plans, tasks, progress logs, subscriptions, notifications, referrals, devices, and audit logs.

Required modules not yet implemented as usable product flows:

- Real auth/session module.
- Real API controllers for goals, tasks, plans, progress, users, subscriptions, notifications, and devices.
- Real AI provider adapter.
- Real payment adapter.
- Real notification dispatcher.


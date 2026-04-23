# Frontend

## Current Folder Structure

Important frontend areas:

- `apps/mobile/app/_layout.tsx`: Expo Router root layout with React Query and dark theme setup.
- `apps/mobile/app/(tabs)/_layout.tsx`: Expo Router tab layout.
- `apps/mobile/app/(tabs)/index.tsx`: Dashboard screen.
- `apps/mobile/app/(tabs)/goals.tsx`: Goals list screen.
- `apps/mobile/app/(tabs)/calendar.tsx`: Planner screen.
- `apps/mobile/app/(tabs)/progress.tsx`: Analytics screen.
- `apps/mobile/app/(tabs)/profile.tsx`: Profile screen.
- `apps/mobile/app/goals/create.tsx`: Create goal form.
- `apps/mobile/app/goals/[id].tsx`: Goal detail screen.
- `apps/mobile/src/components`: Reusable mobile UI components.
- `apps/mobile/src/components/charts`: Recharts-based analytics widgets.
- `apps/mobile/src/store/useStore.ts`: Global mock Zustand state.
- `src/App.tsx`: Root Vite preview shell and mocked navigation renderer.
- `src/mocks/expo-router.ts`: Mock Expo Router hooks for the Vite preview.
- `src/mocks/datetimepicker.tsx`: Mock date picker for web preview.

## Navigation

The codebase has two navigation concepts:

- Expo Router route files under `apps/mobile/app`.
- A Vite preview shim in `src/App.tsx` that manually chooses screens based on a Zustand navigation path.

Current status:

- Tab screens are visually reachable in the Vite preview.
- `router.push('/goals/create')` works through the mock router.
- Goal detail routing is fragile in the Vite preview because `useLocalSearchParams()` in `src/mocks/expo-router.ts` always returns `{}`.
- Native Expo navigation is not verified by the current root build. The passing build is Vite web, not a native Expo build.

## Main Screens

### Dashboard

Current implementation:

- Shows today's date.
- Shows `ProgressWidget`.
- Shows a completion line chart.
- Shows today's tasks filtered from mock tasks.
- Shows active goals.

Limitations:

- Uses mock data.
- Task toggles only mark tasks as done.
- `ProgressWidget` uses hardcoded completion rate and streak.

### Goals

Current implementation:

- Lists goals from Zustand.
- Opens create goal screen.
- Uses `GoalCard` for each goal.

Limitations:

- Goals are local only.
- Goal detail route is unreliable in Vite because route params are mocked as empty.

### Create Goal

Current implementation:

- React Hook Form and Zod validation.
- Manual vs AI-managed selector.
- Target date selector using a mocked date picker on Vite.
- Priority selector.
- AI context fields when AI-managed is selected.
- Local premium gate and 3 AI-goal limit check.

Limitations:

- No backend call.
- No AI plan generation.
- No task generation.
- Uses `Math.random()` for local IDs.
- Created goals disappear on reload.

### Calendar

Current implementation:

- Has day, week, and month view switcher.
- Month view shows task indicators.
- Week view groups tasks by day.
- Day view shows hourly rows from 06:00 to 23:00 and scheduled vs unscheduled tasks.

Limitations:

- No real scheduling workflow.
- No drag/drop or edit schedule behavior.
- Availability is frontend-only mock data.
- Task durations are not rendered across time ranges.

### Progress

Current implementation:

- Shows current/best streak widget.
- Shows completion trend line chart.
- Shows goal trend line chart.
- Shows weekly activity line chart.
- Shows status breakdown pie chart.

Limitations:

- Charts use mock tasks.
- Streak values are hardcoded.
- Analytics are not backed by progress logs.

### Profile

Current implementation:

- Shows mock user email.
- Shows premium/free badge based on mock subscription plan.
- Shows upgrade card only for free users.
- Shows settings and sign-out rows visually.

Limitations:

- No account settings behavior.
- No sign-out behavior.
- No payment flow.
- No real session.

## State Management

Current state management:

- Zustand store in `apps/mobile/src/store/useStore.ts`.
- Initializes `MOCK_USER`, `MOCK_GOALS`, random generated historical tasks, current tasks, and mock availability.
- Provides setters and local mutations.

Current limitations:

- No persistence.
- No API layer.
- No React Query usage in screens despite provider setup.
- Random historical tasks change between reloads.
- Frontend state can diverge from backend schema.

## Component Reuse

Useful components to keep:

- `GoalCard`
- `TaskItem`
- `PlannerHeader`
- `MonthView`
- `WeekView`
- `DayView`
- Chart components as web-preview prototypes

Risks:

- Components mix product assumptions with rendering.
- Chart components use Recharts, which is appropriate for web preview but may not be appropriate for native mobile without a compatibility strategy.
- Styles are repeated across screens instead of using a shared design system.

## Mobile UX Quality

Current strengths:

- Mobile-first visual layout exists.
- Screens use scroll containers where needed.
- Bottom tab pattern is clear.
- Calendar view switcher is understandable.

Current weaknesses:

- Vite phone frame is not a real device validation.
- Some controls are visual-only.
- No loading, error, empty, offline, or optimistic update states for backend flows.
- Task completion is too limited for the product rules.
- No real onboarding, auth, notification permission, or payment UX exists.

## Frontend Rules Going Forward

- Keep UI-only state local.
- Move server data to typed API calls and React Query.
- Do not keep production goals/tasks in mock Zustand.
- Do not enforce premium only on the frontend.
- Keep business logic out of screen components when it affects persistence, quotas, AI, or deadline projection.
- Add explicit UI for done, partial, failed, and unit/time progress.


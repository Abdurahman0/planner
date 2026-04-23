# Roadmap

## Current Project Status

This project is currently a visual scaffold / partial MVP foundation.

Implemented:

- Vite web preview of mobile UI.
- Expo Router style file structure.
- Dashboard, goals, create goal, calendar, progress, and profile screens.
- Local mock Zustand store.
- Month, week, and day planner views.
- Recharts line and pie chart prototypes.
- Prisma schema with core entities.
- Thin NestJS module scaffold.
- Placeholder AI service.
- Shared domain types and a weak deadline calculator.

Not implemented:

- Real auth.
- Real backend bootstrap.
- Real frontend API layer.
- Real persistence from mobile screens.
- Real AI plan generation.
- Real AI replanning.
- Real payment integration.
- Real notifications.
- Real task progress logging.
- Real schedule/availability persistence.
- Real production deadline projection.

## MVP Scope

Minimum viable production path:

- Users can sign up and log in.
- Users can create manual goals and tasks.
- Users can complete, partially complete, or fail tasks.
- Goals and tasks persist in PostgreSQL.
- Dashboard, goals, calendar, and progress screens use real backend data.
- Projected deadlines update from backend logic.
- Premium user state is enforced server-side.
- AI-managed goal creation works for premium users.
- AI replanning is explicit and versioned.

## Future Scope

Post-MVP work:

- Advanced recurring tasks.
- Full calendar drag/drop.
- Rich notification scheduling.
- Referral program.
- Admin dashboard.
- Multi-device sync polish.
- Advanced analytics.
- Higher premium tiers.

## Recommended Implementation Order

1. Stabilize shared domain types and Prisma schema.
2. Build real backend bootstrap, auth, users, goals, and tasks APIs.
3. Replace Zustand mock data with API-backed React Query flows.
4. Implement task progress logs and projected deadline recalculation.
5. Implement real planner scheduling model.
6. Add AI plan generation and replan behind premium quota.
7. Add subscriptions and payments.
8. Add notifications.
9. Harden QA, native Expo build, analytics, monitoring, and release process.

## Immediate Technical Priorities

### 1. Domain and Schema Alignment

- Convert string status/type fields to enums.
- Add missing `priority` and `status` to Prisma `Goal`, or remove them from shared frontend types if not needed.
- Add scheduled task start/end fields.
- Add plan-to-task relation.
- Add user availability model.

### 2. Backend Foundation

- Add NestJS `main.ts`.
- Add controllers and DTOs.
- Add auth and guards.
- Add ownership checks.
- Add validation and structured errors.

### 3. Frontend Data Migration

- Create typed API client.
- Use React Query for server state.
- Keep Zustand only for UI state or remove it where unnecessary.
- Remove random mock task generation from production path.

### 4. Planner and Progress

- Add task progress write flow.
- Add partial and failed task UI.
- Recalculate projected deadlines on backend.
- Feed charts from persisted progress data.

### 5. AI Integration

- Implement structured prompt input.
- Validate structured AI output.
- Persist plan versions.
- Log usage.
- Enforce quota server-side.


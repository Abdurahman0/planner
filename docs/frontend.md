# Frontend

## Current State

The frontend is now connected to the real backend for auth, goals, and tasks.

Current characteristics:

- Zustand now holds authenticated session state and live API-backed goal/task data
- real API client is wired into the app
- auth uses backend `register`, `login`, and `users/me`
- goals use backend `GET /goals`, `POST /goals`, `GET /goals/:id`
- tasks use backend `GET /tasks`, `POST /tasks`, `PATCH /tasks/:id`, `PATCH /tasks/:id/status`
- JWT is attached to authenticated requests
- native token storage uses `expo-secure-store`
- web preview uses session storage fallback
- availability is currently empty because there is no availability API yet

## Main Screens

- dashboard
- goals list
- goal creation
- goal detail
- planner/calendar
- progress
- profile
- auth screen

## Current Data Model Usage

Frontend uses shared domain types and runtime data now comes from backend responses.

Examples:

- login/register store a real JWT-backed session
- goals are fetched from backend and normalized into shared types
- tasks are fetched from backend and normalized into shared types
- task status updates call backend and then refetch the parent goal
- goal detail shows backend-updated `projectedDate`
- charts read real fetched task arrays

## Implemented Frontend Integration

- auth bootstrap from stored token
- login/register screen
- secure JWT persistence
- logout flow
- automatic `Authorization: Bearer ...` handling
- 401 handling that clears local session
- goals list from backend
- goal creation via backend
- goal detail fetch via backend
- tasks list from backend
- task creation via backend
- task updates via backend
- task status updates via backend
- goal refetch after task status update to refresh `projectedDate`

## Known Limitations

- availability is not connected because there is no availability endpoint yet
- charts are real-data driven but still simple UI-level analytics
- no frontend integration for AI, payments, notifications, or planner-specific APIs yet
- the store still uses Zustand instead of a dedicated server-state cache layer

## Current Role of Frontend

Right now the frontend serves as:

- real auth/goals/tasks client
- planner/dashboard/progress UI
- web preview shell plus mobile app foundation

It is no longer a pure mock prototype, but it is still not a complete production client.

## Future Integration Plan

Strict order:

1. connect planner availability and scheduling APIs
2. connect AI plan generation/replan
3. connect payments
4. connect notifications
5. reduce remaining UI-only analytics shortcuts

## Rule

Backend must be treated as the source of truth.

Frontend must not own:

- auth truth
- premium truth
- goal ownership truth
- task persistence truth
- AI quota truth

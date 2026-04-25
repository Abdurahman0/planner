# AI Planner Docs

## Project Overview

AI Planner is a planner product with:

- manual goals and tasks
- premium AI-managed goals with strict limits
- future planner scheduling logic
- future analytics and AI plan generation/replan flows

Current maturity:

- backend foundation exists
- auth is real
- goals API is real
- tasks API is real
- TaskProgressLog writes are real
- deadline movement is real
- AI planning endpoints are real
- payment backend is real
- frontend is connected for auth/goals/tasks
- notifications are not implemented yet

## Current Real State

Implemented:

- Prisma schema alignment
- database migration
- database seed
- NestJS bootstrap
- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`
- JWT-protected Goals API
- JWT-protected Tasks API
- TaskProgressLog writes on `PATCH /tasks/:id/status`
- projected deadline movement logic
- `POST /ai/generate-plan`
- `POST /ai/replan`
- `POST /payments/initiate`
- `POST /payments/webhook`
- frontend auth/goals/tasks integration

Not implemented yet:

- notifications
- frontend AI integration
- frontend payments integration

## Quick Links

- [product.md](./product.md)
- [architecture.md](./architecture.md)
- [frontend.md](./frontend.md)
- [backend.md](./backend.md)
- [database.md](./database.md)
- [ai.md](./ai.md)
- [planner-logic.md](./planner-logic.md)
- [pricing.md](./pricing.md)
- [roadmap.md](./roadmap.md)
- [coding-rules.md](./coding-rules.md)

## Start Backend

Required env vars:

- `DATABASE_URL`
- `JWT_SECRET`
- optional `JWT_EXPIRES_IN`
- optional `BACKEND_PORT` default `3001`
- payment and AI env vars are required for those modules

Run:

```bash
npm run backend:dev
```

Health check:

```text
GET http://localhost:3001/health
```

Expected response:

```json
{ "status": "ok" }
```

## Test Auth

Register:

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"StrongPass123\"}"
```

Login:

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"StrongPass123\"}"
```

Current user:

```bash
curl http://localhost:3001/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Create manual goal:

```bash
curl -X POST http://localhost:3001/goals \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Launch MVP\",\"type\":\"manual\",\"targetDate\":\"2026-06-01T00:00:00.000Z\",\"priority\":\"high\"}"
```

Create task:

```bash
curl -X POST http://localhost:3001/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"goalId\":\"GOAL_UUID\",\"title\":\"Deep Work Block\",\"type\":\"time_based\",\"plannedDate\":\"2026-05-01T00:00:00.000Z\",\"startTime\":\"09:00\",\"endTime\":\"10:30\",\"estimatedMinutes\":90}"
```

Update task status:

```bash
curl -X PATCH http://localhost:3001/tasks/TASK_UUID/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"partial\",\"completionPercent\":40,\"completedValue\":4,\"note\":\"Progress update\"}"
```

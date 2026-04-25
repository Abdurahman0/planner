# Architecture

## System Overview

The project currently has three layers:

- frontend: React Native / Expo-style app rendered today through a Vite preview shell
- backend: NestJS API
- database: PostgreSQL via Prisma

## Main Components

### Frontend

Current frontend stack:

- `apps/mobile`
- Expo Router style structure
- Zustand session/data store
- planner/dashboard/progress/profile UI
- web preview shell in `src/App.tsx`
- backend API client for auth/goals/tasks

Current frontend limitation:

- availability/planner-specific backend APIs do not exist yet

### Backend

Current backend stack:

- NestJS
- `main.ts` bootstrap
- CORS enabled
- global `ValidationPipe`
- Prisma integration
- auth module
- users module
- goals module
- tasks module
- AI module
- payments module
- health module

### Database

Current database stack:

- PostgreSQL
- Prisma schema aligned with shared domain model
- migration executed
- seed executed successfully

## Data Flow

Current implemented backend flow:

```text
client -> NestJS API -> Prisma -> PostgreSQL
```

Current implemented frontend flow:

```text
mobile/web client -> auth/token store -> authenticated fetch client -> NestJS API -> Prisma -> PostgreSQL
```

Current implemented auth flow:

```text
register/login request -> DTO validation -> auth service -> Prisma -> bcrypt -> JWT response
```

Current implemented goals flow:

```text
authenticated user -> JWT guard -> goals controller -> goals service -> ownership/subscription checks -> Prisma -> PostgreSQL
```

Current implemented tasks flow:

```text
authenticated user -> JWT guard -> tasks controller -> tasks service -> goal/task ownership checks -> Prisma -> PostgreSQL
                                                |
                                                -> TaskProgressLog write on status updates
```

Target application flow:

```text
mobile app -> backend API -> database
                    |
                    -> future AI provider for plan generation/replan only
```

## App Logic vs AI Logic

### App / Backend Logic

Must own:

- users
- auth
- goals
- tasks
- planner scheduling
- progress logs
- deadline projection
- ownership rules
- subscription enforcement

### AI Logic

Must only handle:

- initial structured plan generation
- explicit structured replanning

Must not own:

- auth
- task completion logic
- deadline projection logic
- premium enforcement
- planner consistency rules

## Current Implementation Status

Implemented:

- database foundation
- backend bootstrap
- auth
- `/health`
- `/users/me`
- JWT-protected goals API with ownership checks
- JWT-protected tasks API with ownership checks
- TaskProgressLog writes on task status updates
- frontend auth integration
- frontend goals integration
- frontend tasks integration
- frontend goal detail refetch after task status updates
- premium AI-goal enforcement in backend

Not implemented yet:

- planner APIs
- notifications
- availability API integration
- frontend AI integration
- frontend payment integration

# Architecture

## System Architecture

```text
React Native / Expo app
        ->
NestJS backend API
        ->
Prisma
        ->
PostgreSQL / Neon
```

Supporting paths:

```text
Backend -> Gemini API
Backend -> Click / Payme
Backend -> Expo push service
Backend -> Render deployment target
```

## Responsibilities

### Frontend

Frontend acts as:

- controller/view layer
- authenticated API client
- planner UI
- mobile build target

Frontend must not own:

- auth truth
- premium truth
- ownership rules
- deadline logic
- AI quota truth

### Backend

Backend is the source of truth for:

- auth
- users
- goals
- tasks
- progress logs
- projected deadlines
- availability blocks
- AI quota enforcement
- payment confirmation
- notification generation

## Mobile Structure

Project structure is split, but Expo project root is the **repo root**:

- mobile routes: `apps/mobile/app`
- mobile source/components/store: `apps/mobile/src`
- Expo config: `app.config.ts` at repo root
- EAS config: `eas.json` at repo root

## Backend Structure

Key backend modules:

- auth
- users
- goals
- tasks
- availability
- ai
- payments
- notifications
- health

## Data Flow

### Standard App Flow

```text
user action -> mobile UI -> authenticated API request -> NestJS service -> Prisma -> PostgreSQL
```

### AI Flow

```text
user request -> backend AI endpoint -> provider call -> strict JSON validation -> backend persists goal/tasks
```

AI does not write to the database directly.

### Payment Flow

```text
user initiates payment -> backend creates payment transaction -> external provider -> webhook -> backend verifies -> subscription upgrade
```

Frontend payment success is not trusted.

### Notification Flow

```text
tasks/progress/deadline state -> backend retention logic -> Notification rows -> optional Expo push delivery
```

## Deployment Notes

- backend deployment example currently used in this repo: `https://planner-v79c.onrender.com`
- database target: Neon PostgreSQL
- APK/preview builds: EAS

## Current Implementation Status

Implemented:

- backend API foundation
- real mobile-to-backend integration
- planner scheduling layer
- AI backend
- payments backend
- notifications backend
- Android-safe-area fixes

Still incomplete:

- frontend AI flow
- frontend billing UI
- push production validation
- launch hardening

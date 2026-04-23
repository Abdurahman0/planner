# AI Planner Documentation

This folder is the project source of truth for product direction, architecture, development rules, and implementation priorities.

## Project Overview

AI Planner is intended to be a mobile-first planner app for goals, tasks, calendars, analytics, and structured AI-assisted planning.

Current codebase state:

- Visual mobile app preview exists through Vite, React Native Web, Expo-style routes, and mock navigation.
- Mobile screens exist for dashboard, goals, create goal, calendar, progress, and profile.
- State is currently local and mock-only through Zustand.
- Backend is a thin NestJS and Prisma scaffold, not a usable API application yet.
- AI, payments, auth, notifications, and production persistence are not implemented.

## What This App Is

- A planner and goal execution product in progress.
- A future React Native + Expo mobile app backed by NestJS, Prisma, and PostgreSQL.
- A product where AI should generate structured plans and explicit replans only.
- A product where app and backend logic, not AI, should track completion, schedule work, and move projected deadlines.

## What This App Is Not

- Not production-ready.
- Not a real persisted mobile app yet.
- Not a chat assistant.
- Not connected to a real backend from the frontend.
- Not connected to a real AI provider in app behavior.
- Not connected to real payments or push notifications.

## Documentation Map

- [product.md](./product.md): Product definition, user types, goal rules, and core flows.
- [architecture.md](./architecture.md): Current and target system architecture.
- [frontend.md](./frontend.md): Mobile app structure, screens, state, and frontend risks.
- [backend.md](./backend.md): Backend scaffold status and required backend modules.
- [database.md](./database.md): Prisma schema, current entities, relationships, and schema gaps.
- [ai.md](./ai.md): AI boundaries, current placeholder implementation, and future integration shape.
- [planner-logic.md](./planner-logic.md): Calendar, scheduling, task completion, and deadline projection rules.
- [pricing.md](./pricing.md): Free vs premium behavior and planned pricing.
- [roadmap.md](./roadmap.md): Current status and implementation order.
- [coding-rules.md](./coding-rules.md): Rules for safely extending the project.


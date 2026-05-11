# AI Planner - Architecture Documentation

## Overview
AI Planner is a production-oriented mobile-first AI Planner application. It distinguishes itself from generic todo apps by using AI specifically for structured goal planning and replanning, while the application logic handles progress tracking and deadline projections.

## Project Structure (Monorepo)
- `apps/mobile`: React Native (Expo) application.
- `apps/backend`: NestJS application with Prisma & PostgreSQL.
- `packages/shared`: Shared domain models, types, and business logic (e.g., deadline calculation).

## Key Architecture Choices

### 1. Domain-Driven Design (Shared Package)
Core business logic, such as the `calculateProjectedDate` function, resides in the `packages/shared` directory. This ensures that both the mobile app and the backend use the same logic for projecting deadlines, preventing inconsistencies.

### 2. AI Integration Strategy
- **Structured Output**: The AI (Gemini) is instructed to return structured JSON (defined in `AIPlanResponse`), not free-form text.
- **Explicit Triggers**: AI is only used for initial generation and manual replanning. This keeps the user in control and reduces token costs.
- **Warning System**: If a user manually edits an AI-generated task, the system flags the plan as potentially inconsistent.

### 3. Mobile-First UI
- **Dashboard-First**: The app opens to a dashboard showing immediate progress and active goals.
- **Card-Based Layout**: Uses a clean, premium card-based design system with dark mode support.
- **Progress Visualization**: Real-time progress bars and streak tracking to encourage consistency.

### 4. Backend Scalability
- **Modular NestJS**: Each domain (Goals, Tasks, AI, Subscriptions) has its own module.
- **Prisma ORM**: Provides type-safe database access and easy migrations.
- **Job Queues (Ready)**: The structure is prepared for Redis-based background jobs (e.g., for complex AI replanning or bulk notifications).

## Business Rules Implemented
- **AI Goal Limits**: Free users are restricted from AI goals; Premium users have a limit (e.g., 3 for Basic, 10 for Pro).
- **Deadline Projection**: The app automatically extends the `projectedDate` if tasks are overdue, providing a realistic view of completion.
- **Manual vs AI Goals**: Users can mix and match manual goals with AI-managed ones.

## Getting Started
1. **Backend**: 
   - `cd apps/backend`
   - `npx prisma generate`
   - `npm run dev`
2. **Mobile**:
   - `cd apps/mobile`
   - `npx expo start`

## Notes on Scaffolding
- **AI Service**: Currently uses a placeholder. Integration with `@google/genai` should be implemented in `AiService`.
- **Payments**: Abstraction exists in `SubscriptionsModule`, but actual provider (Stripe/RevenueCat) integration is pending.
- **Notifications**: Model exists, but push notification service (FCM/Expo) is not yet connected.

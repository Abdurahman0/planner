# Pricing

## Product Pricing Model

Intended product behavior:

- Free users can create unlimited manual goals.
- Free users can create unlimited manual tasks.
- Premium users can create AI-managed goals.
- Premium users are limited to 3 active AI-managed goals for the planned first premium tier.
- AI is used only for initial plan generation and explicit replanning.

## Planned Tiers

Planned pricing concepts:

- Free: manual planning, tasks, calendar, basic progress.
- Premium 49k: AI-managed goals up to the product limit, AI plan generation, explicit replanning.
- Premium 79k: possible higher tier for expanded limits, deeper analytics, or advanced scheduling later.

These prices are planned product direction, not implemented billing behavior.

## Current Implementation

Frontend:

- Mock user is `AI_BASIC` in `apps/mobile/src/store/useStore.ts`.
- Create goal screen treats any non-free user as premium.
- Create goal screen blocks AI-managed goal creation if there are already 3 AI-managed goals.
- Profile screen shows a premium badge based on mock user state.
- Upgrade card appears only if the mock user is free.

Backend:

- Prisma has `Subscription`.
- Prisma `User.subscriptionPlan` defaults to `free`.
- `SubscriptionsModule` is empty.
- `GoalsService` has partial AI goal limit logic.

Payment:

- No Stripe integration.
- No RevenueCat integration.
- No webhook endpoint.
- No entitlement sync.
- No checkout or in-app purchase flow.

## Known Logic Issue

`GoalsService.createGoal()` does not correctly block free users before creating an AI-managed goal. It sets a limit of 3 for non-pro users and only throws for free users when `aiGoalsCount >= limit`. A free user with fewer than 3 AI goals could pass this logic if the service were exposed.

Correct server rule:

- If user is free and requested goal type is AI-managed, reject immediately.
- If user is premium and active AI-managed goal count is at limit, reject.

## Required Before Payments

- Decide provider: RevenueCat for mobile subscriptions or Stripe for web-first billing.
- Define exact premium entitlements.
- Add subscription provider fields to schema.
- Add webhook event storage.
- Add backend entitlement resolver.
- Ensure frontend reads premium status from backend, not local mock state.

## Required Before Launch

- Server-side premium enforcement.
- Payment provider integration.
- Receipt or webhook validation.
- Clear upgrade UI.
- Clear downgrade/expired behavior.
- AI quota behavior when subscription expires.


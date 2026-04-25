# Pricing

## Product Rules

### Free Users

- unlimited manual goals
- unlimited manual tasks
- no AI-managed goals

### Premium Users

- unlimited manual goals
- unlimited manual tasks
- up to 3 AI-managed goals
- access to AI generation and explicit replan features

## Current Status

Pricing enforcement now has real backend payment support.

Current real state:

- subscription plan exists on `User`
- subscription models exist in schema
- `PaymentTransaction` now exists in schema
- auth returns `subscriptionPlan`
- backend goals API enforces free vs premium AI-goal creation rules
- `POST /payments/initiate` creates pending payment transactions
- `POST /payments/webhook` verifies provider callbacks and upgrades subscriptions
- frontend upgrade screen is not implemented yet

## What Exists Today

- schema support for `Subscription`
- schema support for `SubscriptionPlan`
- schema support for `PaymentTransaction`
- safe auth response includes `subscriptionPlan`
- backend AI-goal restriction logic in goals API
- backend AI usage checks now sit on top of real subscription upgrades
- backend payment providers:
  - Click
  - Payme

## Current Paid Plans

- `ai_basic`
  - `49,000 UZS` monthly
  - payment amount stored as `4,900,000` tiyin
- `ai_pro`
  - `79,000 UZS` monthly
  - payment amount stored as `7,900,000` tiyin

Current subscription duration logic:

- each successful payment adds `30` days
- subscription truth is written by verified webhook processing only

## What Does Not Exist Yet

- frontend billing UI
- refund handling
- notification flows around renewals or failed payments
- provider reconciliation/admin tooling

# Product

## Product Definition

AI Planner is a planner product, not a chat product.

Core concept:

- users create goals
- goals contain planned work
- tasks will later represent executable units of work
- planner views will represent scheduled and unscheduled work
- analytics will reflect actual progress
- AI will only generate or replan structured plans

## AI Rules

AI is:

- a structured planning tool
- used for initial plan generation
- used for explicit manual replanning

AI is not:

- a chat assistant
- a background autopilot
- the source of truth for deadlines
- the source of truth for business rules

## User Types

### Free

Rules:

- unlimited manual goals
- unlimited manual tasks
- cannot create AI-managed goals

Current implemented state:

- backend enforces free users cannot create AI-managed goals
- free users can create manual goals through `POST /goals`

### Premium

Rules:

- unlimited manual goals
- unlimited manual tasks
- can create AI-managed goals
- can have at most 3 active AI-managed goals

Current implemented state:

- backend goals API enforces max 3 active AI-managed goals
- backend payment integration exists
- premium upgrade is confirmed by payment webhook only

## Current Implemented Features

- backend user registration
- backend user login
- JWT authentication
- `GET /users/me`
- goals CRUD API
- tasks create/list/get/update API
- task status update API
- TaskProgressLog writes on status updates
- goal ownership checks
- task ownership checks
- backend premium AI-goal enforcement
- backend AI plan generation and replan APIs
- backend payment initiation and webhook confirmation
- backend notification generation and retention summary
- frontend notification display
- Expo push token registration
- aligned database and shared domain model

## Planned But Not Implemented

- planner scheduling logic API
- frontend AI generation and replan flows
- frontend payment flow
- planner availability API

## Retention System

Current implemented state:

- the backend generates user-specific retention notifications
- users can fetch notifications and a notification summary from authenticated endpoints
- the frontend displays notifications and unread state
- the frontend registers Expo push tokens on supported devices
- reminders are generated for tasks scheduled today
- missed-task alerts are generated for overdue incomplete tasks
- progress feedback is generated when projected deadlines move behind or ahead
- streak rewards are generated from real daily completion history

Current limitations:

- push delivery is integrated through Expo, but receipt handling is not implemented
- there is no notification preferences UI
- there is no dedicated growth/referral system yet

# AI

## Current Status

AI planning is now implemented behind explicit backend endpoints.

Implemented:

- `POST /ai/generate-plan`
- `POST /ai/replan`
- JWT protection
- premium-only access
- daily AI usage limits
- strict JSON schema enforcement
- `AiUsageLog` writes

Still not implemented:

- frontend AI integration
- payments-backed entitlement sync
- AI chat

## Product Rules

AI may only be used for:

- initial plan generation
- explicit manual replanning

AI must not be used for:

- chat
- automatic user coaching in every flow
- core planner logic
- auth
- deadline projection
- premium enforcement
- task ownership/security decisions

## Implemented Input Shape

### Generate Plan

`POST /ai/generate-plan`

Input:

- `title`
- optional `description`
- `targetDate`
- optional `priority`
- optional `availability[]`

Behavior:

- backend calls Gemini
- validates JSON response
- creates a new AI-managed goal
- creates AI-sourced tasks through `TasksService`

### Replan

`POST /ai/replan`

Input:

- `goalId`
- optional `currentProgress` note

Behavior:

- backend loads owned goal and its real task/progress data
- backend calls Gemini
- validates JSON response
- deletes incomplete AI-generated tasks for the goal
- creates replacement AI tasks through `TasksService`

## Output Shape

AI provider contract:

- tasks
- JSON only
- no explanations
- no markdown
- no extra keys

Task fields:

- `title`
- optional `description`
- `type`
- `plannedDate`
- optional `startTime`
- optional `endTime`
- optional `estimatedMinutes`
- optional `targetValue`
- optional `targetUnit`

No conversational free-form output should be used as the product contract.

## Usage Logging

The schema already includes `AiUsageLog` with fields for:

- user
- optional goal
- action type
- model
- token counts
- estimated cost
- success/failure
- error message

Current status:

- schema support exists
- real `AiUsageLog` writes are implemented

Logged fields:

- `userId`
- optional `goalId`
- `actionType`
- `model`
- token counts when returned by provider
- success/failure
- error message on failure

## Validation Rules

Backend validation is strict:

- AI output must be valid JSON
- AI output must match backend task schema
- tasks must be between 3 and 12 items
- `plannedDate` cannot be in the past
- `plannedDate` cannot exceed goal `targetDate`
- `startTime` and `endTime` must be paired
- `endTime` must be later than `startTime`
- `time_based` tasks require `estimatedMinutes`
- `unit_based` tasks require `targetValue` and `targetUnit`

Invalid AI output is rejected and not trusted.

## AI Limits

Current backend limits:

- `free`: no AI access
- `ai_basic`: 20 AI requests per UTC day
- `ai_pro`: 100 AI requests per UTC day

## Rule

AI remains constrained behind explicit backend APIs.

AI does not:

- write directly to DB
- bypass ownership checks
- bypass subscription checks
- control deadline logic
- behave like a chat assistant

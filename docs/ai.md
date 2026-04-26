# AI

## Status

AI planning is implemented on the backend.

Implemented endpoints:

- `POST /ai/generate-plan`
- `POST /ai/replan`

Not implemented:

- frontend AI entry flow
- deep schedule-aware generation using saved availability blocks

## Product Rules

AI is only for:

- initial plan generation
- explicit replanning

AI is not for:

- chat
- continuous coaching
- ownership/security decisions
- deadline truth
- subscription truth

## Current Behavior

### Generate Plan

Input:

- title
- optional description
- target date
- optional priority
- optional availability array

Behavior:

- backend verifies auth and premium access
- backend checks daily quota
- backend sends a JSON-only prompt to Gemini
- backend validates the returned task structure
- backend creates the AI-managed goal and tasks through backend services
- backend logs AI usage

### Replan

Input:

- goalId
- optional current progress note

Behavior:

- backend verifies ownership
- backend verifies AI-managed goal type
- backend checks premium access and quota
- backend loads current task/progress state
- backend validates AI output
- backend replaces incomplete AI-generated tasks
- backend logs usage

## Validation Rules

Implemented:

- strict JSON-only output expectation
- schema validation
- task count bounds
- time validation
- date validation
- type-specific validation for time-based vs unit-based tasks

AI output is never trusted blindly.

## Quota Rules

Current daily limits:

- `free`: `0`
- `ai_basic`: `20`
- `ai_pro`: `100`

## Logging

`AiUsageLog` is written for:

- successful calls
- failed calls

Tracked fields include:

- user
- optional goal
- action type
- model
- token counts when available
- success/failure
- error message

## Provider and Env

Current provider path:

- Gemini via `@google/genai`

Relevant env vars:

- `GEMINI_API_KEY`
- optional `AI_MODEL`

## Current Limitations

- frontend does not yet expose the AI flow cleanly
- saved availability blocks are not yet used deeply enough to produce planner-quality schedules
- AI is still constrained to backend-only flows, which is correct, but mobile UX integration is incomplete

## Next Improvement

Use saved availability blocks more deeply during plan generation and replanning so AI output respects the real planner schedule.

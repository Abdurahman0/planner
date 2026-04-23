# AI Integration

## Product Rule

AI is allowed only for:

- Initial plan generation.
- Explicit manual replanning.

AI is not allowed for:

- Chat.
- Continuous analysis of every user action.
- Silent plan changes.
- Deadline projection.
- Premium enforcement.
- Task completion decisions.

## Current Implementation

Current AI-related files:

- `packages/shared/src/index.ts`: Defines `AIPlanRequest` and `AIPlanResponse`.
- `apps/backend/src/modules/ai/ai.controller.ts`: Exposes `POST /ai/generate-plan` and `POST /ai/replan`.
- `apps/backend/src/modules/ai/ai.service.ts`: Placeholder service.
- `apps/mobile/app/goals/create.tsx`: Shows AI-managed goal option and AI planning context fields.
- `apps/mobile/app/goals/[id].tsx`: Shows a replan button for AI-managed goals.

Current behavior:

- No frontend AI call exists.
- `AiService.generatePlan()` returns `{ tasks: [], milestones: [] }`.
- `AiService.replan()` returns `{ tasks: [], milestones: [] }`.
- No provider call exists despite `@google/genai` being installed.
- No AI output validation exists.
- No AI usage log write exists.
- No premium quota is enforced in the AI controller.

## Current Shared Types

`AIPlanRequest` currently includes:

- `goalTitle`
- `description`
- `targetDate`
- `availability`

`AIPlanResponse` currently includes:

- `tasks`
- `milestones`

Limitations:

- Availability is a JSON string, not a typed structure.
- No user timezone.
- No priority.
- No difficulty.
- No task density or preferred workdays.
- No existing progress for replanning.
- No schema version.
- No validation contract for generated task dates, task types, units, or estimates.

## Target Input Shape

Future plan generation should send structured data:

- Goal title.
- Goal description.
- Goal type.
- Target date.
- User timezone.
- User availability.
- Desired intensity.
- Existing commitments.
- Preferred task type where relevant.
- Premium plan and quota context from backend.

Future replan should additionally include:

- Current plan version.
- Remaining tasks.
- Completed tasks.
- Partial and failed tasks.
- Progress logs.
- Current projected date.
- Reason for replan.

## Target Output Shape

AI output should be structured JSON only:

- Plan summary.
- Milestones.
- Tasks with planned dates.
- Task type: time-based or unit-based.
- Time estimates or unit targets.
- Dependencies or ordering if needed.
- Warnings if target date is unrealistic.

The backend must validate output before saving it. Invalid output should fail safely and not create partial plans.

## Cost Control

Required controls before real AI integration:

- Server-side premium check.
- Server-side active AI goal count check.
- AI usage logging.
- Rate limiting.
- Token tracking.
- Provider error handling.
- Retry policy with limits.
- No background AI calls for ordinary task completion.

## What Can Stay

- The product boundary that AI is explicit and structured.
- The basic `AIPlanRequest` and `AIPlanResponse` names.
- The `AiModule`, `AiController`, and `AiService` file locations.
- The create goal UI concept that collects planning context.

## What Must Be Rewritten

- AI request and response types need production-grade structure.
- `AiService` must be replaced with a provider adapter and validation pipeline.
- AI endpoints need auth, quota checks, DTOs, and logging.
- AI-generated tasks must be persisted through plan version transactions.
- Replan flow must create a new plan version instead of returning loose task arrays.


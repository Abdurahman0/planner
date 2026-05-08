# Coding Rules

## Core

- backend is the source of truth
- do not duplicate planner business rules across random UI surfaces
- do not add parallel planning flows when Planner already owns the action
- do not expose tokens, secrets, or raw backend internals

## Product simplification

- each page must have one clear purpose
- remove duplicate task-entry flows instead of adding more buttons
- hide advanced options under `More options`
- keep Planner as the only real execution/planning surface

## Priority

- priority must affect behavior, not only color
- effective priority is:
  - task override
  - else goal priority
  - else medium
- scheduled reminder behavior must use effective priority
- unscheduled daily task ordering must use effective priority
- Dashboard `Next Action` is time-first for scheduled work, not priority-first
- priority is only a tie-breaker for same-time scheduled work and for unscheduled fallback

## Mobile

- Dashboard must answer `what should I do now?`
- Dashboard is for today only, not analytics
- Dashboard should present one dominant action, not competing lists
- Goals manages goals, it does not become a second planner
- Goal detail can review and complete goal-owned tasks, but does not become a planner
- Progress is read-only stats
- Progress analytics should stay simple, readable, and user-scoped
- Profile is account/settings only
- do not ship debug panels or raw notification feeds
- planner timeline chips must stay inside cards and wrap cleanly on small task blocks
- auth session persistence must clear only on explicit logout or confirmed invalid session

## Notifications

- daily-task notification remains one notification per user/day
- do not create duplicate local + push daily-task surfaces
- Android high-priority behavior may be stronger, but do not claim full alarm behavior unless implemented natively and verified

## Security

- JWT on user-owned routes
- no client-controlled `userId`
- no JWT/push token display in UI
- no JWT storage outside approved session storage (`SecureStore` on native)
- no secrets in frontend
- no sensitive notification payloads

## Docs

- update docs after meaningful behavior changes
- document limitations honestly
- do not describe visual-only priority as functional priority

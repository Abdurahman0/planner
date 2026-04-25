# Coding Rules

## Core Rules

- backend is the source of truth
- do not trust frontend state for business decisions
- no business logic in UI
- no direct DB access from frontend
- always enforce ownership and security in backend
- AI must not handle core logic

## Backend Rules

- all user-owned endpoints must require authentication
- all user-owned resources must enforce ownership checks
- prefer `404` for non-owned resources where practical
- use DTO validation on request input
- never expose `passwordHash`
- never trust client-provided premium flags
- never trust client `userId` for owned resources
- premium and quota enforcement must happen in backend
- planner and deadline logic must live in backend domain logic

## Frontend Rules

- frontend should consume APIs, not act as source of truth
- mock Zustand data is temporary and must not define final business behavior
- no premium enforcement only in frontend
- no AI logic embedded in UI screens

## AI Rules

- AI only generates or replans structured plans
- AI is not chat
- AI must not decide auth, ownership, pricing, or deadline truth
- AI output must be validated before persistence

## Database Rules

- Prisma schema and shared types must stay aligned
- do not add stringly-typed business fields when enums are appropriate
- relations must reflect real ownership and planner flows

## Security Rules

- hash passwords
- sign JWTs with env-based secret
- keep secrets out of code
- avoid user enumeration in auth flows
- expose only safe response fields

## Documentation Rules

- `/docs` must stay aligned with real implementation state
- implemented vs planned must always be explicit
- do not document placeholder code as working product behavior

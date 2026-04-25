# Roadmap

## CURRENT DONE

- Prisma schema alignment
- shared domain type alignment
- database migration
- database seed
- backend bootstrap
- `main.ts`
- `GET /health`
- secure auth foundation
- `POST /auth/register`
- `POST /auth/login`
- JWT auth
- `GET /users/me`
- Goals API
- goal ownership checks
- premium AI-goal enforcement in backend
- Tasks API
- task ownership checks
- TaskProgressLog writes on task status updates
- deadline movement logic based on TaskProgressLog
- frontend auth integration
- frontend goals integration
- frontend tasks integration
- AI plan generation integration
- AI replanning integration
- AI usage logging and validation
- payment transaction model
- Click payment integration
- Payme payment integration
- webhook-driven subscription upgrades
- idempotent payment processing
- notifications API
- retention summary API
- Expo push token registration
- frontend notification display
- daily task reminders
- missed task alerts
- progress feedback notifications
- streak milestone notifications

## IN PROGRESS

- launch readiness and growth execution

## NEXT STEPS (STRICT ORDER)

1. launch instrumentation and retention analytics hardening
2. launch strategy and user acquisition

## Detailed Progress State

### Backend

Done:

- bootstrap
- validation
- auth
- protected current-user endpoint
- goals endpoints with ownership checks
- premium AI-goal enforcement
- tasks endpoints with ownership checks
- TaskProgressLog writes on status updates
- projected deadline recalculation based on real progress
- AI generate-plan endpoint
- AI replan endpoint
- AI provider validation and usage logging
- payment initiation endpoint
- payment webhook endpoint
- verified subscription upgrade flow
- idempotent transaction processing
- notifications endpoints
- retention summary endpoint
- daily notification generation
- streak reward generation

Next:

- launch hardening for notifications and growth

### Database

Done:

- aligned schema
- seed data

Next:

- broader goal/task data usage from frontend clients

### Frontend

Current status:

- connected to backend auth/goals/tasks APIs
- no longer using mock goal/task/user data
- secure token storage on native with session-storage fallback on web preview
- notification list and unread state are connected to backend APIs
- Expo push token registration is wired into app bootstrap on supported devices

Next:

- billing UI
- richer task/planner UX

### AI

Current status:

- implemented behind guarded backend endpoints
- not connected to frontend yet

Next:

- frontend AI entry points

### Payments

Current status:

- backend payment initiation is implemented
- backend webhook confirmation is implemented
- Click flow is implemented
- Payme Merchant API webhook flow is implemented
- subscription upgrade truth now comes from backend payment processing

Next:

- frontend billing screen
- notifications for successful and failed payments

### Retention

Current status:

- backend generates task reminders, missed-task alerts, progress feedback, and streak rewards
- backend stores notifications and exposes authenticated notification APIs
- frontend displays notifications and marks them read
- streak metrics now come from backend summary data, not hardcoded UI values

Next:

- push receipt handling
- delivery preferences
- launch analytics around notification open and retention impact

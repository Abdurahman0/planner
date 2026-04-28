# Product

## Identity

AI Planner is a planner application, not a chat application.

Product focus:

- goals
- tasks
- daily scheduling
- weekly/monthly planning
- progress visibility
- deadline movement from real execution

AI exists only to:

- generate an initial structured plan
- replan when the user explicitly asks for it

AI is not:

- a continuous chat assistant
- the source of truth for planner logic
- the source of truth for deadlines

## User Types

### Free

- unlimited manual goals
- unlimited manual tasks
- no AI-managed goals
- no AI plan generation

### Premium

- unlimited manual goals
- unlimited manual tasks
- up to 3 active AI-managed goals
- AI plan generation
- AI replanning

## Goal Types

### Manual Goals

- created directly by the user
- can have scheduled or unscheduled tasks
- no AI requirement

### AI Goals

- created through backend AI generation flow
- premium-only
- capped at 3 active AI-managed goals

## Core User Flow

```text
auth -> create goal -> create or generate tasks -> schedule day/week -> complete work -> progress logs -> projected deadline update
```

## Current Implemented Features

- auth flow
- goals CRUD
- tasks CRUD except delete
- task status updates
- `TaskProgressLog` writes
- projected deadline updates
- planner availability blocks
- scheduled tasks
- unscheduled tasks
- day/week/month planner views
- day view quick-add flow
- `Plan Day` planner sheet
- notifications and retention summary
- Android system push notifications for reminders and retention events
- backend AI generation and replan
- backend payment upgrade flow

## Planning-First UX

Current mobile planner behavior:

- day view is the main scheduling surface
- user can tap an hour to add a task quickly
- user can define routine blocks like sleep, work, study, eating, and custom blocks
- scheduled tasks appear inside the hourly timeline
- unscheduled tasks stay in a separate section until placed
- each main tab now has a context-aware floating CTA for the primary next action

Current notification behavior:

- the app keeps an in-app record list for recent planner events
- backend-generated Expo push notifications are the primary user-facing notification surface
- the in-app record list is history/debug context, not the main delivery mechanism
- closed-app/background delivery depends on backend sweep or cron execution, not just the app UI
- Profile includes a developer-safe test push action and debug summary for real-device verification
- task reminders can surface as Android system notifications
- missed-task and progress feedback can surface as Android system notifications
- streak rewards can surface as Android system notifications
- daily planning reminders can bring the user back into the planner flow

## Current Limitations

- frontend AI planning entry flow is not implemented yet
- payment UI is not implemented yet
- drag-and-drop rescheduling is not implemented
- task resize by drag is not implemented
- overlap handling in the UI is still basic
- Android notification styling is limited by OS/system rendering rules
- Android push also depends on correct Firebase client setup inside the APK plus EAS FCM credentials
- push behavior still needs full real-device QA with production Expo credentials
- closed-app/background push depends on deployed backend sweep/cron execution, not just the app UI being open
- real-device QA is still required before public launch

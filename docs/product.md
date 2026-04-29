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
- recurring task series
- recurring routine blocks
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
- tasks can be standalone personal reminders or linked to goals
- tasks and routine blocks can repeat:
  - daily
  - weekly
  - monthly
  - yearly
- each main tab now has a context-aware floating CTA for the primary next action
- shared floating CTAs sit low against the edge-to-edge bottom area using safe-area anchoring instead of tab-bar-height offsets

Current notification behavior:

- backend-generated Expo push notifications are the primary user-facing notification surface
- closed-app/background delivery depends on backend sweep or cron execution, not just the app UI
- Profile keeps a test push action for authenticated QA without exposing internal state
- task reminders can surface as Android system notifications
- missed-task and progress feedback can surface as Android system notifications
- streak rewards can surface as Android system notifications
- daily planning reminders can bring the user back into the planner flow
- unscheduled daily tasks can surface as a persistent-ish Android reminder:
  - up to 3 task titles shown
  - oldest created tasks first
  - if more remain, notification adds `+N more tasks`
  - completion removes tasks from the next refresh
  - identical reminders are deduplicated instead of re-sending on every sweep
  - body tap opens Planner
  - supported action button is `✓ Done`, not a custom animated circle/tick control

## Current Limitations

- frontend AI planning entry flow is not implemented yet
- payment UI is not implemented yet
- drag-and-drop rescheduling is not implemented
- task resize by drag is not implemented
- overlap handling in the UI is still basic
- recurring series editing is currently whole-series only
- monthly/yearly recurrence uses calendar-date clamping for end-of-month safety
- Android notification styling is limited by OS/system rendering rules
- Android push also depends on correct Firebase client setup inside the APK plus EAS FCM credentials
- push behavior still requires final real-device QA with production Expo credentials
- closed-app/background push depends on deployed backend sweep/cron execution, not just the app UI being open
- true Android non-dismissible ongoing notifications are not claimed in the current Expo/EAS MVP
- task completion from notification actions may still require the app to resume; true killed-app background completion is not claimed
- real-device QA is still required before public launch

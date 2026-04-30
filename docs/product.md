# Product

## Identity

AI Planner is a planner app, not a chat app.

AI is used only for:

- initial plan generation
- explicit replanning

AI is not:

- a continuous chat surface
- the source of truth for planner logic
- the source of truth for deadlines or notifications

## Implemented Product Surface

- auth
- goals CRUD
- tasks CRUD except delete
- direct progress logging through task status updates
- planner day/week/month views
- availability / routine blocks
- recurring tasks and recurring routine blocks
- standalone tasks without goals
- Android push notifications
- backend retention notifications

## Planner Behavior

- day view is the main scheduling surface
- scheduled tasks render in the timeline
- unscheduled tasks render in a separate section
- tasks may belong to a goal or be standalone
- recurring tasks and routine blocks support:
  - daily
  - weekly
  - monthly
  - yearly

## Notification Behavior

Normal notifications:

- reminders
- missed-task alerts
- progress feedback
- streak rewards

Daily-task reminder:

- Android-only native custom notification
- one notification per user/day
- up to 3 task rows
- empty circle plus title on each row
- `+N more tasks` when applicable
- body tap opens Planner
- circle tap targets that exact task row
- circle tap flips that row into a checked state immediately, then the row disappears after backend-confirmed refresh
- backend remains the source of truth for completion

Important Android limitation:

- this is a custom Android notification layout, not a perfect inline task widget
- Android system UI controls spacing and decoration
- killed-app circle-tap completion may queue until the next authenticated resume
- true non-dismissible ongoing notification behavior is not claimed

## Current Limits

- frontend AI entry flow is not implemented
- payment UI is not implemented
- drag-and-drop planner interactions are not implemented
- recurring single-occurrence edit/delete is not implemented
- Android push still requires final real-device QA

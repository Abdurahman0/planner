# Coding Rules

## Core

- backend is the source of truth
- never trust client input
- do not move planner rules into AI
- do not expose tokens, secrets, or private payload data

## React Native / Expo

- use `react-native-safe-area-context` correctly
- keep edge-to-edge intentional and safe-area aware
- keep floating CTAs low without overlapping system navigation
- keep modals keyboard-safe on real Android devices
- request notification permission only after authentication
- Expo push token registration failures must not break startup
- Expo Android push must use Expo push tokens, not raw FCM tokens
- do not ship debug panels or raw backend notification feeds in production UI

## Android daily-task notification

- the visible daily-task reminder is Android-only and native
- use the local Expo module / `RemoteViews` path for custom row UI
- do not show a second visible Expo daily-task alert for the same reminder
- one daily-task notification per user/day
- max 3 visible task rows
- each row must target the exact task it represents
- body tap opens Planner
- circle tap may show a temporary checked state immediately, but backend confirmation still controls final completion
- circle tap must not trust local state; completion still goes through authenticated backend APIs
- if background/killed-app completion cannot run securely, queue the action and process it on the next authenticated resume
- do not claim true non-dismissible ongoing notification behavior unless it is actually implemented and verified

## Backend

- protect user-owned routes with JWT
- enforce ownership on every user-owned resource
- do not accept client-controlled `userId`
- standalone tasks must stay user-scoped through direct task ownership
- keep push device registration JWT-protected
- keep cron endpoints protected by server-side secret only
- deduplicate identical reminder content instead of spamming pushes
- remove invalid Expo tokens when provider feedback marks them unregistered

## Build / Secrets

- Expo project root is repo root
- use EAS env vars for APK builds
- Android push builds must include valid Firebase client config and EAS FCM credentials
- never commit Firebase service-account private keys
- never log JWTs or push tokens in production

## Documentation

- update `/docs` after meaningful changes
- mark implemented behavior vs limitation accurately
- do not document fallback behavior as if it were verified native capability

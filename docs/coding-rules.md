# Coding Rules

## Core Rules

- backend is the source of truth
- never trust client input
- frontend must not own business rules
- do not move planner logic into AI
- do not access the database directly from frontend

## React Native Rules

- no web-only components in native app code
- no Recharts in native app code
- use `react-native-safe-area-context` correctly
- keep Android system UI dark and safe-area aware
- Android navigation bar must use the same solid surface color as the root app background
- do not rely on true transparent Android navigation; use visual blending instead
- modal and sheet action areas must include bottom inset padding
- floating actions must sit above the tab bar and Android system navigation
- floating planner actions must be anchored from the screen root, not from scrollable content
- planner screens must avoid double-counting tab bar height and safe-area bottom padding
- planner floating actions must anchor to the actual tab bar height, not stacked hardcoded offsets
- planner bottom spacing should be the minimum needed to keep final content and actions visible
- tab bars must not add separator lines or shadows that create a seam above the Android navigation area
- auth screens must remain keyboard-safe on Android and iOS
- password visibility toggles must stay UI-only
- use Expo notification channels explicitly on Android
- notification tap routing must target existing app routes only
- request notification permission only after the user is authenticated
- if notification permission is denied, use a non-blocking in-app notice instead of blocking the user flow
- keep in-app notifications and push notifications conceptually separate
- Expo push token registration failures must not break app startup and should retry safely

## Backend Rules

- protect user-owned routes with JWT
- enforce ownership on every user-owned resource
- validate request DTOs
- do not accept client-controlled `userId`
- keep payment confirmation webhook-driven
- keep quota and subscription checks in backend
- keep push device registration JWT-protected
- keep push payloads free of secrets and private account data
- keep internal cron/sweep endpoints protected with a server-side secret only
- best-effort push delivery must never block saving the in-app notification record
- invalid Expo device tokens should be removed when the provider marks them unregistered
- when new routes are added, verify deployed environments expose them before assuming mobile errors are auth-related

## AI Rules

- AI only generates or replans structured plans
- AI is not chat
- AI output must be validated before persistence
- AI must not bypass business rules or ownership checks

## Mobile Build Rules

- Expo project root is repo root
- use EAS environment variables for APK builds
- `EXPO_PUBLIC_API_URL` must be set correctly for preview/production builds
- Expo notifications in APK builds must use the configured EAS project ID

## Secrets Rules

- never commit real secrets
- do not document real private credentials in `/docs`
- use `.env.example` for required variables only
- never persist plain-text passwords client-side or server-side

## Documentation Rules

- update `/docs` after every meaningful feature change
- mark implemented vs planned vs limitation explicitly
- remove stale roadmap/status claims
- do not describe mock or partial behavior as complete
- major changes should update docs before or immediately after code lands

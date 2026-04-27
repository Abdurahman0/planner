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
- use Android edge-to-edge navigation intentionally:
  - `expo-navigation-bar`
  - absolute position
  - transparent background
  - light buttons
- modal and sheet action areas must include bottom inset padding
- floating actions must sit above the tab bar and Android system navigation
- floating planner actions must be anchored from the screen root, not from scrollable content
- planner screens must avoid double-counting tab bar height and safe-area bottom padding
- planner floating actions should anchor from `insets.bottom` with only a minimal offset
- planner bottom spacing should be the minimum needed to keep final content and actions visible
- main tab pages should use the shared floating CTA pattern instead of ad hoc page-specific floating buttons
- tab bars must remain safe-area aware and must not introduce bottom seams or system-button overlap
- auth screens must remain keyboard-safe on Android and iOS
- task and schedule modals must remain keyboard-safe on real Android devices, including expanded advanced fields
- password visibility toggles must stay UI-only
- use Expo notification channels explicitly on Android
- notification tap routing must target existing app routes only
- request notification permission only after the user is authenticated
- if notification permission is denied, use a non-blocking in-app notice instead of blocking the user flow
- keep in-app notifications and push notifications conceptually separate
- do not treat the in-app notification list as the primary notification experience when system push exists
- Expo push token registration failures must not break app startup and should retry safely
- Expo push token creation must resolve the EAS project ID from runtime config, not guess
- real-device push debugging UI may expose safe status summaries only, never full Expo tokens or JWTs

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

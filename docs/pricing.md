# Pricing

## Plans

### Free

- unlimited manual goals
- unlimited manual tasks
- no AI-managed goals
- no AI generation/replan access

### ai_basic

- `49,000 UZS`
- AI access enabled
- up to 3 active AI-managed goals
- daily AI quota: `20`

### ai_pro

- `79,000 UZS`
- AI access enabled
- up to 3 active AI-managed goals
- daily AI quota: `100`

## Enforcement

Implemented:

- premium AI-goal enforcement in backend
- AI quota enforcement in backend
- webhook-driven subscription upgrades

## Payment Providers

Implemented backend providers:

- Click
- Payme

Endpoints:

- `POST /payments/initiate`
- `POST /payments/webhook`

Upgrade truth:

- only verified webhook processing upgrades the user
- frontend success is not trusted

## Current Limitations

- billing UI is not implemented
- payment status UX is not implemented
- production credentials may still be test or staging depending deployment environment
- refund/reconciliation flows are not implemented

# Plaid Flash

Plaid Flash is a lightweight Next.js app for quickly testing Plaid Link flows and product APIs in the Plaid Sandbox with a fast, UI-driven workflow and copy/paste-friendly request/response modals.

**Live app**: `https://plaid-flash.vercel.app`

## Contents

- [Advanced Mode (Docker)](#advanced-mode-docker)
- [Environment variables](#environment-variables)
- [How to use the app](#how-to-use-the-app)
- [Supported products](#supported-products)
- [Settings toggles (feature flags)](#settings-toggles-feature-flags)
- [Webhooks (dev-only in-app viewer)](#webhooks-dev-only-in-app-viewer)
- [Troubleshooting](#troubleshooting)

## Advanced Mode (Docker)

### Prerequisites

- A Plaid account + API keys: `PLAID_CLIENT_ID` and `PLAID_SECRET` (only Plaid Sandbox is supported).
- A Link customization named **`flash`** in the Plaid Dashboard.

This repo supports running in Docker for a consistent environment (and to enable dev-only webhook features if you provide `NGROK_AUTHTOKEN`).

```bash
cp .env.example .env  # <- Update .env with your credentials
docker compose up --build
```

Open `http://localhost:3000`.

## Environment variables

Create a `.env` file based on `.env.example` and populate with your credentials.

### Useful Docker commands

```bash
docker compose logs -f # Follow log messages from the app
docker compose down    # Stops the Docker container
docker compose down -v # Stops and removes Docker container
```

### Required

- **`PLAID_CLIENT_ID`**: your Plaid Client ID
- **`PLAID_SECRET`**: your Plaid Sandbox Secret

### Optional

- **`ALT_PLAID_CLIENT_ID`**, **`ALT_PLAID_SECRET`**: enable the **Use ALT_PLAID_CLIENT_ID** toggle to switch credentials per session.
- **`NGROK_AUTHTOKEN`** (local dev-only): enables the in-app webhook viewer/stream while running locally.

## How to use the app

### Typical non-CRA flow

1. Pick a product (e.g. Auth).
2. Review/edit the `/link/token/create` configuration.
3. Complete Link.
4. Exchange `public_token` → `access_token`.
5. Call `/accounts/get` (where applicable) and then the selected product endpoint.

### CRA flow (Plaid Check / Consumer Report)

CRA products use a **user-based** flow:

1. `/user/create` preview + create
2. `/link/token/create` includes `user_id` or `user_token` (based on the **Use legacy user_token** toggle)
3. Complete Link
4. Run CRA product APIs (and watch CRA webhooks in the viewer in dev)

### Hosted Link flow

When **Hosted Link** is enabled:

- `/link/token/create` includes `hosted_link: {}` and returns `hosted_link_url`
- The app opens Hosted Link in a new tab and waits for `LINK/SESSION_FINISHED`
- After completion, it continues with the standard exchange → accounts → product flow

### Layer flow

When **Layer** is enabled, Plaid Flash uses **Layer + Link** (behind the scenes) instead of calling `/link/token/create` directly:

- **Prereqs**: you must set a **Webhook URL** in Settings (Layer relies on webhooks).
- The app runs `/user/create`, then `/session/token/create` (using the selected product’s `template_id`).
- You’ll be prompted to `submit({ phone_number })`. If `LAYER_NOT_AVAILABLE` occurs, you can `submit({ date_of_birth })` for Extended Autofill.
- After Layer is ready, Link opens and returns `public_token` via `onSuccess` (then the app continues with the normal flow).
- **Layer + CRA**: after Link completes, the app calls `/user_account/session/get`, then **previews `/user/update` (editable)** to persist identity, then calls `/cra/check_report/create` and waits for a `USER_CHECK_REPORT_READY` webhook before running the CRA `/get` endpoint.

### Update Mode

Under **Link → Update Mode**, you can paste:

- An `access_token` to trigger Item-based update mode
- A `user_id` or `user_token` to trigger User-based update mode

Update Mode does **not** run downstream product APIs and does **not** automatically remove the Item/User at the end.

## Supported products

Product definitions live in `lib/productConfig.ts`. Leaf products below include the Plaid API they call (as shown in the UI).

### Payments and Funding

- **Auth** → `/auth/get`
- **Signal**
  - Signal Evaluate → `/signal/evaluate`
  - Signal Balance → `/accounts/balance/get`
- **Identity**
  - Identity Get → `/identity/get`
  - Identity Match → `/identity/match`
- **Investments Move** → `/investments/auth/get`

### Personal Finance Insights

- **Transactions**
  - Transactions Get → `/transactions/get`
  - Transactions Sync → `/transactions/sync`
- **Investments**
  - Investments Holdings → `/investments/holdings/get`
  - Investments Transactions → `/investments/transactions/get`
- **Liabilities** → `/liabilities/get`

### CRA

- Base Report → `/cra/check_report/base_report/get`
- Income Insights → `/cra/check_report/income_insights/get`
- Partner Insights → `/cra/check_report/partner_insights/get`
- Cashflow Insights → `/cra/check_report/cashflow_insights/get`
- Cashflow Updates → `/cra/monitoring_insights/get`

### Link

- **Update Mode** (Link only; no downstream calls)

## Settings toggles (feature flags)

The **Settings** modal includes these toggles:

- **⚡️ Mode**: streamlined mode that skips some intermediate screens and runs faster through flows.
- **Demo Mode**: connect once, then try multiple products without re-running Link every time.
- **Embedded Link**: runs Link using the embedded Link experience.
- **Include phone_number in Link Token Create config**: adds `user.phone_number` (E.164) to Link token configs.
- **Layer**: enables Plaid Layer flows (uses `/user/create` + `/session/token/create` and Layer `submit()` steps before Link opens). Requires a webhook URL.
- **Use legacy user_token**: Switches between modern `user_id`/`identity` and legacy `user_token`/`consumer_report_user_identity` for `/user/create` calls
- **Use ALT_PLAID_CLIENT_ID**: uses `ALT_PLAID_CLIENT_ID` + `ALT_PLAID_SECRET` for the session.
- **Bypass Link**: uses Sandbox endpoints to create items without Link UI and go straight to downstream calls.
- **Multi-item Link**: enables `enable_multi_item_link: true`. Non-CRA flows use Plaid webhooks to capture `public_tokens[]` and includes an Item picker when multiple Items are added.
- **Hosted Link**: enables Hosted Link (`hosted_link: {}`), opens `hosted_link_url` in a new tab, then continues once a `SESSION_FINISHED` webhook is received.
- **Remove items and users automatically** (default on): when you finish and return to the menu, automatically calls `/item/remove` (non-CRA) or `/user/remove` (CRA/hybrid). When off, deletion is skipped.

## Webhooks (dev-only in-app viewer)

When running locally in dev with `NGROK_AUTHTOKEN`, Plaid Flash starts an ngrok tunnel and exposes an in-app webhook viewer/stream. This is used for:

- CRA report webhooks
- Multi-item Link (Webhooks such as `ITEM_ADD_RESULT` and `SESSION_FINISHED`)
- Hosted Link completion (`SESSION_FINISHED` webhook)

## Troubleshooting

### No webhook events appear

- Confirm you’re running locally in dev.
- Confirm `NGROK_AUTHTOKEN` is set in `.env` (exact casing).
- Confirm the Link token config includes a `webhook` URL (the UI preview should show it).

### Hosted Link doesn’t open

- Some browsers block popups; try the UI’s “Open Hosted Link” button if present.

### ALT credentials toggle is disabled

- Ensure both `ALT_PLAID_CLIENT_ID` and `ALT_PLAID_SECRET` are set.

## Resources

- Plaid docs: `https://plaid.com/docs/`
- Sandbox test credentials: `https://plaid.com/docs/sandbox/test-credentials/`

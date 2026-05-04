# Plaid Flash

Plaid Flash is a lightweight Next.js app for quickly testing Plaid Link flows and product APIs in the Plaid Sandbox with a fast, UI-driven workflow and copy/paste-friendly request/response modals.

**Live app**: `https://plaid-flash.vercel.app`

<img src="https://deploy-badge.vercel.app/vercel/plaid-flash" alt="Vercel Deploy"></img>

## Contents

- [Advanced Mode (Docker)](#advanced-mode-docker)
- [Environment variables](#environment-variables)
- [How to use the app](#how-to-use-the-app)
- [Supported products](#supported-products)
- [Settings toggles (feature flags)](#settings-toggles-feature-flags)
- [Webhooks](#webhooks)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Advanced Mode (Docker)

### Prerequisites

- A Plaid account + API keys: `PLAID_CLIENT_ID` and `PLAID_SECRET` (only Plaid Sandbox is supported).
- A Link customization named **`flash`** in the Plaid Dashboard.

This repo supports running in Docker for a consistent local development environment.

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

## How to use the app

### Configuration Wizard

The app opens directly into the **Configuration Wizard** after the welcome animation. The wizard is a single screen with three cards (**Payments and Funding**, **Personal Finance Insights**, **CRA**); each card lists its leaf products as toggleable buttons, optionally grouped by sub-category (e.g. CRA → Income → Income Insights). Pick every product you want to test in the session, then click **Start**.

Once Link completes, the wizard re-appears in **picker** mode showing only the products you selected — clicking a button runs that product's API against the access_token from your Link session. You can run multiple products back-to-back without re-running Link.

The settings gear (top-right of the wizard) opens the Settings modal; the reset icon (top-left, after Link completes) cleans up Items/Users and returns you to the initial selection screen.

### Typical non-CRA flow

1. Select one or more non-CRA leaf buttons in the wizard, then click **Start**.
2. Review/edit the `/link/token/create` configuration (products = the union of your selections).
3. Complete Link.
4. Exchange `public_token` → `access_token`.
5. The wizard re-opens in picker mode — click any selected button to call `/accounts/get` (where applicable) and then that product's endpoint.

### CRA flow (Plaid Check / Consumer Report)

CRA products use a **user-based** flow:

1. Select one or more CRA buttons (and optionally non-CRA buttons for hybrid sessions), then click **Start**.
2. `/user/create` preview + create
3. `/link/token/create` includes `user_id` or `user_token` (based on the **Use legacy user_token** toggle)
4. Complete Link
5. Pick a CRA product from the post-Link picker and run its API (wait for `USER_CHECK_REPORT_READY` to arrive, then click proceed)

### Hosted Link flow

When **Hosted Link** is enabled:

- `/link/token/create` includes `hosted_link: {}` and returns `hosted_link_url`
- The app opens Hosted Link in a new tab and waits for `LINK/SESSION_FINISHED`
- After completion, it continues with the standard exchange → picker → product flow

### Layer flow

When **Layer** is enabled, Plaid Flash uses **Layer + Link** (behind the scenes) instead of calling `/link/token/create` directly:

- **Prereqs**: you must set a **Webhook URL** in Settings (Layer relies on webhooks).
- The app runs `/user/create`, then `/session/token/create` (using the selected product's `template_id`).
- You'll be prompted to `submit({ phone_number })`. If `LAYER_NOT_AVAILABLE` occurs, you can `submit({ date_of_birth })` for Extended Autofill.
- After Layer is ready, Link opens and returns `public_token` via `onSuccess` (then the app continues with the normal flow).
- **Layer + CRA**: after Link completes, the app calls `/user_account/session/get`, then **previews `/user/update` (editable)** to persist identity, then calls `/cra/check_report/create`. The product API preview opens immediately; you wait for `USER_CHECK_REPORT_READY` out-of-band and click proceed when ready (Plaid returns an error and you can retry if you click too early).

### Update Mode

Update Mode is a Settings toggle in the **Link** card (mutually exclusive with Layer / Embedded Link / Hosted Link / Multi-item Link / Bypass Link). When it's on:

1. Pick the products you want to drive after Link in the wizard, then click **Start**.
2. Paste an `access_token`, `user_id`, or `user_token` in the input modal.
3. Plaid Flash builds a `/link/token/create` config that combines your token with the selected products and opens Link in update mode.
4. After Link succeeds, the post-Link picker lets you call any of the selected products' APIs against the user-supplied token (no `public_token` exchange happens — the token you pasted is used directly).

### Upgrade Mode

Upgrade Mode is a Plaid flow that lets you add Plaid CRA functionality to existing non-CRA items, and call CRA endpoints once the upgrade is complete. It lives as a button at the bottom of the **CRA** card in the wizard and is selectable only on the initial wizard screen — once enabled it owns the entire session. You need only an existing access_token to get started:

1. Toggle the **Upgrade Mode** button in the CRA card and click **Start**.
2. Preview + run `/user/create` (supports `user_id` or legacy `user_token` based on the **Use legacy user_token** toggle)
3. Preview `/link/token/create` (you'll paste the `access_token` and can edit products/options)
4. Complete Link, wait for `CHECK_REPORT / USER_CHECK_REPORT_READY`, then pick the CRA product to run from the post-Link picker

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
- **Upgrade Mode** (special CRA button at the bottom of the card; see [Upgrade Mode](#upgrade-mode))

## Settings toggles (feature flags)

The **Settings** modal is organized into three cards — **Flash**, **Link**, and **Advanced** — with each setting represented as a checkbox button. The webhook URL input sits below the cards. The top-right of the modal also has a light/dark theme toggle and a Docs shortcut. Available toggles:

### Flash

- **⚡️ Mode**: streamlined mode that skips some intermediate screens and runs faster through flows. When the wizard's post-Link picker is enabled, ⚡️ Mode applies per product run.
- **Layer**: enables Plaid Layer flows (uses `/user/create` + `/session/token/create` and Layer `submit()` steps before Link opens). Requires a webhook URL. Mutually exclusive with the other Link-mode toggles below.
- **Layer Identity Match**: enables Layer's identity-match step (only available when Layer is on).

### Link

The Link-mode toggles below are mutually exclusive — enabling one disables the others:

- **Embedded Link**: runs Link using the embedded Link experience.
- **Hosted Link**: enables Hosted Link (`hosted_link: {}`), opens `hosted_link_url` in a new tab, then continues once a `SESSION_FINISHED` webhook is received. Requires a webhook URL.
- **Multi-item Link**: enables `enable_multi_item_link: true`. Non-CRA flows use Plaid webhooks to capture `public_tokens[]` and includes an Item picker when multiple Items are added.
- **Bypass Link**: uses Sandbox endpoints (`/sandbox/public_token/create`) to create items without Link UI and go straight to downstream calls.
- **Update Mode**: when enabled, clicking **Start** in the wizard prompts you for an existing `access_token` / `user_id` / `user_token`, then opens Link in update mode against the selected products. See [Update Mode](#update-mode).

Other Link-card settings:

- **Include phone_number**: adds `user.phone_number` (E.164) to `/link/token/create` configs.
- **Always call /user/create first**: forces a `/user/create` step on every flow, even non-CRA.

### Advanced

- **Use ALT_PLAID_CLIENT_ID**: uses `ALT_PLAID_CLIENT_ID` + `ALT_PLAID_SECRET` for the session.
- **Use legacy user_token**: Switches between modern `user_id`/`identity` and legacy `user_token`/`consumer_report_user_identity` for `/user/create` calls.
- **Auto-remove items & users** (default on): when you finish and return to the menu, automatically calls `/item/remove` (non-CRA) or `/user/remove` (CRA/hybrid). When off, deletion is skipped.

## Webhooks

Several features (CRA products, Upgrade Mode, Hosted Link, Multi-item Link, Layer) require a webhook URL. Set your **Webhook URL** in Settings to a publicly reachable endpoint that can receive Plaid webhooks; buttons that need one will be disabled in the wizard until it's set. For Hosted Link, the app prompts you to paste the `SESSION_FINISHED` webhook payload before continuing; for CRA flows, you wait for `USER_CHECK_REPORT_READY` out-of-band and click proceed on the product API preview when it arrives.

## Testing

```bash
npm test            # Run all tests
npm run test:watch  # Re-run on file changes
```

Tests cover library utilities, API routes, and React components. All Plaid API calls are mocked — no credentials needed to run tests. See **[TESTING.md](TESTING.md)** for the full guide, including how to write tests for new routes and components.

## Troubleshooting

### Webhook-dependent features are not working

- Confirm you have set a **Webhook URL** in the Settings modal.
- Confirm the Link token config includes a `webhook` URL (the UI preview should show it).
- Confirm your webhook endpoint is publicly reachable and can receive Plaid webhooks.

### Hosted Link doesn't open

- Some browsers block popups; try the UI's "Open Hosted Link" button if present.

### ALT credentials toggle is disabled

- Ensure both `ALT_PLAID_CLIENT_ID` and `ALT_PLAID_SECRET` are set.

## Resources

- Plaid docs: `https://plaid.com/docs/`
- Sandbox test credentials: `https://plaid.com/docs/sandbox/test-credentials/`

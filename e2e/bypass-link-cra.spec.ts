import { test, expect } from '@playwright/test';
import {
  dismissWelcome,
  enableBypassLink,
  selectProduct,
  clickForward,
  waitForHeading,
  waitForSuccess,
  waitForProcessing,
} from './helpers/app';

/**
 * CRA Bypass Link flow:
 * 1. Select CRA product (triggers /user/create preview automatically)
 * 2. Preview /user/create config -> proceed (creates user)
 * 3. Preview /sandbox/public_token/create config -> proceed (creates sandbox item)
 * 4. Wait for the CRA report to become ready (~10 s in Sandbox)
 * 5. Preview product API config (with user_id) -> proceed (calls CRA endpoint)
 * 6. Success screen with CRA report data
 */
const CRA_REPORT_READY_WAIT_MS = 15_000;

async function runCraBypassFlow(
  page: import('@playwright/test').Page,
  productPath: string[],
  expectedApiTitle: string,
) {
  await selectProduct(page, productPath);

  // Step 1: Preview /user/create config
  await waitForHeading(page, /\/user\/create/);
  await clickForward(page);

  // Wait for user creation
  await waitForProcessing(page);

  // Step 2: Preview /sandbox/public_token/create config
  await waitForHeading(page, /sandbox\/public_token\/create/);
  await clickForward(page);

  // Wait for sandbox item creation
  await waitForProcessing(page);

  // Step 3: Preview product API config
  await waitForHeading(page, new RegExp(expectedApiTitle.replace(/\//g, '\\/')));

  // Let the CRA report become ready before firing the /get call
  await page.waitForTimeout(CRA_REPORT_READY_WAIT_MS);
  await clickForward(page);

  // Wait for product API call
  await waitForProcessing(page);

  // Step 4: Success
  await waitForSuccess(page);
  await waitForHeading(page, /Response/);
}

test.describe('Bypass Link — CRA Products', () => {
  // CRA products require ALT_PLAID_CLIENT_ID (uses user_id + current /user/create
  // params; primary client ID uses the legacy user_token flow).
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await dismissWelcome(page);
    await enableBypassLink(page, {
      webhookUrl: 'https://example.com/webhook',
      useAltCredentials: true,
    });
  });

  test('Base Report → /cra/check_report/base_report/get', async ({ page }) => {
    await runCraBypassFlow(page, ['CRA', 'Base Report'], '/cra/check_report/base_report/get');
  });

  // Cashflow Insights requires cra_options.cashflow_insights.attributes_version
  // which is a Link token param (additionalLinkParams) not supported by
  // /sandbox/public_token/create, so it can't work in Bypass Link mode.
  test.skip('Cashflow Insights → /cra/check_report/cashflow_insights/get', async ({ page }) => {
    await runCraBypassFlow(
      page,
      ['CRA', 'Underwriting', 'Cashflow Insights'],
      '/cra/check_report/cashflow_insights/get',
    );
  });

  test('Income Insights → /cra/check_report/income_insights/get', async ({ page }) => {
    await runCraBypassFlow(
      page,
      ['CRA', 'Income', 'Income Insights'],
      '/cra/check_report/income_insights/get',
    );
  });
});

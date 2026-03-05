import { type Page, expect } from '@playwright/test';

/**
 * Waits for the welcome animation to finish and clicks "Let's Go" to open
 * the product selector modal. Returns once the product grid is visible.
 */
export async function dismissWelcome(page: Page) {
  const letsGo = page.getByRole('button', { name: /Let.*s Go/i });
  await expect(letsGo).toBeVisible({ timeout: 15_000 });
  await letsGo.click();
  await expect(page.locator('.product-grid').first()).toBeVisible({ timeout: 10_000 });
}

/**
 * Opens Settings (gear icon inside the product selector), navigates to the
 * Link tab, enables Bypass Link, optionally sets a webhook URL and/or
 * switches to ALT credentials, then saves.
 * The product modal must already be open (call dismissWelcome first).
 */
export async function enableBypassLink(page: Page, options?: {
  webhookUrl?: string;
  useAltCredentials?: boolean;
}) {
  // The gear button lives inside ProductSelector; use the <button> element
  // (not the <a> docs link that also has this class inside the settings modal).
  const gearBtn = page.locator('button.settings-gear-button').first();
  await expect(gearBtn).toBeVisible({ timeout: 5_000 });
  await gearBtn.click();

  // Wait for the settings modal to become visible (opacity transitions).
  const settingsModal = page.locator('.modal-visible .settings-modal');
  await expect(settingsModal).toBeVisible({ timeout: 5_000 });

  // Switch to the Link tab and enable Bypass Link
  await page.getByRole('tab', { name: 'Link' }).click();
  const bypassRow = page.locator('.settings-toggle-row').filter({ hasText: 'Bypass Link' });
  await expect(bypassRow).toBeVisible({ timeout: 3_000 });
  const alreadyChecked = await bypassRow.locator('.settings-toggle.checked').count();
  if (!alreadyChecked) {
    await bypassRow.click();
  }

  // Optionally switch to ALT_PLAID_CLIENT_ID via the Advanced tab
  if (options?.useAltCredentials) {
    await page.getByRole('tab', { name: 'Advanced' }).click();
    const altRow = page.locator('.settings-toggle-row').filter({ hasText: 'Use ALT_PLAID_CLIENT_ID' });
    await expect(altRow).toBeVisible({ timeout: 3_000 });
    const altAlreadyChecked = await altRow.locator('.settings-toggle.checked').count();
    if (!altAlreadyChecked) {
      await altRow.click();
    }
  }

  // Optionally fill webhook URL (always visible at bottom of settings modal)
  if (options?.webhookUrl) {
    await page.locator('.settings-webhook-url-input').fill(options.webhookUrl);
  }

  // Save and wait for modal to close
  await settingsModal.getByRole('button', { name: 'Save' }).click();
  await expect(settingsModal).not.toBeVisible({ timeout: 5_000 });
}

/**
 * Clicks through the product hierarchy to select a leaf product.
 * Accepts an array of display names from root to leaf, matching the
 * shortName shown on the product cards (e.g. ['Payments', 'Auth']).
 * Only targets cards inside the currently visible modal.
 */
export async function selectProduct(page: Page, path: string[]) {
  for (const name of path) {
    const card = page
      .locator('.modal-visible .product-card')
      .filter({ has: page.locator('.product-card-name', { hasText: name }) })
      .first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.click();
  }
}

/**
 * Clicks the forward (blue) ArrowButton to proceed to the next step.
 */
export async function clickForward(page: Page) {
  const btn = page.locator('.arrow-button-blue.arrow-button-forward').first();
  await expect(btn).toBeVisible({ timeout: 10_000 });
  await expect(btn).toBeEnabled();
  await btn.click();
}

/**
 * Waits for a heading with the given text to appear inside a visible modal.
 */
export async function waitForHeading(page: Page, text: string | RegExp) {
  await expect(
    page.locator('.modal-visible h2', { hasText: text }).first()
  ).toBeVisible({ timeout: 30_000 });
}

/**
 * Waits for the success icon (checkmark) to appear.
 */
export async function waitForSuccess(page: Page) {
  await expect(
    page.locator('.success-icon').first()
  ).toBeVisible({ timeout: 30_000 });
}

/**
 * Waits for the app to finish loading/processing (spinner disappears).
 */
export async function waitForProcessing(page: Page) {
  const spinner = page.locator('.spinner');
  if (await spinner.isVisible()) {
    await expect(spinner).not.toBeVisible({ timeout: 30_000 });
  }
}

/**
 * Returns to the product menu by clicking the back arrow.
 */
export async function returnToMenu(page: Page) {
  const backBtn = page.locator('.arrow-button-red.arrow-button-back').first();
  if (await backBtn.isVisible()) {
    await backBtn.click();
  }
  await expect(page.locator('.product-grid').first()).toBeVisible({ timeout: 10_000 });
}

/**
 * Full non-CRA Bypass Link flow: select product, proceed through sandbox config,
 * wait for accounts and product API, verify success.
 *
 * @param waitBeforeApiMs - optional delay (ms) before clicking forward on the
 *   product API preview. Some Sandbox products (e.g. Transactions) need a few
 *   seconds before data is available.
 */
export async function runNonCraBypassFlow(
  page: Page,
  productPath: string[],
  expectedApiTitle: string,
  waitBeforeApiMs = 0,
) {
  await selectProduct(page, productPath);

  // Preview sandbox config (/sandbox/public_token/create)
  await waitForHeading(page, /sandbox\/public_token\/create/);
  await clickForward(page);

  // Wait for sandbox item creation + token exchange + accounts fetch
  await waitForProcessing(page);

  // Accounts data screen
  await waitForSuccess(page);
  await waitForHeading(page, /accounts\/get/i);
  await clickForward(page);

  // Product API preview
  await waitForHeading(page, new RegExp(expectedApiTitle.replace(/\//g, '\\/')));
  if (waitBeforeApiMs > 0) {
    await page.waitForTimeout(waitBeforeApiMs);
  }
  await clickForward(page);

  // Wait for product API call
  await waitForProcessing(page);

  // Success screen
  await waitForSuccess(page);
  await waitForHeading(page, /Response/);
}

/**
 * Extracts the user_id from the /user/create preview modal's displayed JSON.
 */
export async function extractUserIdFromPreview(page: Page): Promise<string> {
  const jsonContent = page.locator('.modal-visible .account-data').first();
  const text = await jsonContent.textContent();
  const match = text?.match(/"user_id"\s*:\s*"(user_[^"]+)"/);
  if (!match) {
    throw new Error('Could not extract user_id from user create preview');
  }
  return match[1];
}

import { test, expect } from '@playwright/test';
import { dismissWelcome, enableBypassLink, runNonCraBypassFlow, returnToMenu } from './helpers/app';

test.describe('Bypass Link — Non-CRA Products', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await dismissWelcome(page);
    await enableBypassLink(page);
  });

  test('Auth → /auth/get', async ({ page }) => {
    await runNonCraBypassFlow(page, ['Payments', 'Auth'], '/auth/get');
  });

  test('Signal Evaluate → /signal/evaluate', async ({ page }) => {
    await runNonCraBypassFlow(page, ['Payments', 'Signal', 'Evaluate'], '/signal/evaluate');
  });

  test('Identity Get → /identity/get', async ({ page }) => {
    await runNonCraBypassFlow(page, ['Payments', 'Identity', 'Get'], '/identity/get');
  });

  test('Investments Move → /investments/auth/get', async ({ page }) => {
    await runNonCraBypassFlow(page, ['Payments', 'Investments Move'], '/investments/auth/get');
  });

  test('Transactions Get → /transactions/get', async ({ page }) => {
    await runNonCraBypassFlow(page, ['Personal Finance', 'Transactions', 'Get'], '/transactions/get', 5_000);
  });

  test('Investments Holdings → /investments/holdings/get', async ({ page }) => {
    await runNonCraBypassFlow(page, ['Personal Finance', 'Investments', 'Holdings'], '/investments/holdings/get');
  });

  test('Liabilities → /liabilities/get', async ({ page }) => {
    await runNonCraBypassFlow(page, ['Personal Finance', 'Liabilities'], '/liabilities/get');
  });
});

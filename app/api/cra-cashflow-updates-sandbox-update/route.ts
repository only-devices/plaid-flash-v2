import { NextRequest } from 'next/server';
import { applyUserIdOrToken, proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { user_id, user_token, webhook_codes, ...rest } = (await request.json()) || {};
  const body: Record<string, unknown> = {
    webhook_codes:
      Array.isArray(webhook_codes) && webhook_codes.length > 0
        ? webhook_codes
        : ['LARGE_DEPOSIT_DETECTED'],
    ...rest,
  };
  applyUserIdOrToken(body, user_id, user_token);
  return proxyPlaidJson(request, '/sandbox/cra/cashflow_updates/update', body);
}

import { NextRequest } from 'next/server';
import { applyUserIdOrToken, proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { user_id, user_token, ...rest } = (await request.json()) || {};
  // Apply default consumer_report_permissible_purpose only when the caller
  // didn't provide one (so editor overrides are honored).
  const body: Record<string, unknown> = {
    consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT',
    ...rest,
  };
  applyUserIdOrToken(body, user_id, user_token);
  return proxyPlaidJson(request, '/cra/monitoring_insights/get', body);
}

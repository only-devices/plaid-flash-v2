import { NextRequest } from 'next/server';
import { applyUserIdOrToken, proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { user_id, user_token, consumer_report_permissible_purpose } = await request.json();
  const body: Record<string, unknown> = {
    consumer_report_permissible_purpose:
      consumer_report_permissible_purpose || 'ACCOUNT_REVIEW_CREDIT',
  };
  applyUserIdOrToken(body, user_id, user_token);
  return proxyPlaidJson(request, '/cra/monitoring_insights/get', body);
}

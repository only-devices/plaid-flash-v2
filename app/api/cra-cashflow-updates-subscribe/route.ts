import { NextRequest } from 'next/server';
import { applyUserIdOrToken, proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { user_id, user_token, item_id, webhook } = await request.json();
  const body: Record<string, unknown> = {};
  if (item_id) body.item_id = item_id;
  if (webhook) body.webhook = webhook;
  applyUserIdOrToken(body, user_id, user_token);
  return proxyPlaidJson(request, '/cra/monitoring_insights/subscribe', body);
}

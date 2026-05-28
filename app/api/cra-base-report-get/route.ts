import { NextRequest } from 'next/server';
import { applyUserIdOrToken, proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { user_id, user_token, ...rest } = (await request.json()) || {};
  const body: Record<string, unknown> = { ...rest };
  applyUserIdOrToken(body, user_id, user_token);
  return proxyPlaidJson(request, '/cra/check_report/base_report/get', body);
}

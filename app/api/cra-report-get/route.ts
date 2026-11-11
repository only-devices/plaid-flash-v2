import { NextRequest } from 'next/server';
import { proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { user_id, user_token: _userToken, ...rest } = (await request.json()) || {};
  const body: Record<string, unknown> = { ...rest };
  if (user_id) body.user_id = user_id;
  return proxyPlaidJson(request, '/cra/report/get', body);
}

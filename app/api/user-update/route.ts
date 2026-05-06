import { NextRequest } from 'next/server';
import { proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { user_id, identity } = (await request.json()) || {};
  return proxyPlaidJson(request, '/user/update', { user_id, identity });
}

import { NextRequest } from 'next/server';
import { proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const incoming = (await request.json()) || {};
  // Plaid requires a `user` object; default to empty if the caller omitted it.
  const body: Record<string, unknown> = {
    user: {},
    ...incoming,
  };
  return proxyPlaidJson(request, '/identity/match', body);
}

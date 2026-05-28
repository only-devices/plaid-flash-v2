import { NextRequest } from 'next/server';
import { proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { investments_auth, ...rest } = (await request.json()) || {};
  // Backwards-compat: callers historically passed `investments_auth`, which
  // Plaid expects under `options`. Honor an existing `options` if provided.
  const body: Record<string, unknown> = { ...rest };
  if (investments_auth && body.options == null) {
    body.options = investments_auth;
  }
  return proxyPlaidJson(request, '/investments/auth/get', body);
}

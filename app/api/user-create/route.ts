import { NextRequest } from 'next/server';
import { proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  // `useLegacyUserToken` is a UI-only flag (selects which Plaid identity field
  // the wizard sends); strip it before forwarding to Plaid.
  const { useLegacyUserToken: _ignored, ...userCreateParams } = await request.json();
  return proxyPlaidJson(request, '/user/create', userCreateParams);
}

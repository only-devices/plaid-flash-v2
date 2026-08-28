import { NextRequest } from 'next/server';
import { proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  // `useLegacyUserToken` is a UI-only flag (selects which Plaid identity field
  // the wizard sends). Strip it and any pasted client_id/secret before
  // forwarding; the proxy injects the active env credentials.
  const {
    useLegacyUserToken: _ignored,
    client_id: _clientId,
    secret: _secret,
    ...userCreateParams
  } = await request.json();
  return proxyPlaidJson(request, '/user/create', userCreateParams);
}

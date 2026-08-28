import { NextRequest } from 'next/server';
import { proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  // Forward the editor payload verbatim. Strip client_id/secret so they
  // cannot override the server-injected credentials.
  const raw = (await request.json()) || {};
  const { client_id: _clientId, secret: _secret, ...body } = raw;

  return proxyPlaidJson(request, '/session/token/create', body, {
    transformOk: (data) => ({ link_token: data?.link?.link_token || data?.link_token }),
  });
}

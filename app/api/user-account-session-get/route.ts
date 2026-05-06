import { NextRequest } from 'next/server';
import { proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { public_token } = (await request.json()) || {};
  return proxyPlaidJson(
    request,
    '/user_account/session/get',
    { public_token },
    { credentialsIn: 'headers' }
  );
}

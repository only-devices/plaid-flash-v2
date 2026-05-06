import { NextRequest } from 'next/server';
import { createPlaidClient } from '@/lib/server/plaidCredentials';
import { withPlaidSdk } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { public_token } = await request.json();
  return withPlaidSdk(
    () => createPlaidClient(request).itemPublicTokenExchange({ public_token }),
    (response) => ({ access_token: response.access_token })
  );
}

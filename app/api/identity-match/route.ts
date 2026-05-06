import { NextRequest } from 'next/server';
import { createPlaidClient } from '@/lib/server/plaidCredentials';
import { withPlaidSdk } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { access_token, user } = await request.json();
  return withPlaidSdk(() =>
    createPlaidClient(request).identityMatch({ access_token, user: user || {} })
  );
}

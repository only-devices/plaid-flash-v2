import { NextRequest } from 'next/server';
import { createPlaidClient } from '@/lib/server/plaidCredentials';
import { withPlaidSdk } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { access_token } = await request.json();
  return withPlaidSdk(() => createPlaidClient(request).accountsBalanceGet({ access_token }));
}

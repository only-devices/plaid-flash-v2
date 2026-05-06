import { NextRequest } from 'next/server';
import { createPlaidClient } from '@/lib/server/plaidCredentials';
import { withPlaidSdk } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { access_token, investments_auth } = await request.json();
  const requestBody: any = { access_token };
  if (investments_auth) requestBody.options = investments_auth;
  return withPlaidSdk(() => createPlaidClient(request).investmentsAuthGet(requestBody));
}

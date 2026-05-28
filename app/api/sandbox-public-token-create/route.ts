import { NextRequest } from 'next/server';
import { applyUserIdOrToken, proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { user_id, user_token, institution_id, initial_products, ...rest } =
    (await request.json()) || {};

  const body: Record<string, unknown> = {
    institution_id: institution_id || 'ins_109511',
    initial_products: initial_products || ['auth'],
    ...rest,
  };
  applyUserIdOrToken(body, user_id, user_token);

  return proxyPlaidJson(request, '/sandbox/public_token/create', body, {
    transformOk: (data) => ({ public_token: data.public_token }),
  });
}

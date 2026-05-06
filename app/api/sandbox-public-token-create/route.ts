import { NextRequest } from 'next/server';
import { applyUserIdOrToken, proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { institution_id, initial_products, options, user_id, user_token } = await request.json();

  const body: Record<string, unknown> = {
    institution_id: institution_id || 'ins_109511',
    initial_products: initial_products || ['auth'],
  };
  if (options) body.options = options;
  applyUserIdOrToken(body, user_id, user_token);

  return proxyPlaidJson(request, '/sandbox/public_token/create', body, {
    transformOk: (data) => ({ public_token: data.public_token }),
  });
}

import { NextRequest } from 'next/server';
import { proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { template_id, user, user_id, webhook } = (await request.json()) || {};
  const client_user_id = (user as any)?.client_user_id;

  const body: Record<string, unknown> = {
    ...(template_id ? { template_id } : {}),
    ...(client_user_id ? { user: { client_user_id } } : {}),
    ...(user_id ? { user_id } : {}),
    ...(webhook ? { webhook } : {}),
  };

  return proxyPlaidJson(request, '/session/token/create', body, {
    transformOk: (data) => ({ link_token: data?.link?.link_token || data?.link_token }),
  });
}

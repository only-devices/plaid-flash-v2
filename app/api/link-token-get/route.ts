import { NextRequest } from 'next/server';
import { proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { link_token } = await request.json();
  return proxyPlaidJson(request, '/link/token/get', { link_token });
}

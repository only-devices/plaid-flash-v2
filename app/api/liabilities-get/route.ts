import { NextRequest } from 'next/server';
import { proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const body = (await request.json()) || {};
  return proxyPlaidJson(request, '/liabilities/get', body);
}

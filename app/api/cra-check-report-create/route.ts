import { NextRequest } from 'next/server';
import { proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { days_requested, products, ...rest } = (await request.json()) || {};

  const body: Record<string, unknown> = {
    ...rest,
    days_requested:
      typeof days_requested === 'number' && Number.isFinite(days_requested) ? days_requested : 365,
  };
  if (Array.isArray(products) && products.length > 0) {
    body.products = products;
  }

  return proxyPlaidJson(request, '/cra/check_report/create', body);
}

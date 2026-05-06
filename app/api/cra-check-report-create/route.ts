import { NextRequest } from 'next/server';
import { proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const {
    user_id,
    webhook,
    days_requested,
    consumer_report_permissible_purpose,
    products,
  } = (await request.json()) || {};

  const body: Record<string, unknown> = {
    user_id,
    webhook,
    days_requested:
      typeof days_requested === 'number' && Number.isFinite(days_requested) ? days_requested : 365,
    consumer_report_permissible_purpose,
  };
  if (Array.isArray(products) && products.length > 0) {
    body.products = products;
  }

  return proxyPlaidJson(request, '/cra/check_report/create', body);
}

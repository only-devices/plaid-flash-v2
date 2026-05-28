import { NextRequest } from 'next/server';
import { proxyPlaidJson } from '@/lib/server/plaidApi';

const formatDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export async function POST(request: NextRequest) {
  const incoming = (await request.json()) || {};
  // Default to the last 30 days when no range is provided.
  const today = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const body: Record<string, unknown> = {
    start_date: formatDate(thirtyDaysAgo),
    end_date: formatDate(today),
    ...incoming,
  };
  return proxyPlaidJson(request, '/investments/transactions/get', body);
}

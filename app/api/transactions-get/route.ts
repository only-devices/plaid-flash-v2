import { NextRequest } from 'next/server';
import { createPlaidClient } from '@/lib/server/plaidCredentials';
import { withPlaidSdk } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { access_token, start_date, end_date } = await request.json();
  // Default to the last 15 days when no range is provided.
  const startDateObj = start_date
    ? new Date(start_date)
    : new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  const endDateObj = end_date ? new Date(end_date) : new Date();
  return withPlaidSdk(() =>
    createPlaidClient(request).transactionsGet({
      access_token,
      start_date: startDateObj,
      end_date: endDateObj,
    })
  );
}

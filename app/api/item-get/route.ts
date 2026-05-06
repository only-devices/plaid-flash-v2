import { NextRequest } from 'next/server';
import { createPlaidClient } from '@/lib/server/plaidCredentials';
import { withPlaidSdk } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { access_token } = await request.json();
  return withPlaidSdk(
    () => createPlaidClient(request).itemGet({ access_token }),
    (response) => ({
      item_id: response.item?.item_id,
      institution_id: response.item?.institution_id,
      item: response.item,
      request_id: response.request_id,
    })
  );
}

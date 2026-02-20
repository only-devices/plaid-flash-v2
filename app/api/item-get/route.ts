import { NextRequest, NextResponse } from 'next/server';
import { createPlaidClient } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json({ error: 'access_token is required' }, { status: 400 });
    }

    const plaid = createPlaidClient(request);

    const response = await plaid.itemGet({ access_token });

    return NextResponse.json({
      item_id: response.item?.item_id,
      institution_id: response.item?.institution_id,
      item: response.item,
      request_id: response.request_id,
    });
  } catch (error: any) {
    console.error('Error fetching item:', error);

    if (error.response) {
      const errorBody = await error.response.json().catch(() => ({
        error: error.message || 'Failed to fetch item',
      }));
      return NextResponse.json(errorBody, { status: error.response.status });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch item' },
      { status: 500 }
    );
  }
}


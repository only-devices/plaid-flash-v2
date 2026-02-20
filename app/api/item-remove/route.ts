import { NextRequest, NextResponse } from 'next/server';
import { createPlaidClient } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { error: 'access_token is required' },
        { status: 400 }
      );
    }

    const plaid = createPlaidClient(request);

    await plaid.itemRemove({
      access_token: access_token,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove item' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getPlaidKeys } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { public_token } = body || {};

    const { clientId, secret } = getPlaidKeys(request);

    const response = await fetch(`https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com/user_account/session/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': clientId || '',
        'PLAID-SECRET': secret || '',
      },
      body: JSON.stringify({ public_token }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error calling user_account/session/get:', error);
    return NextResponse.json(
      { error_message: error.message || 'Failed to get user account session' },
      { status: 500 }
    );
  }
}


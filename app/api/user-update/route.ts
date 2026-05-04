import { NextRequest, NextResponse } from 'next/server';
import { getPlaidKeys } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, identity } = body || {};

    const { clientId, secret } = getPlaidKeys(request);

    const requestBody = {
      client_id: clientId,
      secret,
      user_id,
      identity,
    };

    const response = await fetch(`https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com/user/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error calling user/update:', error);
    return NextResponse.json(
      { error_message: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getPlaidKeys } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const { user_id, user_token, webhook_codes } = await request.json();
    const { clientId, secret } = getPlaidKeys(request);

    const requestBody: any = {
      client_id: clientId,
      secret: secret,
      webhook_codes: Array.isArray(webhook_codes) && webhook_codes.length > 0 ? webhook_codes : ['LARGE_DEPOSIT_DETECTED'],
    };

    if (user_id) {
      requestBody.user_id = user_id;
    } else if (user_token) {
      requestBody.user_token = user_token;
    } else {
      return NextResponse.json({ error: 'Either user_id or user_token is required' }, { status: 400 });
    }

    const response = await fetch(
      `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com/sandbox/cra/cashflow_updates/update`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error triggering CRA cashflow updates sandbox webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to trigger CRA cashflow updates sandbox webhook' },
      { status: 500 }
    );
  }
}


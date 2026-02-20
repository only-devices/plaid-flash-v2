import { NextRequest, NextResponse } from 'next/server';
import { getPlaidKeys } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const { user_id, user_token } = await request.json();

    if (!user_id && !user_token) {
      return NextResponse.json(
        { error: 'Either user_id or user_token is required' },
        { status: 400 }
      );
    }

    const { clientId, secret } = getPlaidKeys(request);

    const requestBody: any = {
      client_id: clientId,
      secret: secret,
    };

    if (user_id) requestBody.user_id = user_id;
    if (!user_id && user_token) requestBody.user_token = user_token;

    const response = await fetch(
      `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com/user/remove`,
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
      console.log('Plaid error response:', JSON.stringify(data, null, 2));
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error removing user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove user' },
      { status: 500 }
    );
  }
}


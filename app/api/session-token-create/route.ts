import { NextRequest, NextResponse } from 'next/server';
import { getPlaidKeys } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template_id, user, user_id, webhook } = body || {};

    const { clientId, secret } = getPlaidKeys(request);

    const client_user_id = (user as any)?.client_user_id;

    const requestBody: any = {
      client_id: clientId,
      secret,
      ...(template_id ? { template_id } : {}),
      ...(client_user_id ? { user: { client_user_id } } : {}),
      ...(user_id ? { user_id } : {}),
      ...(webhook ? { webhook } : {}),
    };

    const response = await fetch(`https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com/session/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    const link_token = data?.link?.link_token || data?.link_token;
    return NextResponse.json({ link_token });
  } catch (error: any) {
    console.error('Error creating session token:', error);
    return NextResponse.json(
      { error_message: error.message || 'Failed to create session token' },
      { status: 500 }
    );
  }
}


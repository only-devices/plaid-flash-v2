import { NextRequest, NextResponse } from 'next/server';
import { getPlaidKeys } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template_id, user, user_id, webhook } = body || {};

    if (!template_id || typeof template_id !== 'string') {
      return NextResponse.json(
        { error_code: 'INVALID_REQUEST', error_message: 'template_id is required' },
        { status: 400 }
      );
    }

    if (!user || typeof user !== 'object') {
      return NextResponse.json(
        { error_code: 'INVALID_REQUEST', error_message: 'user is required' },
        { status: 400 }
      );
    }

    const { clientId, secret } = getPlaidKeys(request);

    const client_user_id = (user as any)?.client_user_id;
    if (!client_user_id || typeof client_user_id !== 'string') {
      return NextResponse.json(
        { error_code: 'INVALID_REQUEST', error_message: 'user.client_user_id is required' },
        { status: 400 }
      );
    }

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { error_code: 'INVALID_REQUEST', error_message: 'user_id is required' },
        { status: 400 }
      );
    }

    const requestBody: any = {
      client_id: clientId,
      secret,
      template_id,
      user: { client_user_id },
      user_id,
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
    if (!link_token || typeof link_token !== 'string') {
      return NextResponse.json(
        {
          error_code: 'INVALID_RESPONSE',
          error_message: 'Plaid did not return link.link_token from /session/token/create',
          raw: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ link_token });
  } catch (error: any) {
    console.error('Error creating session token:', error);
    return NextResponse.json(
      {
        error_code: 'INTERNAL_SERVER_ERROR',
        error_message: error.message || 'Failed to create session token',
        display_message: 'Unable to create session token. Please try again.',
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, identity, useAltCredentials } = body || {};

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { error_code: 'INVALID_REQUEST', error_message: 'user_id is required' },
        { status: 400 }
      );
    }

    if (!identity || typeof identity !== 'object') {
      return NextResponse.json(
        { error_code: 'INVALID_REQUEST', error_message: 'identity is required' },
        { status: 400 }
      );
    }

    // Select credentials based on flag
    const clientId =
      useAltCredentials && process.env.ALT_PLAID_CLIENT_ID
        ? process.env.ALT_PLAID_CLIENT_ID
        : process.env.PLAID_CLIENT_ID;
    const secret =
      useAltCredentials && process.env.ALT_PLAID_SECRET ? process.env.ALT_PLAID_SECRET : process.env.PLAID_SECRET;

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
      {
        error_code: 'INTERNAL_SERVER_ERROR',
        error_message: error.message || 'Failed to update user',
        display_message: 'Unable to update user identity. Please try again.',
      },
      { status: 500 }
    );
  }
}


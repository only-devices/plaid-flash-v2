import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { public_token, useAltCredentials } = body || {};

    if (!public_token || typeof public_token !== 'string') {
      return NextResponse.json(
        { error_code: 'INVALID_REQUEST', error_message: 'public_token is required' },
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
      {
        error_code: 'INTERNAL_SERVER_ERROR',
        error_message: error.message || 'Failed to get user account session',
        display_message: 'Unable to fetch Layer session data. Please try again.',
      },
      { status: 500 }
    );
  }
}


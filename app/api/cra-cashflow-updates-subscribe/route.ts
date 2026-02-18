import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { user_id, user_token, item_id, webhook, useAltCredentials } = await request.json();

    if (!item_id) {
      return NextResponse.json({ error: 'item_id is required' }, { status: 400 });
    }

    if (!webhook) {
      return NextResponse.json({ error: 'webhook is required' }, { status: 400 });
    }

    // Select credentials based on flag
    const clientId =
      useAltCredentials && process.env.ALT_PLAID_CLIENT_ID
        ? process.env.ALT_PLAID_CLIENT_ID
        : process.env.PLAID_CLIENT_ID;
    const secret =
      useAltCredentials && process.env.ALT_PLAID_SECRET
        ? process.env.ALT_PLAID_SECRET
        : process.env.PLAID_SECRET;

    const requestBody: any = {
      client_id: clientId,
      secret: secret,
      item_id,
      webhook,
    };

    if (user_id) {
      requestBody.user_id = user_id;
    } else if (user_token) {
      requestBody.user_token = user_token;
    } else {
      return NextResponse.json({ error: 'Either user_id or user_token is required' }, { status: 400 });
    }

    const response = await fetch(`https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com/cra/monitoring_insights/subscribe`, {
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

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error subscribing to CRA cashflow updates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to subscribe to CRA cashflow updates' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getPlaidKeys } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const { user_id, user_token, item_id, webhook } = await request.json();

    const { clientId, secret } = getPlaidKeys(request);

    const requestBody: any = {
      client_id: clientId,
      secret: secret,
    };

    if (item_id) requestBody.item_id = item_id;
    if (webhook) requestBody.webhook = webhook;
    if (user_id) requestBody.user_id = user_id;
    if (user_token) requestBody.user_token = user_token;

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


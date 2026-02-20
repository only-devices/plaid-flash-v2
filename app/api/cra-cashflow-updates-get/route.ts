import { NextRequest, NextResponse } from 'next/server';
import { getPlaidKeys } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const { user_id, user_token, consumer_report_permissible_purpose } = await request.json();
    const { clientId, secret } = getPlaidKeys(request);

    // CRA Monitoring Insights uses user_id (new) or user_token (legacy)
    const requestBody: any = {
      client_id: clientId,
      secret: secret,
      consumer_report_permissible_purpose: consumer_report_permissible_purpose || 'ACCOUNT_REVIEW_CREDIT',
    };
    
    if (user_id) {
      requestBody.user_id = user_id;
    } else if (user_token) {
      requestBody.user_token = user_token;
    } else {
      return NextResponse.json(
        { error: 'Either user_id or user_token is required' },
        { status: 400 }
      );
    }

    // Make direct fetch call to bypass plaid-fetch's field stripping
    // (plaid-fetch v1.0.2 doesn't support user_id)
    const response = await fetch(
      `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com/cra/monitoring_insights/get`,
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
    console.error('Error getting CRA cashflow updates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get CRA cashflow updates' },
      { status: 500 }
    );
  }
}

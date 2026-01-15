import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { user_id, user_token, useAltCredentials } = await request.json();

    // Select credentials based on flag
    const clientId = useAltCredentials && process.env.ALT_PLAID_CLIENT_ID 
      ? process.env.ALT_PLAID_CLIENT_ID 
      : process.env.PLAID_CLIENT_ID;
    const secret = useAltCredentials && process.env.ALT_PLAID_SECRET 
      ? process.env.ALT_PLAID_SECRET 
      : process.env.PLAID_SECRET;

    // CRA Income Insights uses user_id (new) or user_token (legacy)
    const requestBody: any = {
      client_id: clientId,
      secret: secret,
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

    // Log the request for debugging
    console.log('[CRA Income Insights] Request:', JSON.stringify({ ...requestBody, secret: '[REDACTED]' }));

    // Make direct fetch call to bypass plaid-fetch's field stripping
    // (plaid-fetch v1.0.2 doesn't support user_id)
    const response = await fetch(
      `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com/cra/check_report/income_insights/get`,
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
      console.error('[CRA Income Insights] Error response:', data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('[CRA Income Insights] Success! Response received.');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error getting CRA income insights:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get CRA income insights' },
      { status: 500 }
    );
  }
}

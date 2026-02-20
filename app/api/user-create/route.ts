import { NextRequest, NextResponse } from 'next/server';
import { getPlaidKeys } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { useLegacyUserToken, ...userCreateParams } = body;

    // The request body should contain either:
    // - identity (for new user_id flow)
    // - consumer_report_user_identity (for legacy user_token flow)
    // Plus client_user_id which is always required

    const { clientId, secret } = getPlaidKeys(request);

    const requestBody = {
      client_id: clientId,
      secret: secret,
      ...userCreateParams,
    };

    // Make direct fetch call to bypass plaid-fetch's field stripping
    // (plaid-fetch v1.0.2 doesn't support the 'identity' field in UserCreateRequest)
    const response = await fetch(
      `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com/user/create`,
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

    // Return the full response which includes user_id (and user_token for legacy)
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

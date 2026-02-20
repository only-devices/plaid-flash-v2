import { NextRequest, NextResponse } from 'next/server';
import { getPlaidKeys } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const { user_id, user_token } = await request.json();
    const { clientId, secret } = getPlaidKeys(request);

    // CRA Base Report uses user_id (new) or user_token (legacy)
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

    // Make direct fetch call to bypass plaid-fetch's field stripping
    // (plaid-fetch v1.0.2 doesn't support user_id in BaseReportGetRequest)
    const response = await fetch(
      `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com/cra/check_report/base_report/get`,
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
      console.error('Error getting CRA base report:', data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error getting CRA base report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get CRA base report' },
      { status: 500 }
    );
  }
}

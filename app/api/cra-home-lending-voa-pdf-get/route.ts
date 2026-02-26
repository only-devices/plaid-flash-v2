import { NextRequest, NextResponse } from 'next/server';
import { getPlaidKeys } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const { user_id, user_token } = await request.json();
    const { clientId, secret } = getPlaidKeys(request);

    const requestBody: any = {
      client_id: clientId,
      secret: secret,
      report_requested: 'voa',
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

    const response = await fetch(
      `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com/cra/check_report/verification/pdf/get`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(data, { status: response.status });
      }
      return NextResponse.json(data);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to get CRA Home Lending VOA PDF' },
        { status: response.status }
      );
    }
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return NextResponse.json({ pdf: base64 });
  } catch (error: any) {
    console.error('Error getting CRA Home Lending VOA PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get CRA Home Lending VOA PDF' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getPlaidKeys } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const { link_token } = await request.json();

    const { clientId, secret } = getPlaidKeys(request);

    const response = await fetch(
      `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com/link/token/get`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          secret,
          link_token,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching link token details:', error);
    return NextResponse.json(
      { error_message: error.message || 'Failed to get link token details' },
      { status: 500 }
    );
  }
}

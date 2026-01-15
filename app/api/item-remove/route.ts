import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi } from 'plaid-fetch';

export async function POST(request: NextRequest) {
  try {
    const { access_token, useAltCredentials } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { error: 'access_token is required' },
        { status: 400 }
      );
    }

    // Select credentials based on flag
    const clientId = useAltCredentials && process.env.ALT_PLAID_CLIENT_ID 
      ? process.env.ALT_PLAID_CLIENT_ID 
      : process.env.PLAID_CLIENT_ID;
    const secret = useAltCredentials && process.env.ALT_PLAID_SECRET 
      ? process.env.ALT_PLAID_SECRET 
      : process.env.PLAID_SECRET;

    const configuration = new Configuration({
      basePath: `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com`,
      headers: {
        'PLAID-CLIENT-ID': clientId!,
        'PLAID-SECRET': secret!,
      },
    });

    const plaid = new PlaidApi(configuration);

    await plaid.itemRemove({
      access_token: access_token,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove item' },
      { status: 500 }
    );
  }
}


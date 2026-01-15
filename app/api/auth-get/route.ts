import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi } from 'plaid-fetch';

export async function POST(request: NextRequest) {
  try {
    const { access_token, useAltCredentials } = await request.json();

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

    const response = await plaid.authGet({
      access_token: access_token,
    });

    // Note: plaid-fetch returns data directly (no .data property)
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error getting auth data:', error);
    
    // If it's a Plaid error with a response, return the Plaid error details
    if (error.response) {
      const errorBody = await error.response.json().catch(() => ({ 
        error: error.message || 'Failed to get auth data' 
      }));
      return NextResponse.json(errorBody, { status: error.response.status });
    }
    
    // Otherwise return generic error
    return NextResponse.json(
      { error: error.message || 'Failed to get auth data' },
      { status: 500 }
    );
  }
}


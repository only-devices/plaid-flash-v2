import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi } from 'plaid-fetch';

const configuration = new Configuration({
  basePath: `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com`,
  headers: {
    'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
    'PLAID-SECRET': process.env.PLAID_SECRET!,
  },
});

const plaid = new PlaidApi(configuration);

export async function POST(request: NextRequest) {
  try {
    const { public_token } = await request.json();

    const response = await plaid.itemPublicTokenExchange({
      public_token: public_token,
    });

    // Note: plaid-fetch returns data directly (no .data property)
    return NextResponse.json({ access_token: response.access_token });
  } catch (error: any) {
    console.error('Error exchanging public token:', error);
    
    // Extract Plaid error details if available
    if (error.response) {
      try {
        const errorBody = await error.response.json();
        return NextResponse.json(errorBody, { status: error.response.status });
      } catch (parseError) {
        return NextResponse.json(
          { 
            error_code: 'INTERNAL_SERVER_ERROR',
            error_message: error.message || 'Failed to exchange token',
            display_message: 'Unable to exchange token. Please try again.'
          },
          { status: error.response.status || 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error_code: 'INTERNAL_SERVER_ERROR',
        error_message: error.message || 'Failed to exchange token',
        display_message: 'Unable to exchange token. Please try again.'
      },
      { status: 500 }
    );
  }
}


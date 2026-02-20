import { NextRequest, NextResponse } from 'next/server';
import { createPlaidClient } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const { access_token, investments_auth } = await request.json();
    const plaid = createPlaidClient(request);

    const requestBody: any = {
      access_token: access_token,
    };

    // Add investments_auth options if provided
    if (investments_auth) {
      requestBody.options = investments_auth;
    }

    const response = await plaid.investmentsAuthGet(requestBody);

    // Note: plaid-fetch returns data directly (no .data property)
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error getting investments auth data:', error);
    
    // If it's a Plaid error with a response, return the Plaid error details
    if (error.response) {
      const errorBody = await error.response.json().catch(() => ({ 
        error: error.message || 'Failed to get investments auth data' 
      }));
      return NextResponse.json(errorBody, { status: error.response.status });
    }
    
    // Otherwise return generic error
    return NextResponse.json(
      { error: error.message || 'Failed to get investments auth data' },
      { status: 500 }
    );
  }
}

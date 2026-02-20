import { NextRequest, NextResponse } from 'next/server';
import { createPlaidClient } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();

    if (!access_token || typeof access_token !== 'string') {
      return NextResponse.json({ error: 'access_token is required' }, { status: 400 });
    }

    const plaid = createPlaidClient(request);

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


import { NextRequest, NextResponse } from 'next/server';
import { createPlaidClient } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const { access_token, cursor } = await request.json();

    const plaid = createPlaidClient(request);

    const response = await plaid.transactionsSync({
      access_token: access_token,
      ...(cursor && { cursor })
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error syncing transactions:', error);
    
    // If it's a Plaid error with a response, return the Plaid error details
    if (error.response) {
      const errorBody = await error.response.json().catch(() => ({ 
        error: error.message || 'Failed to sync transactions' 
      }));
      return NextResponse.json(errorBody, { status: error.response.status });
    }
    
    // Otherwise return generic error
    return NextResponse.json(
      { error: error.message || 'Failed to sync transactions' },
      { status: 500 }
    );
  }
}


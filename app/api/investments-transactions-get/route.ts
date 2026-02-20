import { NextRequest, NextResponse } from 'next/server';
import { createPlaidClient } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const { access_token, start_date, end_date } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { error: 'access_token is required' },
        { status: 400 }
      );
    }

    const plaid = createPlaidClient(request);

    // Convert string dates to Date objects for plaid-fetch
    const startDateObj = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDateObj = end_date ? new Date(end_date) : new Date();

    const response = await plaid.investmentsTransactionsGet({
      access_token: access_token,
      start_date: startDateObj,
      end_date: endDateObj
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error getting investments transactions:', error);
    
    // If it's a Plaid error with a response, return the Plaid error details
    if (error.response) {
      const errorBody = await error.response.json().catch(() => ({ 
        error: error.message || 'Failed to get investments transactions' 
      }));
      return NextResponse.json(errorBody, { status: error.response.status });
    }
    
    // Otherwise return generic error
    return NextResponse.json(
      { error: error.message || 'Failed to get investments transactions' },
      { status: 500 }
    );
  }
}


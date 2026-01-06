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
    const { access_token, client_transaction_id, amount } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { error: 'access_token is required' },
        { status: 400 }
      );
    }

    // Get accounts to use the first account_id
    const accountsResponse = await plaid.accountsGet({
      access_token: access_token,
    });

    const accountId = accountsResponse.accounts?.[0]?.account_id;
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'No accounts found for this item' },
        { status: 400 }
      );
    }

    const response = await plaid.signalEvaluate({
      access_token: access_token,
      account_id: accountId,
      client_transaction_id: client_transaction_id || `txn_${Date.now()}`,
      amount: amount || 100.00,
      ruleset_key: 'default'
    } as any);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error evaluating signal:', error);
    
    // If it's a Plaid error with a response, return the Plaid error details
    if (error.response) {
      const errorBody = await error.response.json().catch(() => ({ 
        error: error.message || 'Failed to evaluate signal' 
      }));
      return NextResponse.json(errorBody, { status: error.response.status });
    }
    
    // Otherwise return generic error
    return NextResponse.json(
      { error: error.message || 'Failed to evaluate signal' },
      { status: 500 }
    );
  }
}


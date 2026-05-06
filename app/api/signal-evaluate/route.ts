import { NextRequest } from 'next/server';
import { createPlaidClient } from '@/lib/server/plaidCredentials';
import { withPlaidSdk } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { access_token, amount } = await request.json();
  const plaid = createPlaidClient(request);

  return withPlaidSdk(async () => {
    // Signal evaluate requires an account_id. Pull the first account from the
    // Item so callers don't need to know one up front.
    const accountsResponse = await plaid.accountsGet({ access_token });
    const accountId = accountsResponse.accounts?.[0]?.account_id;

    return plaid.signalEvaluate({
      access_token,
      account_id: accountId,
      client_transaction_id: `flash_txn_${Date.now()}`,
      amount: amount || 100.0,
      ruleset_key: 'default',
    } as any);
  });
}

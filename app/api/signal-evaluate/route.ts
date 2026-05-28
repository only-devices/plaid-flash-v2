import { NextRequest } from 'next/server';
import { plaidJsonFetch, proxyPlaidJson } from '@/lib/server/plaidApi';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const incoming = (await request.json()) || {};
  // Sensible defaults; the editor (and `buildProductRequestBody` on the
  // client) already supplies these for the standard flow, but we keep
  // server-side fallbacks so direct/edited calls don't bounce on Plaid's
  // required-field validation.
  const body: Record<string, unknown> = {
    amount: 100.0,
    client_transaction_id: `flash_txn_${Date.now()}`,
    ruleset_key: 'default',
    ...incoming,
  };

  // If no account_id was provided, look one up from the Item so the user
  // doesn't have to hand-enter it.
  if (!body.account_id && typeof body.access_token === 'string' && body.access_token) {
    try {
      const { response, data } = await plaidJsonFetch(request, '/accounts/get', {
        access_token: body.access_token,
      });
      if (response.ok) {
        const firstAccount = data?.accounts?.[0]?.account_id;
        if (typeof firstAccount === 'string' && firstAccount.length > 0) {
          body.account_id = firstAccount;
        }
      } else {
        return NextResponse.json(data, { status: response.status });
      }
    } catch {
      // Fall through and let Plaid surface the missing-field error.
    }
  }

  return proxyPlaidJson(request, '/signal/evaluate', body);
}

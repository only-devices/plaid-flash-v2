import type { NextRequest } from 'next/server';
import { Configuration, PlaidApi } from 'plaid-fetch';

const COOKIE_NAME = 'plaid_flash_use_alt_credentials';

export function isAltCredentialsAvailable(): boolean {
  return !!(process.env.ALT_PLAID_CLIENT_ID && process.env.ALT_PLAID_SECRET);
}

export function getUseAltCredentialsFromRequest(request: NextRequest): boolean {
  if (!isAltCredentialsAvailable()) return false;
  const raw = request.cookies.get(COOKIE_NAME)?.value;
  return raw === '1' || raw === 'true';
}

export function getPlaidKeys(request: NextRequest): { clientId: string; secret: string } {
  const useAlt = getUseAltCredentialsFromRequest(request);
  const clientId =
    useAlt && process.env.ALT_PLAID_CLIENT_ID ? process.env.ALT_PLAID_CLIENT_ID : process.env.PLAID_CLIENT_ID;
  const secret = useAlt && process.env.ALT_PLAID_SECRET ? process.env.ALT_PLAID_SECRET : process.env.PLAID_SECRET;

  if (!clientId || !secret) {
    throw new Error('Plaid credentials are not configured');
  }
  return { clientId, secret };
}

export function createPlaidClient(request: NextRequest): PlaidApi {
  const { clientId, secret } = getPlaidKeys(request);
  const configuration = new Configuration({
    basePath: `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com`,
    headers: {
      'PLAID-CLIENT-ID': clientId,
      'PLAID-SECRET': secret,
    },
  });
  return new PlaidApi(configuration);
}


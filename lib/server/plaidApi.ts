import { NextRequest, NextResponse } from 'next/server';
import { getPlaidKeys } from './plaidCredentials';

/**
 * Shared helpers for the route handlers under `app/api`. They centralize the
 * boilerplate of:
 *   - building the Plaid base URL from `PLAID_ENV`
 *   - injecting `client_id`/`secret` into the request body or headers
 *   - forwarding Plaid's status + JSON body verbatim to the client
 *   - returning a generic 500 with `{ error_message }` for internal failures
 *
 * The app intentionally does no pre-flight 4xx validation. Plaid is the source
 * of truth for parameter / configuration errors; the helpers below only ever
 * synthesize a 500 when the catch handler fires (network failure, malformed
 * JSON, missing env vars, etc.).
 */

export const PLAID_BASE_URL = `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com`;

/**
 * Conditionally copy `user_id` and/or `user_token` onto a request body. Used
 * by every CRA route + user-items-get / user-remove, all of which accept
 * either field interchangeably.
 */
export function applyUserIdOrToken(
  target: Record<string, unknown>,
  user_id?: unknown,
  user_token?: unknown
): void {
  if (user_id) target.user_id = user_id;
  if (user_token) target.user_token = user_token;
}

/**
 * Generic 500 fallback for any internal exception thrown before/around the
 * Plaid call (env vars missing, JSON parse, network failure).
 */
export function plaidInternalErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : undefined;
  return NextResponse.json(
    { error_message: message || 'Plaid request failed' },
    { status: 500 }
  );
}

type PlaidFetchOptions = {
  /**
   * Where to send Plaid credentials. Defaults to 'body' (the standard pattern
   * used by every product endpoint). 'headers' is required for a small
   * number of endpoints (e.g. /user_account/session/get) that read the
   * credentials from `PLAID-CLIENT-ID`/`PLAID-SECRET` request headers.
   */
  credentialsIn?: 'body' | 'headers';
};

/**
 * Low-level Plaid POST. Returns the raw `Response` and parsed `data` so the
 * caller can transform the success body before forwarding. Most routes
 * should prefer `proxyPlaidJson` instead — this is only for routes that
 * need to reshape Plaid's success response.
 */
export async function plaidJsonFetch(
  request: NextRequest,
  path: string,
  body: Record<string, unknown>,
  options?: PlaidFetchOptions
): Promise<{ response: Response; data: any }> {
  const { clientId, secret } = getPlaidKeys(request);
  const credentialsIn = options?.credentialsIn ?? 'body';
  const requestBody =
    credentialsIn === 'headers' ? body : { client_id: clientId, secret, ...body };
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (credentialsIn === 'headers') {
    headers['PLAID-CLIENT-ID'] = clientId;
    headers['PLAID-SECRET'] = secret;
  }
  const response = await fetch(`${PLAID_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });
  const data = await response.json();
  return { response, data };
}

/**
 * POST to a Plaid endpoint with `client_id`/`secret` injected into the body
 * and forward the response (success or error) verbatim. Use for any route
 * that bypasses the plaid-fetch SDK (CRA endpoints, link/token/create, etc.).
 *
 * Pass `transformOk` to reshape Plaid's success body (errors always
 * pass through verbatim with their original status).
 */
export async function proxyPlaidJson(
  request: NextRequest,
  path: string,
  body: Record<string, unknown>,
  options?: PlaidFetchOptions & { transformOk?: (data: any) => any }
): Promise<NextResponse> {
  try {
    const { response, data } = await plaidJsonFetch(request, path, body, options);
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    const successBody = options?.transformOk ? options.transformOk(data) : data;
    return NextResponse.json(successBody, { status: response.status });
  } catch (error) {
    return plaidInternalErrorResponse(error);
  }
}

/**
 * Same as `proxyPlaidJson` but transparently handles endpoints that may
 * return a binary PDF instead of JSON (the CRA "/cra/check_report/.../pdf/get"
 * family). Successful PDF responses are base64-encoded and returned as
 * `{ pdf: '<base64>' }`. JSON responses (including Plaid errors) pass through.
 */
export async function proxyPlaidJsonOrPdf(
  request: NextRequest,
  path: string,
  body: Record<string, unknown>
): Promise<NextResponse> {
  try {
    const { clientId, secret } = getPlaidKeys(request);
    const response = await fetch(`${PLAID_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, secret, ...body }),
    });
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }
    if (!response.ok) {
      return NextResponse.json(
        { error_message: 'Plaid PDF request failed' },
        { status: response.status }
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    return NextResponse.json({ pdf: Buffer.from(arrayBuffer).toString('base64') });
  } catch (error) {
    return plaidInternalErrorResponse(error);
  }
}

/**
 * Wrap a plaid-fetch SDK call. Returns the SDK response body directly on
 * success. On error, forwards Plaid's `error.response` body + status if
 * present, otherwise returns a generic 500.
 *
 * Pass a transform to reshape the SDK response (e.g. `exchange-public-token`
 * returns only `{ access_token }`).
 */
export async function withPlaidSdk<T, R = T>(
  handler: () => Promise<T>,
  transform?: (result: T) => R
): Promise<NextResponse> {
  try {
    const result = await handler();
    const body = transform ? transform(result) : result;
    return NextResponse.json(body);
  } catch (error: any) {
    if (error?.response) {
      const errorBody = await error.response
        .json()
        .catch(() => ({ error_message: error?.message || 'Plaid request failed' }));
      return NextResponse.json(errorBody, { status: error.response.status });
    }
    return plaidInternalErrorResponse(error);
  }
}

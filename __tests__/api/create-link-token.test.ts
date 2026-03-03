import { NextRequest } from 'next/server';

// Mock global fetch for the direct Plaid API call
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock generateClientUserId
jest.mock('@/lib/generateClientUserId', () => ({
  generateClientUserId: jest.fn().mockReturnValue('flash_user_mock123'),
}));

process.env.PLAID_CLIENT_ID = 'test_client_id';
process.env.PLAID_SECRET = 'test_secret';
process.env.PLAID_ENV = 'sandbox';

import { POST } from '@/app/api/create-link-token/route';

describe('POST /api/create-link-token', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.PLAID_CLIENT_ID = 'test_client_id';
    process.env.PLAID_SECRET = 'test_secret';
    process.env.PLAID_ENV = 'sandbox';
  });

  function createRequest(body: any, cookies: Record<string, string> = {}): NextRequest {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (Object.keys(cookies).length > 0) {
      headers.set('cookie', Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; '));
    }
    return new NextRequest('http://localhost:3000/api/create-link-token', {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
  }

  function mockPlaidSuccess(data: any) {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(data),
    });
  }

  function mockPlaidError(status: number, data: any) {
    mockFetch.mockResolvedValue({
      ok: false,
      status,
      json: jest.fn().mockResolvedValue(data),
    });
  }

  it('creates a link token with default products (auth)', async () => {
    mockPlaidSuccess({ link_token: 'link-sandbox-token-123' });

    const req = createRequest({});
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.link_token).toBe('link-sandbox-token-123');

    // Verify the fetch call
    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe('https://sandbox.plaid.com/link/token/create');
    const body = JSON.parse(fetchCall[1].body);
    expect(body.products).toEqual(['auth']);
    expect(body.client_id).toBe('test_client_id');
    expect(body.secret).toBe('test_secret');
    expect(body.user.client_user_id).toBe('flash_user_mock123');
  });

  it('creates a link token with specified products', async () => {
    mockPlaidSuccess({ link_token: 'link-sandbox-token-456' });

    const req = createRequest({ products: ['transactions', 'identity'] });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.products).toEqual(['transactions', 'identity']);
  });

  it('includes required_if_supported_products when provided', async () => {
    mockPlaidSuccess({ link_token: 'link-token' });

    const req = createRequest({
      products: ['auth'],
      required_if_supported_products: ['identity'],
    });
    await POST(req);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.required_if_supported_products).toEqual(['identity']);
  });

  it('includes webhook URL when provided', async () => {
    mockPlaidSuccess({ link_token: 'link-token' });

    const req = createRequest({
      products: ['auth'],
      webhook: 'https://example.com/webhook',
    });
    await POST(req);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.webhook).toBe('https://example.com/webhook');
  });

  it('includes hosted_link_url in response when present', async () => {
    mockPlaidSuccess({
      link_token: 'link-token',
      hosted_link_url: 'https://hosted.plaid.com/link/xxx',
    });

    const req = createRequest({ products: ['auth'] });
    const res = await POST(req);
    const data = await res.json();

    expect(data.hosted_link_url).toBe('https://hosted.plaid.com/link/xxx');
  });

  it('handles user_id for CRA products', async () => {
    mockPlaidSuccess({ link_token: 'link-token' });

    const req = createRequest({
      products: ['cra_base_report'],
      user_id: 'user_abc123',
      user: { client_user_id: 'my-client-user' },
    });
    await POST(req);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.user_id).toBe('user_abc123');
    expect(body.user.client_user_id).toBe('my-client-user');
  });

  it('handles update mode with access_token', async () => {
    mockPlaidSuccess({ link_token: 'link-token' });

    const req = createRequest({
      access_token: 'access-sandbox-123',
    });
    await POST(req);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    // In update mode, products should not be set
    expect(body.products).toBeUndefined();
    expect(body.access_token).toBe('access-sandbox-123');
  });

  it('returns 400 when user_id provided without user object', async () => {
    const req = createRequest({
      products: ['cra_base_report'],
      user_id: 'user_abc123',
      // no user object
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error_code).toBe('INVALID_FIELD');
    expect(data.error_message).toContain('user.client_user_id is required');
  });

  it('returns 400 when user is not an object', async () => {
    const req = createRequest({
      products: ['auth'],
      user: 'not-an-object',
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error_code).toBe('INVALID_FIELD');
    expect(data.error_message).toContain('user must be an object');
  });

  it('returns Plaid error on API failure', async () => {
    mockPlaidError(400, {
      error_type: 'INVALID_REQUEST',
      error_code: 'INVALID_FIELD',
      error_message: 'Invalid products',
    });

    const req = createRequest({ products: ['invalid_product'] });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error_code).toBe('INVALID_FIELD');
  });

  it('returns 500 on unexpected error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const req = createRequest({ products: ['auth'] });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error_code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('passes additional params through to Plaid', async () => {
    mockPlaidSuccess({ link_token: 'link-token' });

    const req = createRequest({
      products: ['auth'],
      consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT',
      enable_multi_item_link: true,
    });
    await POST(req);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.consumer_report_permissible_purpose).toBe('ACCOUNT_REVIEW_CREDIT');
    expect(body.enable_multi_item_link).toBe(true);
  });
});

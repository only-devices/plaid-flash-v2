import { NextRequest } from 'next/server';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock plaid-fetch (needed by plaidCredentials import)
jest.mock('plaid-fetch', () => ({
  Configuration: jest.fn(),
  PlaidApi: jest.fn(),
}));

process.env.PLAID_CLIENT_ID = 'test_client_id';
process.env.PLAID_SECRET = 'test_secret';
process.env.PLAID_ENV = 'sandbox';

import { POST } from '@/app/api/user-create/route';

describe('POST /api/user-create', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.PLAID_CLIENT_ID = 'test_client_id';
    process.env.PLAID_SECRET = 'test_secret';
    process.env.PLAID_ENV = 'sandbox';
  });

  function createRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/user-create', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('creates a user with identity (new user_id flow)', async () => {
    const mockResponse = {
      user_id: 'user_abc123',
      request_id: 'req_789',
    };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    const req = createRequest({
      client_user_id: 'my-client-user-id',
      identity: {
        first_name: 'Jane',
        last_name: 'Doe',
      },
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user_id).toBe('user_abc123');

    // Verify fetch was called with correct Plaid endpoint
    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe('https://sandbox.plaid.com/user/create');
    const body = JSON.parse(fetchCall[1].body);
    expect(body.client_id).toBe('test_client_id');
    expect(body.secret).toBe('test_secret');
    expect(body.client_user_id).toBe('my-client-user-id');
    expect(body.identity).toEqual({ first_name: 'Jane', last_name: 'Doe' });
  });

  it('creates a user with legacy consumer_report_user_identity', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        user_id: 'user_xyz',
        user_token: 'user-token-legacy',
      }),
    });

    const req = createRequest({
      client_user_id: 'client-id',
      consumer_report_user_identity: {
        first_name: 'John',
        last_name: 'Smith',
      },
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user_token).toBe('user-token-legacy');
  });

  it('strips useLegacyUserToken from the request body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ user_id: 'user_abc' }),
    });

    const req = createRequest({
      client_user_id: 'client-id',
      useLegacyUserToken: true,
      identity: { first_name: 'Test' },
    });
    await POST(req);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.useLegacyUserToken).toBeUndefined();
    expect(body.identity).toEqual({ first_name: 'Test' });
  });

  it('returns Plaid error on API failure', async () => {
    const plaidError = {
      error_type: 'INVALID_REQUEST',
      error_code: 'INVALID_FIELD',
      error_message: 'client_user_id is required',
    };
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue(plaidError),
    });

    const req = createRequest({});
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error_code).toBe('INVALID_FIELD');
  });

  it('returns 500 on unexpected error', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'));

    const req = createRequest({ client_user_id: 'test' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Connection refused');
  });
});

import { NextRequest } from 'next/server';

// Mock global fetch for the direct Plaid API call
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Set env before importing route
process.env.PLAID_CLIENT_ID = 'test_client_id';
process.env.PLAID_SECRET = 'test_secret';
process.env.PLAID_ENV = 'sandbox';

import { POST } from '@/app/api/auth-get/route';

describe('POST /api/auth-get', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.PLAID_CLIENT_ID = 'test_client_id';
    process.env.PLAID_SECRET = 'test_secret';
    process.env.PLAID_ENV = 'sandbox';
  });

  function createRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/auth-get', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
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

  it('returns auth data on success', async () => {
    const mockResponse = {
      accounts: [{ account_id: 'acc_123', name: 'Checking' }],
      numbers: { ach: [{ account_id: 'acc_123', routing: '011401533' }] },
      request_id: 'req_123',
    };
    mockPlaidSuccess(mockResponse);

    const req = createRequest({ access_token: 'access-sandbox-123' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockResponse);

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe('https://sandbox.plaid.com/auth/get');
    const sentBody = JSON.parse(fetchCall[1].body);
    expect(sentBody.access_token).toBe('access-sandbox-123');
    expect(sentBody.client_id).toBe('test_client_id');
    expect(sentBody.secret).toBe('test_secret');
  });

  it('forwards arbitrary editor params verbatim to Plaid', async () => {
    mockPlaidSuccess({ accounts: [], numbers: { ach: [] }, request_id: 'req_456' });

    const req = createRequest({
      access_token: 'access-sandbox-123',
      options: { account_ids: ['acc_a', 'acc_b'] },
    });
    await POST(req);

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.access_token).toBe('access-sandbox-123');
    expect(sentBody.options).toEqual({ account_ids: ['acc_a', 'acc_b'] });
  });

  it('returns Plaid error details when API returns error response', async () => {
    const plaidError = {
      error_type: 'INVALID_INPUT',
      error_code: 'INVALID_ACCESS_TOKEN',
      error_message: 'The access_token is invalid.',
    };
    mockPlaidError(400, plaidError);

    const req = createRequest({ access_token: 'bad-token' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error_code).toBe('INVALID_ACCESS_TOKEN');
  });

  it('returns 500 for unexpected errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'));

    const req = createRequest({ access_token: 'access-sandbox-123' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error_message).toBe('Network failure');
    // The internal 500 handler should not synthesize a Plaid-style error_code.
    expect(data.error_code).toBeUndefined();
  });
});

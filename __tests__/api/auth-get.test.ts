import { NextRequest } from 'next/server';

// Mock plaid-fetch
const mockAuthGet = jest.fn();
jest.mock('plaid-fetch', () => ({
  Configuration: jest.fn(),
  PlaidApi: jest.fn().mockImplementation(() => ({
    authGet: mockAuthGet,
  })),
}));

// Set env before importing route
process.env.PLAID_CLIENT_ID = 'test_client_id';
process.env.PLAID_SECRET = 'test_secret';
process.env.PLAID_ENV = 'sandbox';

import { POST } from '@/app/api/auth-get/route';

describe('POST /api/auth-get', () => {
  beforeEach(() => {
    mockAuthGet.mockReset();
  });

  function createRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/auth-get', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('returns auth data on success', async () => {
    const mockResponse = {
      accounts: [{ account_id: 'acc_123', name: 'Checking' }],
      numbers: { ach: [{ account_id: 'acc_123', routing: '011401533' }] },
      request_id: 'req_123',
    };
    mockAuthGet.mockResolvedValue(mockResponse);

    const req = createRequest({ access_token: 'access-sandbox-123' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockResponse);
    expect(mockAuthGet).toHaveBeenCalledWith({ access_token: 'access-sandbox-123' });
  });

  it('returns 400 when access_token is missing', async () => {
    const req = createRequest({});
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('access_token is required');
  });

  it('returns 400 when access_token is not a string', async () => {
    const req = createRequest({ access_token: 123 });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('access_token is required');
  });

  it('returns Plaid error details when API returns error response', async () => {
    const plaidError = {
      error_type: 'INVALID_INPUT',
      error_code: 'INVALID_ACCESS_TOKEN',
      error_message: 'The access_token is invalid.',
    };
    mockAuthGet.mockRejectedValue({
      response: {
        status: 400,
        json: jest.fn().mockResolvedValue(plaidError),
      },
    });

    const req = createRequest({ access_token: 'bad-token' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error_code).toBe('INVALID_ACCESS_TOKEN');
  });

  it('returns 500 for unexpected errors', async () => {
    mockAuthGet.mockRejectedValue(new Error('Network failure'));

    const req = createRequest({ access_token: 'access-sandbox-123' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Network failure');
  });
});

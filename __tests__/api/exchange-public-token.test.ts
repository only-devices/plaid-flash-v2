import { NextRequest } from 'next/server';

const mockExchange = jest.fn();
jest.mock('plaid-fetch', () => ({
  Configuration: jest.fn(),
  PlaidApi: jest.fn().mockImplementation(() => ({
    itemPublicTokenExchange: mockExchange,
  })),
}));

process.env.PLAID_CLIENT_ID = 'test_client_id';
process.env.PLAID_SECRET = 'test_secret';
process.env.PLAID_ENV = 'sandbox';

import { POST } from '@/app/api/exchange-public-token/route';

describe('POST /api/exchange-public-token', () => {
  beforeEach(() => {
    mockExchange.mockReset();
  });

  function createRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/exchange-public-token', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('exchanges public token and returns access token', async () => {
    mockExchange.mockResolvedValue({
      access_token: 'access-sandbox-abc123',
      item_id: 'item_abc123',
      request_id: 'req_456',
    });

    const req = createRequest({ public_token: 'public-sandbox-xyz' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.access_token).toBe('access-sandbox-abc123');
    expect(mockExchange).toHaveBeenCalledWith({ public_token: 'public-sandbox-xyz' });
  });

  it('only returns access_token in response (not item_id)', async () => {
    mockExchange.mockResolvedValue({
      access_token: 'access-sandbox-abc123',
      item_id: 'item_abc123',
    });

    const req = createRequest({ public_token: 'public-sandbox-xyz' });
    const res = await POST(req);
    const data = await res.json();

    expect(data).toEqual({ access_token: 'access-sandbox-abc123' });
    expect(data.item_id).toBeUndefined();
  });

  it('returns Plaid error details on API error', async () => {
    const plaidError = {
      error_type: 'INVALID_INPUT',
      error_code: 'INVALID_PUBLIC_TOKEN',
      error_message: 'The public_token is invalid.',
    };
    mockExchange.mockRejectedValue({
      response: {
        status: 400,
        json: jest.fn().mockResolvedValue(plaidError),
      },
    });

    const req = createRequest({ public_token: 'bad-token' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error_code).toBe('INVALID_PUBLIC_TOKEN');
  });

  it('handles json parse failure in error response', async () => {
    mockExchange.mockRejectedValue({
      response: {
        status: 400,
        json: jest.fn().mockRejectedValue(new Error('parse error')),
      },
      message: 'Bad request',
    });

    const req = createRequest({ public_token: 'bad-token' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error_code).toBe('INTERNAL_SERVER_ERROR');
    expect(data.error_message).toBe('Bad request');
  });

  it('returns 500 for unexpected errors', async () => {
    mockExchange.mockRejectedValue(new Error('Connection reset'));

    const req = createRequest({ public_token: 'public-sandbox-xyz' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error_message).toBe('Connection reset');
  });
});

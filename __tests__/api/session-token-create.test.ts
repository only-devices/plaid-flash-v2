import { NextRequest } from 'next/server';

const mockFetch = jest.fn();
global.fetch = mockFetch;

process.env.PLAID_CLIENT_ID = 'test_client_id';
process.env.PLAID_SECRET = 'test_secret';
process.env.PLAID_ENV = 'sandbox';

import { POST } from '@/app/api/session-token-create/route';

describe('POST /api/session-token-create', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.PLAID_CLIENT_ID = 'test_client_id';
    process.env.PLAID_SECRET = 'test_secret';
    process.env.PLAID_ENV = 'sandbox';
  });

  function createRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/session-token-create', {
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

  it('forwards the editor payload verbatim and injects server credentials', async () => {
    mockPlaidSuccess({
      link: { link_token: 'link-sandbox-layer-123', expiration: '2026-01-01T00:00:00Z' },
      request_id: 'req_123',
    });

    const editorPayload = {
      template_id: 'template_5xk9wmaarmlp',
      user: { client_user_id: 'flash_user_1' },
      user_id: 'usr_abc',
      webhook: 'https://example.com/webhook',
      redirect_uri: 'https://example.com/oauth',
    };

    const req = createRequest(editorPayload);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.link_token).toBe('link-sandbox-layer-123');

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe('https://sandbox.plaid.com/session/token/create');
    const sentBody = JSON.parse(fetchCall[1].body);
    expect(sentBody.client_id).toBe('test_client_id');
    expect(sentBody.secret).toBe('test_secret');
    expect(sentBody.template_id).toBe('template_5xk9wmaarmlp');
    expect(sentBody.user).toEqual({ client_user_id: 'flash_user_1' });
    expect(sentBody.user_id).toBe('usr_abc');
    expect(sentBody.webhook).toBe('https://example.com/webhook');
    expect(sentBody.redirect_uri).toBe('https://example.com/oauth');
  });

  it('does not let editor-supplied client_id/secret override server credentials', async () => {
    mockPlaidSuccess({ link_token: 'link-sandbox-layer-456' });

    const req = createRequest({
      client_id: 'spoofed_client',
      secret: 'spoofed_secret',
      template_id: 'template_zpynxmk2g4tr',
      user: { client_user_id: 'flash_user_2' },
    });
    await POST(req);

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.client_id).toBe('test_client_id');
    expect(sentBody.secret).toBe('test_secret');
    expect(sentBody.template_id).toBe('template_zpynxmk2g4tr');
  });

  it('extracts link_token from a top-level response field', async () => {
    mockPlaidSuccess({ link_token: 'link-sandbox-flat' });

    const req = createRequest({
      template_id: 'template_5xk9wmaarmlp',
      user: { client_user_id: 'flash_user_3' },
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.link_token).toBe('link-sandbox-flat');
  });

  it('returns Plaid error details when API returns error response', async () => {
    const plaidError = {
      error_type: 'INVALID_REQUEST',
      error_code: 'INVALID_FIELD',
      error_message: 'template_id is required',
    };
    mockPlaidError(400, plaidError);

    const req = createRequest({ user: { client_user_id: 'flash_user_4' } });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error_code).toBe('INVALID_FIELD');
  });

  it('returns 500 for unexpected errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'));

    const req = createRequest({
      template_id: 'template_5xk9wmaarmlp',
      user: { client_user_id: 'flash_user_5' },
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error_message).toBe('Network failure');
    expect(data.error_code).toBeUndefined();
  });
});

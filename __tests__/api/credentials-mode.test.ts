import { NextRequest } from 'next/server';

// Mock plaid-fetch (needed by plaidCredentials)
jest.mock('plaid-fetch', () => ({
  Configuration: jest.fn(),
  PlaidApi: jest.fn(),
}));

process.env.PLAID_CLIENT_ID = 'test_client_id';
process.env.PLAID_SECRET = 'test_secret';

import { GET, POST } from '@/app/api/credentials-mode/route';

describe('/api/credentials-mode', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      PLAID_CLIENT_ID: 'test_client_id',
      PLAID_SECRET: 'test_secret',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function createGetRequest(cookies: Record<string, string> = {}): NextRequest {
    const headers = new Headers();
    if (Object.keys(cookies).length > 0) {
      headers.set('cookie', Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; '));
    }
    return new NextRequest('http://localhost:3000/api/credentials-mode', {
      method: 'GET',
      headers,
    });
  }

  function createPostRequest(body: any, cookies: Record<string, string> = {}): NextRequest {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (Object.keys(cookies).length > 0) {
      headers.set('cookie', Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; '));
    }
    return new NextRequest('http://localhost:3000/api/credentials-mode', {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
  }

  describe('GET', () => {
    it('returns altAvailable: false when alt credentials not configured', async () => {
      delete process.env.ALT_PLAID_CLIENT_ID;
      delete process.env.ALT_PLAID_SECRET;

      const req = createGetRequest();
      const res = await GET(req);
      const data = await res.json();

      expect(data.altAvailable).toBe(false);
      expect(data.useAltCredentials).toBe(false);
    });

    it('returns current credential state when alt available', async () => {
      process.env.ALT_PLAID_CLIENT_ID = 'alt_id';
      process.env.ALT_PLAID_SECRET = 'alt_secret';

      const req = createGetRequest({ plaid_flash_use_alt_credentials: '1' });
      const res = await GET(req);
      const data = await res.json();

      expect(data.altAvailable).toBe(true);
      expect(data.useAltCredentials).toBe(true);
    });
  });

  describe('POST', () => {
    it('sets alt credentials cookie when enabled', async () => {
      process.env.ALT_PLAID_CLIENT_ID = 'alt_id';
      process.env.ALT_PLAID_SECRET = 'alt_secret';

      const req = createPostRequest({ useAltCredentials: true });
      const res = await POST(req);
      const data = await res.json();

      expect(data.useAltCredentials).toBe(true);
      expect(data.altAvailable).toBe(true);

      // Check cookie was set
      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toContain('plaid_flash_use_alt_credentials=1');
      expect(setCookie).toContain('HttpOnly');
    });

    it('disables alt credentials', async () => {
      process.env.ALT_PLAID_CLIENT_ID = 'alt_id';
      process.env.ALT_PLAID_SECRET = 'alt_secret';

      const req = createPostRequest({ useAltCredentials: false });
      const res = await POST(req);
      const data = await res.json();

      expect(data.useAltCredentials).toBe(false);
      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toContain('plaid_flash_use_alt_credentials=0');
    });

    it('forces false when alt credentials are not available', async () => {
      delete process.env.ALT_PLAID_CLIENT_ID;
      delete process.env.ALT_PLAID_SECRET;

      const req = createPostRequest({ useAltCredentials: true });
      const res = await POST(req);
      const data = await res.json();

      expect(data.useAltCredentials).toBe(false);
      expect(data.altAvailable).toBe(false);
    });

    it('returns 400 for invalid JSON body', async () => {
      const req = new NextRequest('http://localhost:3000/api/credentials-mode', {
        method: 'POST',
        body: 'not json',
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('INVALID_REQUEST');
    });
  });
});

import { NextRequest } from 'next/server';

// Mock plaid-fetch module
jest.mock('plaid-fetch', () => ({
  Configuration: jest.fn().mockImplementation((config: any) => config),
  PlaidApi: jest.fn().mockImplementation((config: any) => ({ config })),
}));

import {
  isAltCredentialsAvailable,
  getUseAltCredentialsFromRequest,
  getPlaidKeys,
  createPlaidClient,
} from '@/lib/server/plaidCredentials';

describe('plaidCredentials', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      PLAID_CLIENT_ID: 'primary_client_id',
      PLAID_SECRET: 'primary_secret',
      PLAID_ENV: 'sandbox',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function createMockRequest(cookies: Record<string, string> = {}): NextRequest {
    const url = 'http://localhost:3000/api/test';
    const headers = new Headers();
    if (Object.keys(cookies).length > 0) {
      const cookieStr = Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
      headers.set('cookie', cookieStr);
    }
    return new NextRequest(url, { headers });
  }

  describe('isAltCredentialsAvailable', () => {
    it('returns false when alt credentials are not set', () => {
      delete process.env.ALT_PLAID_CLIENT_ID;
      delete process.env.ALT_PLAID_SECRET;
      expect(isAltCredentialsAvailable()).toBe(false);
    });

    it('returns false when only ALT_PLAID_CLIENT_ID is set', () => {
      process.env.ALT_PLAID_CLIENT_ID = 'alt_id';
      delete process.env.ALT_PLAID_SECRET;
      expect(isAltCredentialsAvailable()).toBe(false);
    });

    it('returns false when only ALT_PLAID_SECRET is set', () => {
      delete process.env.ALT_PLAID_CLIENT_ID;
      process.env.ALT_PLAID_SECRET = 'alt_secret';
      expect(isAltCredentialsAvailable()).toBe(false);
    });

    it('returns true when both alt credentials are set', () => {
      process.env.ALT_PLAID_CLIENT_ID = 'alt_id';
      process.env.ALT_PLAID_SECRET = 'alt_secret';
      expect(isAltCredentialsAvailable()).toBe(true);
    });
  });

  describe('getUseAltCredentialsFromRequest', () => {
    it('returns false when no cookie is set', () => {
      const req = createMockRequest();
      expect(getUseAltCredentialsFromRequest(req)).toBe(false);
    });

    it('returns false when alt credentials are not available', () => {
      delete process.env.ALT_PLAID_CLIENT_ID;
      delete process.env.ALT_PLAID_SECRET;
      const req = createMockRequest({ plaid_flash_use_alt_credentials: '1' });
      expect(getUseAltCredentialsFromRequest(req)).toBe(false);
    });

    it('returns true when cookie is "1" and alt credentials are available', () => {
      process.env.ALT_PLAID_CLIENT_ID = 'alt_id';
      process.env.ALT_PLAID_SECRET = 'alt_secret';
      const req = createMockRequest({ plaid_flash_use_alt_credentials: '1' });
      expect(getUseAltCredentialsFromRequest(req)).toBe(true);
    });

    it('returns true when cookie is "true" and alt credentials are available', () => {
      process.env.ALT_PLAID_CLIENT_ID = 'alt_id';
      process.env.ALT_PLAID_SECRET = 'alt_secret';
      const req = createMockRequest({ plaid_flash_use_alt_credentials: 'true' });
      expect(getUseAltCredentialsFromRequest(req)).toBe(true);
    });

    it('returns false when cookie is "0"', () => {
      process.env.ALT_PLAID_CLIENT_ID = 'alt_id';
      process.env.ALT_PLAID_SECRET = 'alt_secret';
      const req = createMockRequest({ plaid_flash_use_alt_credentials: '0' });
      expect(getUseAltCredentialsFromRequest(req)).toBe(false);
    });
  });

  describe('getPlaidKeys', () => {
    it('returns primary credentials by default', () => {
      const req = createMockRequest();
      const keys = getPlaidKeys(req);
      expect(keys.clientId).toBe('primary_client_id');
      expect(keys.secret).toBe('primary_secret');
    });

    it('returns alt credentials when cookie is set and alt available', () => {
      process.env.ALT_PLAID_CLIENT_ID = 'alt_id';
      process.env.ALT_PLAID_SECRET = 'alt_secret';
      const req = createMockRequest({ plaid_flash_use_alt_credentials: '1' });
      const keys = getPlaidKeys(req);
      expect(keys.clientId).toBe('alt_id');
      expect(keys.secret).toBe('alt_secret');
    });

    it('falls back to primary when alt requested but not available', () => {
      delete process.env.ALT_PLAID_CLIENT_ID;
      delete process.env.ALT_PLAID_SECRET;
      const req = createMockRequest({ plaid_flash_use_alt_credentials: '1' });
      const keys = getPlaidKeys(req);
      expect(keys.clientId).toBe('primary_client_id');
      expect(keys.secret).toBe('primary_secret');
    });

    it('throws when primary credentials are not configured', () => {
      delete process.env.PLAID_CLIENT_ID;
      delete process.env.PLAID_SECRET;
      const req = createMockRequest();
      expect(() => getPlaidKeys(req)).toThrow('Plaid credentials are not configured');
    });
  });

  describe('createPlaidClient', () => {
    it('creates a PlaidApi instance with correct configuration', () => {
      const { Configuration, PlaidApi } = require('plaid-fetch');
      const req = createMockRequest();
      const client = createPlaidClient(req);

      expect(Configuration).toHaveBeenCalledWith({
        basePath: 'https://sandbox.plaid.com',
        headers: {
          'PLAID-CLIENT-ID': 'primary_client_id',
          'PLAID-SECRET': 'primary_secret',
        },
      });
      expect(PlaidApi).toHaveBeenCalled();
    });

    it('uses PLAID_ENV for base path', () => {
      process.env.PLAID_ENV = 'production';
      const { Configuration } = require('plaid-fetch');
      Configuration.mockClear();

      const req = createMockRequest();
      createPlaidClient(req);

      expect(Configuration).toHaveBeenCalledWith(
        expect.objectContaining({
          basePath: 'https://production.plaid.com',
        })
      );
    });

    it('defaults to sandbox when PLAID_ENV is not set', () => {
      delete process.env.PLAID_ENV;
      const { Configuration } = require('plaid-fetch');
      Configuration.mockClear();

      const req = createMockRequest();
      createPlaidClient(req);

      expect(Configuration).toHaveBeenCalledWith(
        expect.objectContaining({
          basePath: 'https://sandbox.plaid.com',
        })
      );
    });
  });
});

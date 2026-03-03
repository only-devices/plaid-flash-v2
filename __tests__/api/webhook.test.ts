import { NextRequest } from 'next/server';

// Mock feature flags
jest.mock('@/lib/featureFlags', () => ({
  isWebhooksEnabled: jest.fn(),
}));

// Mock webhook store
jest.mock('@/lib/webhookStore', () => ({
  addWebhook: jest.fn().mockImplementation((payload: any) => ({
    id: 'webhook_mock_123',
    webhook_type: payload.webhook_type || 'UNKNOWN',
    webhook_code: payload.webhook_code || 'UNKNOWN',
    item_id: payload.item_id,
    timestamp: '2026-01-01T00:00:00.000Z',
    payload,
  })),
}));

import { POST, GET } from '@/app/api/webhook/route';
import { isWebhooksEnabled } from '@/lib/featureFlags';
import { addWebhook } from '@/lib/webhookStore';

const mockIsWebhooksEnabled = isWebhooksEnabled as jest.MockedFunction<typeof isWebhooksEnabled>;

describe('/api/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createPostRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  describe('POST', () => {
    it('returns 404 when webhooks are disabled', async () => {
      mockIsWebhooksEnabled.mockReturnValue(false);

      const req = createPostRequest({ webhook_type: 'TEST' });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain('only available in development');
    });

    it('processes webhook and returns success', async () => {
      mockIsWebhooksEnabled.mockReturnValue(true);

      const payload = {
        webhook_type: 'TRANSACTIONS',
        webhook_code: 'SYNC_UPDATES_AVAILABLE',
        item_id: 'item_abc',
      };
      const req = createPostRequest(payload);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.webhook_id).toBe('webhook_mock_123');
      expect(addWebhook).toHaveBeenCalledWith(payload);
    });

    it('returns 200 even for malformed payloads (to prevent Plaid retries)', async () => {
      mockIsWebhooksEnabled.mockReturnValue(true);

      // Simulate json parse failure by using an invalid request
      const req = new NextRequest('http://localhost:3000/api/webhook', {
        method: 'POST',
        body: 'not json',
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.error).toBeDefined();
    });
  });

  describe('GET', () => {
    it('returns 404 when webhooks are disabled', async () => {
      mockIsWebhooksEnabled.mockReturnValue(false);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain('only available in development');
    });

    it('returns health check when webhooks are enabled', async () => {
      mockIsWebhooksEnabled.mockReturnValue(true);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe('ok');
    });
  });
});

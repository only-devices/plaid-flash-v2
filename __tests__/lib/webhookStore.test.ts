// Reset globalThis state before each test
beforeEach(() => {
  const g = globalThis as any;
  g.webhooks = undefined;
  g.clients = undefined;
  // Re-import with fresh state by clearing the module cache
  jest.resetModules();
});

describe('webhookStore', () => {
  async function getStore() {
    return await import('@/lib/webhookStore');
  }

  describe('addWebhook', () => {
    it('adds a webhook event and returns it', async () => {
      const store = await getStore();
      const payload = {
        webhook_type: 'TRANSACTIONS',
        webhook_code: 'SYNC_UPDATES_AVAILABLE',
        item_id: 'item_123',
      };

      const event = store.addWebhook(payload);

      expect(event.id).toMatch(/^webhook_\d+_[a-z0-9]+$/);
      expect(event.webhook_type).toBe('TRANSACTIONS');
      expect(event.webhook_code).toBe('SYNC_UPDATES_AVAILABLE');
      expect(event.item_id).toBe('item_123');
      expect(event.timestamp).toBeTruthy();
      expect(event.payload).toEqual(payload);
    });

    it('adds events in reverse chronological order (newest first)', async () => {
      const store = await getStore();
      store.addWebhook({ webhook_type: 'FIRST', webhook_code: 'A' });
      store.addWebhook({ webhook_type: 'SECOND', webhook_code: 'B' });

      const webhooks = store.getWebhooks();
      expect(webhooks[0].webhook_type).toBe('SECOND');
      expect(webhooks[1].webhook_type).toBe('FIRST');
    });

    it('defaults unknown types to UNKNOWN', async () => {
      const store = await getStore();
      const event = store.addWebhook({});

      expect(event.webhook_type).toBe('UNKNOWN');
      expect(event.webhook_code).toBe('UNKNOWN');
      expect(event.item_id).toBeUndefined();
    });

    it('enforces maximum webhook limit of 50', async () => {
      const store = await getStore();
      for (let i = 0; i < 60; i++) {
        store.addWebhook({ webhook_type: 'TEST', webhook_code: `EVENT_${i}` });
      }

      const webhooks = store.getWebhooks();
      expect(webhooks.length).toBe(50);
      // The most recent should be first
      expect(webhooks[0].webhook_code).toBe('EVENT_59');
    });
  });

  describe('getWebhooks', () => {
    it('returns an empty array initially', async () => {
      const store = await getStore();
      expect(store.getWebhooks()).toEqual([]);
    });

    it('returns a copy of the webhooks array', async () => {
      const store = await getStore();
      store.addWebhook({ webhook_type: 'TEST', webhook_code: 'A' });

      const copy = store.getWebhooks();
      copy.push({ id: 'fake', webhook_type: 'FAKE', webhook_code: 'FAKE', timestamp: '', payload: {} });

      // Original should not be affected
      expect(store.getWebhooks().length).toBe(1);
    });
  });

  describe('clearWebhooks', () => {
    it('removes all stored webhooks', async () => {
      const store = await getStore();
      store.addWebhook({ webhook_type: 'TEST', webhook_code: 'A' });
      store.addWebhook({ webhook_type: 'TEST', webhook_code: 'B' });
      expect(store.getWebhooks().length).toBe(2);

      store.clearWebhooks();
      expect(store.getWebhooks()).toEqual([]);
    });
  });

  describe('client management', () => {
    it('starts with zero clients', async () => {
      const store = await getStore();
      expect(store.getClientCount()).toBe(0);
    });

    it('tracks connected clients', async () => {
      const store = await getStore();
      const mockController = {} as ReadableStreamDefaultController;

      store.addClient(mockController);
      expect(store.getClientCount()).toBe(1);

      store.removeClient(mockController);
      expect(store.getClientCount()).toBe(0);
    });

    it('handles removing non-existent client gracefully', async () => {
      const store = await getStore();
      const mockController = {} as ReadableStreamDefaultController;

      // Should not throw
      store.removeClient(mockController);
      expect(store.getClientCount()).toBe(0);
    });
  });

  describe('broadcasting', () => {
    it('broadcasts to connected clients when webhook is added', async () => {
      const store = await getStore();
      const enqueueFn = jest.fn();
      const mockController = { enqueue: enqueueFn } as unknown as ReadableStreamDefaultController;

      store.addClient(mockController);
      store.addWebhook({ webhook_type: 'TEST', webhook_code: 'BROADCAST' });

      expect(enqueueFn).toHaveBeenCalledTimes(1);
      const encodedData = enqueueFn.mock.calls[0][0];
      const decoded = new TextDecoder().decode(encodedData);
      expect(decoded).toContain('data: ');
      expect(decoded).toContain('BROADCAST');
    });

    it('removes clients that throw on enqueue', async () => {
      const store = await getStore();
      const failingController = {
        enqueue: jest.fn().mockImplementation(() => { throw new Error('disconnected'); }),
      } as unknown as ReadableStreamDefaultController;

      store.addClient(failingController);
      expect(store.getClientCount()).toBe(1);

      // Adding a webhook triggers broadcast which should remove the failing client
      store.addWebhook({ webhook_type: 'TEST', webhook_code: 'A' });
      expect(store.getClientCount()).toBe(0);
    });
  });

  describe('sendHeartbeat', () => {
    it('sends heartbeat to all connected clients', async () => {
      const store = await getStore();
      const enqueueFn = jest.fn();
      const mockController = { enqueue: enqueueFn } as unknown as ReadableStreamDefaultController;

      store.addClient(mockController);
      store.sendHeartbeat();

      expect(enqueueFn).toHaveBeenCalledTimes(1);
      const decoded = new TextDecoder().decode(enqueueFn.mock.calls[0][0]);
      expect(decoded).toContain('heartbeat');
      expect(decoded).toContain('timestamp');
    });

    it('removes disconnected clients during heartbeat', async () => {
      const store = await getStore();
      const failingController = {
        enqueue: jest.fn().mockImplementation(() => { throw new Error('disconnected'); }),
      } as unknown as ReadableStreamDefaultController;

      store.addClient(failingController);
      store.sendHeartbeat();
      expect(store.getClientCount()).toBe(0);
    });
  });
});

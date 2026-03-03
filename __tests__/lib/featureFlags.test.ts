describe('featureFlags', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('isWebhooksEnabled', () => {
    it('returns true when NODE_ENV is development and NGROK_AUTHTOKEN is set', async () => {
      process.env.NODE_ENV = 'development';
      process.env.NGROK_AUTHTOKEN = 'test_token_123';
      const { isWebhooksEnabled } = await import('@/lib/featureFlags');
      expect(isWebhooksEnabled()).toBe(true);
    });

    it('returns false when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NGROK_AUTHTOKEN = 'test_token_123';
      const { isWebhooksEnabled } = await import('@/lib/featureFlags');
      expect(isWebhooksEnabled()).toBe(false);
    });

    it('returns false when NGROK_AUTHTOKEN is not set', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.NGROK_AUTHTOKEN;
      const { isWebhooksEnabled } = await import('@/lib/featureFlags');
      expect(isWebhooksEnabled()).toBe(false);
    });

    it('returns false when both conditions are missing', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.NGROK_AUTHTOKEN;
      const { isWebhooksEnabled } = await import('@/lib/featureFlags');
      expect(isWebhooksEnabled()).toBe(false);
    });

    it('returns false when NGROK_AUTHTOKEN is empty string', async () => {
      process.env.NODE_ENV = 'development';
      process.env.NGROK_AUTHTOKEN = '';
      const { isWebhooksEnabled } = await import('@/lib/featureFlags');
      expect(isWebhooksEnabled()).toBe(false);
    });
  });

  describe('isWebhooksEnabledClient', () => {
    it('returns true when NODE_ENV is development', async () => {
      process.env.NODE_ENV = 'development';
      const { isWebhooksEnabledClient } = await import('@/lib/featureFlags');
      expect(isWebhooksEnabledClient()).toBe(true);
    });

    it('returns false when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      const { isWebhooksEnabledClient } = await import('@/lib/featureFlags');
      expect(isWebhooksEnabledClient()).toBe(false);
    });

    it('returns false when NODE_ENV is test', async () => {
      process.env.NODE_ENV = 'test';
      const { isWebhooksEnabledClient } = await import('@/lib/featureFlags');
      expect(isWebhooksEnabledClient()).toBe(false);
    });
  });
});

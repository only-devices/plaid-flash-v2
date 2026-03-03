import { PRODUCT_CONFIGS, PRODUCTS_ARRAY, getProductConfigById, ProductConfig } from '@/lib/productConfig';

describe('productConfig', () => {
  describe('PRODUCT_CONFIGS', () => {
    it('contains the expected top-level product categories', () => {
      expect(PRODUCT_CONFIGS).toHaveProperty('payments');
      expect(PRODUCT_CONFIGS).toHaveProperty('personal_finance_insights');
      expect(PRODUCT_CONFIGS).toHaveProperty('cra');
      expect(PRODUCT_CONFIGS).toHaveProperty('link');
    });

    it('each top-level config has required fields', () => {
      for (const [key, config] of Object.entries(PRODUCT_CONFIGS)) {
        expect(config.id).toBe(key);
        expect(config.name).toBeTruthy();
        expect(Array.isArray(config.products)).toBe(true);
        expect(Array.isArray(config.required_if_supported)).toBe(true);
        expect(config.gradient).toBeTruthy();
      }
    });

    it('payments category has expected children', () => {
      const payments = PRODUCT_CONFIGS.payments;
      expect(payments.children).toBeDefined();
      const childIds = payments.children!.map(c => c.id);
      expect(childIds).toContain('auth');
      expect(childIds).toContain('signal');
      expect(childIds).toContain('identity');
      expect(childIds).toContain('investments-move');
    });

    it('CRA products are flagged with isCRA', () => {
      const cra = PRODUCT_CONFIGS.cra;
      expect(cra.isCRA).toBe(true);
    });

    it('CRA children that are leaf products have requiresWebhook', () => {
      const craBaseReport = getProductConfigById('cra-base-report');
      expect(craBaseReport?.requiresWebhook).toBe(true);
      expect(craBaseReport?.isCRA).toBe(true);
    });

    it('leaf products have apiEndpoint and apiTitle', () => {
      const auth = getProductConfigById('auth');
      expect(auth?.apiEndpoint).toBe('/api/auth-get');
      expect(auth?.apiTitle).toBe('/auth/get');

      const transactionsGet = getProductConfigById('transactions-get');
      expect(transactionsGet?.apiEndpoint).toBe('/api/transactions-get');
      expect(transactionsGet?.apiTitle).toBe('/transactions/get');
    });

    it('signal has nested children (evaluate and balance)', () => {
      const signal = getProductConfigById('signal');
      expect(signal?.children).toBeDefined();
      expect(signal!.children!.length).toBe(2);
      expect(signal!.children![0].id).toBe('signal-evaluate');
      expect(signal!.children![1].id).toBe('signal-balance');
    });

    it('products with additionalApiParams have valid structures', () => {
      const signalEval = getProductConfigById('signal-evaluate');
      expect(signalEval?.additionalApiParams).toEqual({ amount: 100.00 });

      const identityMatch = getProductConfigById('identity-match');
      expect(identityMatch?.additionalApiParams?.user).toBeDefined();
      expect(identityMatch?.additionalApiParams?.user?.legal_name).toBe('Jane Doe');
    });

    it('PDF products have returnsPdf flag', () => {
      const incomePdf = getProductConfigById('cra-income-insights-pdf');
      expect(incomePdf?.returnsPdf).toBe(true);

      const voaPdf = getProductConfigById('cra-home-lending-voa-pdf');
      expect(voaPdf?.returnsPdf).toBe(true);
    });

    it('products with layerTemplateId have valid template IDs', () => {
      const auth = getProductConfigById('auth');
      expect(auth?.layerTemplateId).toMatch(/^template_/);

      const identityGet = getProductConfigById('identity-get');
      expect(identityGet?.layerTemplateId).toMatch(/^template_/);
    });
  });

  describe('PRODUCTS_ARRAY', () => {
    it('is an array derived from PRODUCT_CONFIGS values', () => {
      expect(Array.isArray(PRODUCTS_ARRAY)).toBe(true);
      expect(PRODUCTS_ARRAY.length).toBe(Object.keys(PRODUCT_CONFIGS).length);
    });

    it('contains all top-level products', () => {
      const ids = PRODUCTS_ARRAY.map(p => p.id);
      expect(ids).toContain('payments');
      expect(ids).toContain('personal_finance_insights');
      expect(ids).toContain('cra');
      expect(ids).toContain('link');
    });
  });

  describe('getProductConfigById', () => {
    it('finds top-level products', () => {
      const payments = getProductConfigById('payments');
      expect(payments).toBeDefined();
      expect(payments?.name).toBe('Payments and Funding');
    });

    it('finds child products (2nd level)', () => {
      const auth = getProductConfigById('auth');
      expect(auth).toBeDefined();
      expect(auth?.name).toBe('Auth');
      expect(auth?.products).toEqual(['auth']);
    });

    it('finds grandchild products (3rd level)', () => {
      const signalEval = getProductConfigById('signal-evaluate');
      expect(signalEval).toBeDefined();
      expect(signalEval?.name).toBe('Signal Evaluate');
      expect(signalEval?.apiEndpoint).toBe('/api/signal-evaluate');
    });

    it('returns undefined for non-existent products', () => {
      expect(getProductConfigById('non-existent')).toBeUndefined();
      expect(getProductConfigById('')).toBeUndefined();
    });

    it('finds all CRA sub-products', () => {
      const craProducts = [
        'cra-base-report',
        'cra-cashflow-insights',
        'cra-income-insights',
        'cra-income-insights-pdf',
        'cra-partner-insights',
        'cra-cashflow-updates',
        'cra-home-lending-voa',
        'cra-home-lending-voa-pdf',
      ];

      for (const id of craProducts) {
        const config = getProductConfigById(id);
        expect(config).toBeDefined();
        expect(config?.isCRA).toBe(true);
      }
    });

    it('finds transactions sub-products', () => {
      const txGet = getProductConfigById('transactions-get');
      expect(txGet).toBeDefined();
      expect(txGet?.apiEndpoint).toBe('/api/transactions-get');

      const txSync = getProductConfigById('transactions-sync');
      expect(txSync).toBeDefined();
      expect(txSync?.apiEndpoint).toBe('/api/transactions-sync');
    });
  });

  describe('product config data integrity', () => {
    function collectLeafProducts(config: ProductConfig): ProductConfig[] {
      if (!config.children || config.children.length === 0) {
        return [config];
      }
      return config.children.flatMap(child => collectLeafProducts(child));
    }

    it('all leaf products with apiEndpoint have valid endpoint format', () => {
      for (const topLevel of PRODUCTS_ARRAY) {
        const leaves = collectLeafProducts(topLevel);
        for (const leaf of leaves) {
          if (leaf.apiEndpoint) {
            expect(leaf.apiEndpoint).toMatch(/^\/api\//);
          }
        }
      }
    });

    it('all leaf products with apiEndpoint also have apiTitle', () => {
      for (const topLevel of PRODUCTS_ARRAY) {
        const leaves = collectLeafProducts(topLevel);
        for (const leaf of leaves) {
          if (leaf.apiEndpoint) {
            expect(leaf.apiTitle).toBeTruthy();
          }
        }
      }
    });

    it('no product IDs are duplicated across the entire tree', () => {
      const allIds: string[] = [];
      function collectIds(config: ProductConfig) {
        allIds.push(config.id);
        config.children?.forEach(collectIds);
      }
      PRODUCTS_ARRAY.forEach(collectIds);

      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });
  });
});

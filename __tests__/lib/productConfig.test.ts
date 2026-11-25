import { PRODUCT_CONFIGS, PRODUCTS_ARRAY, getProductConfigById, ProductConfig, collectLeafConfigs, isNonCraAccessTokenProduct, productsForCraMode, applyNewCraLinkBody, applyClientUserReportId, buildCraReportGetRequest, craReportGetRequiresReportId, isInstantCraOnly, mergeNewCraLinkParams, incomeVerificationForLeaves, incomeSelectionConflict, incomeUserIdentifier, userIdentifierParams, LEGACY_CRA_CHILDREN, NEW_CRA_CHILDREN } from '@/lib/productConfig';
import { buildUserCreateConfig } from '@/lib/userCreateIdentity';

describe('productConfig', () => {
  describe('PRODUCT_CONFIGS', () => {
    it('contains the expected top-level product categories', () => {
      expect(PRODUCT_CONFIGS).toHaveProperty('payments');
      expect(PRODUCT_CONFIGS).toHaveProperty('personal_finance_insights');
      expect(PRODUCT_CONFIGS).toHaveProperty('income');
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

    it('Home Lending and Income Insights PDFs share Link with their report products', () => {
      const incomePdf = getProductConfigById('cra-income-insights-pdf');
      expect(incomePdf?.hideFromLanding).toBe(true);
      expect(incomePdf?.postLinkCompanionOf).toBe('cra-income-insights');

      const voaPdf = getProductConfigById('cra-home-lending-voa-pdf');
      expect(voaPdf?.hideFromLanding).toBe(true);
      expect(voaPdf?.postLinkCompanionOf).toBe('cra-home-lending-voa');
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
      expect(ids).toContain('income');
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

  describe('isNonCraAccessTokenProduct', () => {
    const nonCraLeaves = PRODUCTS_ARRAY.flatMap(collectLeafConfigs).filter(isNonCraAccessTokenProduct);

    it('includes access-token products and excludes CRA, Enrich, and Link-only leaves', () => {
      const ids = nonCraLeaves.map((leaf) => leaf.id).sort();
      expect(ids).toEqual([
        'auth',
        'identity-get',
        'identity-match',
        'investments-holdings',
        'investments-move',
        'investments-transactions',
        'liabilities',
        'signal-balance',
        'signal-evaluate',
        'transactions-get',
        'transactions-sync',
      ]);
    });

    it('rejects CRA, Enrich, Income, and leaves without an API', () => {
      expect(isNonCraAccessTokenProduct(getProductConfigById('cra-base-report'))).toBe(false);
      expect(isNonCraAccessTokenProduct(getProductConfigById('cra-report-base'))).toBe(false);
      expect(isNonCraAccessTokenProduct(getProductConfigById('transactions-enrich'))).toBe(false);
      expect(isNonCraAccessTokenProduct(getProductConfigById('payroll-income'))).toBe(false);
      expect(isNonCraAccessTokenProduct(getProductConfigById('bank-income'))).toBe(false);
      expect(isNonCraAccessTokenProduct(getProductConfigById('link-upgrade-mode'))).toBe(false);
      expect(isNonCraAccessTokenProduct(getProductConfigById('link-update-mode'))).toBe(false);
    });
  });

  describe('CRA API trees', () => {
    it('defaults the CRA panel to the new report tree', () => {
      const childIds = PRODUCT_CONFIGS.cra.children!.map((child) => child.id);
      expect(childIds).toContain('cra-report-base');
      expect(childIds).toContain('cra-report-instant-link');
      expect(childIds).not.toContain('cra-base-report');
    });

    it('keeps legacy leaves reachable and flagged', () => {
      const legacy = getProductConfigById('cra-base-report');
      expect(legacy?.craApi).toBe('legacy');
      expect(legacy?.isCRA).toBe(true);
      expect(legacy?.additionalLinkParams?.cra_options?.days_requested).toBe(365);
      expect(legacy?.additionalLinkParams?.cra_report_parameter).toBeUndefined();
      expect(productsForCraMode(true)[0] && getProductConfigById('cra-cashflow-updates')?.apiEndpoint).toBe(
        '/api/cra-cashflow-updates-get'
      );
      const legacyIds = LEGACY_CRA_CHILDREN.flatMap(collectLeafConfigs).map((leaf) => leaf.id);
      expect(legacyIds).toEqual(expect.arrayContaining([
        'cra-base-report',
        'cra-income-insights-pdf',
        'cra-partner-insights',
        'cra-cashflow-updates',
        'cra-home-lending-voa-pdf',
      ]));
    });

    it('describes new Link and report bodies without cra_options', () => {
      const base = getProductConfigById('cra-report-base');
      expect(base?.craApi).toBe('report');
      expect(base?.apiEndpoint).toBe('/api/cra-report-get');
      expect(base?.apiTitle).toBe('/cra/report/get');
      expect(base?.additionalLinkParams?.cra_options).toBeUndefined();
      expect(base?.additionalLinkParams?.cra_report_parameter?.products).toEqual([
        { product: 'cra_base_report', version: 'V1' },
      ]);
      expect(base?.additionalApiParams).toMatchObject({
        scope: 'CLIENT_USER',
        decision_stage: 'DECISIONING',
        consumer_report_permissible_purpose: 'EXTENSION_OF_CREDIT',
      });

      const lendScore = getProductConfigById('cra-report-lend-score');
      expect(lendScore?.additionalLinkParams?.cra_report_parameter?.products).toEqual([
        { product: 'cra_lend_score', version: 'V2', options: { variants: ['GENERALIST'] } },
      ]);

      const home = getProductConfigById('cra-report-home-lending');
      expect(home?.products).toEqual(['cra_home_lending']);
      expect(home?.additionalApiParams?.products?.[0]?.version).toBe('V1');

      const incomeComplete = getProductConfigById('cra-report-income-complete');
      expect(incomeComplete?.additionalApiParams?.products?.[0]).toEqual({
        product: 'cra_income_complete',
        version: 'V2',
      });
    });

    it('retrieves Instant Link reports without Link or report_id', () => {
      const instantLeaves = NEW_CRA_CHILDREN
        .flatMap(collectLeafConfigs)
        .filter((leaf) => leaf.instantCra);
      expect(instantLeaves.map((leaf) => leaf.products[0])).toEqual([
        'cra_cashflow_insights',
        'cra_lend_score',
        'cra_lend_score_complete',
        'cra_network_insights',
      ]);
      expect(isInstantCraOnly(instantLeaves)).toBe(true);
      expect(mergeNewCraLinkParams(instantLeaves)).toBeNull();
      expect(
        applyNewCraLinkBody({ user: { client_user_id: 'flash_user_1' }, products: [] }, instantLeaves)
      ).toEqual({ user: { client_user_id: 'flash_user_1' }, products: [] });

      // Base Report, Home Lending, and Income are not Instant Link products.
      for (const id of [
        'cra-report-base',
        'cra-report-home-lending',
        'cra-report-income-insights',
        'cra-report-income-complete',
      ]) {
        expect(getProductConfigById(id)?.instantCra).toBeFalsy();
        expect(craReportGetRequiresReportId(getProductConfigById(id)!)).toBe(true);
      }

      const userCreate = buildUserCreateConfig({
        client_user_id: 'flash_user_instant',
        includeCraIdentity: true,
        useLegacyUserToken: false,
      });
      expect(userCreate.identity.phone_numbers).toEqual([{ data: '+14155550011', primary: true }]);
      expect(userCreate.consumer_report_user_identity).toBeUndefined();

      for (const leaf of instantLeaves) {
        expect(leaf.requiresWebhook).toBe(false);
        expect(leaf.additionalLinkParams).toBeUndefined();
        expect(leaf.layerTemplateId).toBeUndefined();
        expect(craReportGetRequiresReportId(leaf)).toBe(false);

        const body = buildCraReportGetRequest(leaf, 'usr_9nSp2KuZ2x4JDw');
        expect(body.report_id).toBeUndefined();
        expect(body.user_id).toBe('usr_9nSp2KuZ2x4JDw');
        expect(body.scope).toBe('PLAID_NETWORK');
        expect(body.decision_stage).toBe('DECISIONING');
        expect(body.consumer_report_permissible_purpose).toBe('EXTENSION_OF_CREDIT');
        expect(body.webhook).toBeUndefined();
        expect(body.client_report_id).toBeUndefined();
        expect(body.cra_report_parameter).toBeUndefined();
        expect(body.products).toEqual(leaf.additionalApiParams?.products);
      }

      expect(buildCraReportGetRequest(getProductConfigById('cra-instant-lend-score')!, 'usr_1').products).toEqual([
        { product: 'cra_lend_score', version: 'V2', options: { variants: ['GENERALIST'] } },
      ]);
      expect(buildCraReportGetRequest(getProductConfigById('cra-instant-cashflow-insights')!, 'usr_1').products).toEqual([
        { product: 'cra_cashflow_insights', version: 'V2' },
      ]);
      expect(buildCraReportGetRequest(getProductConfigById('cra-instant-network-insights')!, 'usr_1').products).toEqual([
        { product: 'cra_network_insights', version: 'V2' },
      ]);
      expect(buildCraReportGetRequest(getProductConfigById('cra-instant-lend-score-complete')!, 'usr_1').products).toEqual([
        { product: 'cra_lend_score_complete', version: 'V1', options: { variants: ['GENERALIST'] } },
      ]);
    });

    it('requires a report_id on CLIENT_USER /cra/report/get and omits product options', () => {
      const income = getProductConfigById('cra-report-income-insights')!;
      const lendScore = getProductConfigById('cra-report-lend-score')!;
      const instant = getProductConfigById('cra-instant-lend-score')!;
      expect(craReportGetRequiresReportId(income)).toBe(true);
      expect(craReportGetRequiresReportId(instant)).toBe(false);

      const body = applyClientUserReportId(
        {
          user_id: 'usr_123',
          ...lendScore.additionalApiParams,
        },
        'cra-report-test'
      );
      expect(body.report_id).toBe('cra-report-test');
      expect(body.products).toEqual([{ product: 'cra_lend_score', version: 'V2' }]);
      expect(body.scope).toBe('CLIENT_USER');
    });

    it('stamps a client_report_id and strips legacy Link fields', () => {
      const base = getProductConfigById('cra-report-base')!;
      const income = getProductConfigById('cra-report-income-insights')!;
      const body = applyNewCraLinkBody(
        {
          user: { client_user_id: 'flash_user_1' },
          user_token: 'user-token',
          cra_options: { days_requested: 30 },
          products: ['cra_base_report', 'cra_income_insights'],
        },
        [base, income],
        'flash-test-report'
      );
      expect(body.user).toBeUndefined();
      expect(body.user_token).toBeUndefined();
      expect(body.cra_options).toBeUndefined();
      expect(body.cra_report_parameter).toEqual({
        scope: 'CLIENT_USER',
        decision_stage: 'DECISIONING',
        days_requested: 365,
        client_report_id: 'flash-test-report',
        products: [
          { product: 'cra_base_report', version: 'V1' },
          { product: 'cra_income_insights', version: 'V2' },
        ],
      });
      expect(body.consumer_report_permissible_purpose).toBe('EXTENSION_OF_CREDIT');
    });
  });

  describe('Income', () => {
    it('exposes Payroll, Bank, and Document with user-scoped result calls', () => {
      const payroll = getProductConfigById('payroll-income')!;
      const bank = getProductConfigById('bank-income')!;
      const document = getProductConfigById('document-income')!;

      expect(payroll.products).toEqual(['income_verification']);
      expect(payroll.usesUserId).toBe(true);
      expect(payroll.requiresWebhook).toBe(true);
      expect(payroll.apiEndpoint).toBe('/api/credit-payroll-income-get');
      expect(payroll.additionalLinkParams).toEqual({
        income_verification: {
          income_source_types: ['payroll'],
          payroll_income: { flow_types: ['payroll_digital_income'] },
        },
      });
      expect(payroll.additionalSandboxCreateParams).toEqual({ institution_id: 'ins_135842' });

      expect(bank.additionalLinkParams).toEqual({
        income_verification: {
          income_source_types: ['bank'],
          bank_income: { days_requested: 180 },
        },
      });
      expect(bank.additionalApiParams).toEqual({ options: { count: 1 } });
      expect(bank.apiTitle).toBe('/credit/bank_income/get');

      expect(document.apiTitle).toBe('/credit/sessions/get');
      expect(document.additionalLinkParams).toEqual({
        income_verification: {
          income_source_types: ['payroll'],
          payroll_income: {
            flow_types: ['payroll_document_income'],
            parsing_config: ['ocr', 'risk_signals'],
          },
        },
      });
      expect(getProductConfigById('document-payroll-income')?.postLinkCompanionOf).toBe('document-income');
      expect(getProductConfigById('document-bank-statements')?.apiTitle).toBe('/credit/bank_statements/uploads/get');
      expect(getProductConfigById('document-risk-signals')?.apiTitle).toBe('/credit/payroll_income/risk_signals/get');
      expect(getProductConfigById('payroll-employment')?.postLinkCompanionOf).toBe('payroll-income');
      expect(getProductConfigById('payroll-employment')?.hideFromLanding).toBe(true);
    });

    it('merges Payroll and Document into one payroll Link session', () => {
      const merged = incomeVerificationForLeaves([
        getProductConfigById('payroll-income')!,
        getProductConfigById('document-income')!,
      ]);
      expect(merged).toEqual({
        income_verification: {
          income_source_types: ['payroll'],
          payroll_income: {
            flow_types: ['payroll_digital_income', 'payroll_document_income'],
            parsing_config: ['ocr', 'risk_signals'],
          },
        },
      });
      expect(
        incomeVerificationForLeaves([
          getProductConfigById('bank-income')!,
          getProductConfigById('payroll-income')!,
        ])
      ).toBeNull();
    });

    it('keeps Bank Income compatible with Item products and blocks CRA and Payroll mixes', () => {
      const payroll = getProductConfigById('payroll-income')!;
      const bank = getProductConfigById('bank-income')!;
      const auth = getProductConfigById('auth')!;
      const cra = getProductConfigById('cra-report-base')!;

      expect(incomeSelectionConflict(auth, [bank])).toBeNull();
      expect(incomeSelectionConflict(bank, [auth])).toBeNull();
      expect(incomeSelectionConflict(payroll, [auth])).toMatch(/only share a Link session/);
      expect(incomeSelectionConflict(bank, [payroll])).toMatch(/own Link session/);
      expect(incomeSelectionConflict(cra, [bank])).toMatch(/CRA cannot be combined/);
      expect(incomeSelectionConflict(payroll, [cra])).toMatch(/cannot share a Link session with CRA/);
      expect(incomeSelectionConflict(getProductConfigById('document-income')!, [payroll])).toBeNull();
    });

    it('uses usr_ user_id and falls back to user_token from older /user/create responses', () => {
      expect(incomeUserIdentifier({ user_id: 'usr_123', user_token: 'user-sandbox' }, false)).toEqual({
        userId: 'usr_123',
        userToken: null,
        usedUserToken: false,
      });
      expect(
        incomeUserIdentifier({ user_id: 'a'.repeat(64), user_token: 'user-sandbox' }, false)
      ).toEqual({
        userId: null,
        userToken: 'user-sandbox',
        usedUserToken: true,
      });
    });

    it('prefers user_id, then legacy user_token', () => {
      expect(userIdentifierParams({ userId: 'usr_1', userToken: 'user-token', usedUserToken: false })).toEqual({
        user_id: 'usr_1',
      });
      expect(userIdentifierParams({ userId: 'usr_1', userToken: 'user-token', usedUserToken: true })).toEqual({
        user_token: 'user-token',
      });
    });
  });

  describe('CRA panel swap', () => {
    it('swaps which CRA children the panel renders', () => {
      const legacyPanel = productsForCraMode(true).find((cfg) => cfg.id === 'cra')!;
      const newPanel = productsForCraMode(false).find((cfg) => cfg.id === 'cra')!;
      expect(legacyPanel.children!.some((child) => child.id === 'cra-base-report')).toBe(true);
      expect(legacyPanel.children!.some((child) => child.id === 'cra-report-base')).toBe(false);
      expect(newPanel.children!.some((child) => child.id === 'cra-report-base')).toBe(true);
      expect(newPanel.children!.some((child) => child.id === 'cra-base-report')).toBe(false);
    });
  });
});

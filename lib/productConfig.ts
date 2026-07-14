// Helper function to generate date range (end_date = today, start_date = today - 30 days)
const getDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    start_date: formatDate(startDate),
    end_date: formatDate(endDate)
  };
};

export interface ProductConfig {
  id: string;
  name: string;
  shortName?: string;
  products: string[];
  required_if_supported: string[];
  gradient: string;
  apiEndpoint?: string;
  apiTitle?: string;
  children?: ProductConfig[];
  additionalLinkParams?: Record<string, any>;
  additionalSandboxCreateParams?: Record<string, any>;
  additionalApiParams?: Record<string, any>;
  highlightKeys?: string[];
  icon?: string;
  isCRA?: boolean; // CRA products use user_id/user_token instead of access_token
  requiresWebhook?: boolean; // Products that need a webhook URL (like CRA)
  sandboxProducts?: string[]; // Override `products` for /sandbox/public_token/create initial_products
  layerTemplateId?: string; // Layer: template_id to use with /session/token/create (leaf products only)
  returnsPdf?: boolean; // When true, success step renders a PDF viewer instead of JSON
  pdfResponseKey?: string; // Key in API response holding base64 PDF (default 'pdf')
  noAccessToken?: boolean; // When true, leaf does not require Link or access_token (e.g., /transactions/enrich)
  sampleApiBody?: Record<string, any>; // Pre-populated request body for the preview-product-api JSON editor
}

export const PRODUCT_CONFIGS: Record<string, ProductConfig> = {
  payments: {
    id: 'payments',
    name: 'Payments and Funding',
    shortName: 'Payments',
    products: [],
    required_if_supported: [],
    gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
    icon: '/icons/payments.png',
    children: [
      {
        id: 'auth',
        name: 'Auth',
        products: ['auth'],
        required_if_supported: ['identity'],
        gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
        apiEndpoint: '/api/auth-get',
        apiTitle: '/auth/get',
        highlightKeys: ['numbers'],
        icon: '/icons/auth.png',
        layerTemplateId: 'template_zpynxmk2g4tr'
      },
      {
        id: 'signal',
        name: 'Signal',
        products: ['signal'],
        required_if_supported: [],
        gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
        icon: '/icons/signal.png',
        children: [
          {
            id: 'signal-evaluate',
            name: 'Signal Evaluate',
            shortName: 'Evaluate',
            products: ['signal'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
            icon: '/icons/signal.png',
            apiEndpoint: '/api/signal-evaluate',
            apiTitle: '/signal/evaluate',
            additionalApiParams: {
              amount: 100.00
            },
            // Same payments Layer template as Auth — Signal runs after Layer
            // returns an access_token for the linked Item.
            layerTemplateId: 'template_zpynxmk2g4tr'
          },
          {
            id: 'signal-balance',
            name: 'Signal Balance',
            shortName: 'Balance',
            products: ['signal'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
            icon: '/icons/balance.png',
            apiEndpoint: '/api/signal-balance',
            apiTitle: '/accounts/balance/get',
            highlightKeys: ['balances'],
            layerTemplateId: 'template_zpynxmk2g4tr'
          }
        ]
      },
      {
        id: 'identity',
        name: 'Identity',
        products: ['identity'],
        required_if_supported: [],
        gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
        icon: '/icons/identity.png',
        children: [
          {
            id: 'identity-get',
            name: 'Identity Get',
            shortName: 'Get',
            products: ['identity'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
            icon: '/icons/identity.png',
            apiEndpoint: '/api/identity-get',
            apiTitle: '/identity/get',
            highlightKeys: ['owners'],
            layerTemplateId: 'template_zpynxmk2g4tr'
          },
          {
            id: 'identity-match',
            name: 'Identity Match',
            shortName: 'Match',
            products: ['identity'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
            icon: '/icons/identity.png',
            apiEndpoint: '/api/identity-match',
            apiTitle: '/identity/match',
            additionalApiParams: {
              user: {
                legal_name: 'Jane Doe',
                phone_number: '+1 415 555 0122',
                email_address: 'jane.doe@example.com',
                address: {
                  street: '123 Main St',
                  city: 'San Francisco',
                  region: 'CA',
                  postal_code: '94105',
                  country: 'US'
                }
              }
            },
            highlightKeys: ['legal_name', 'phone_number', 'email_address', 'address'],
            layerTemplateId: 'template_zpynxmk2g4tr'
          }
        ]
      },
      {
        id: 'investments-move',
        name: 'Investments Move',
        products: ['investments_auth'],
        required_if_supported: [],
        gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
        apiEndpoint: '/api/investments-auth-get',
        apiTitle: '/investments/auth/get',
        highlightKeys: ['numbers'],
        icon: '/icons/investments-move.png',
        additionalLinkParams: {
          investments_auth: {
            masked_number_match_enabled: true,
            stated_account_number_enabled: true,
            manual_entry_enabled: true
          }
        },
        additionalApiParams: {
          investments_auth: {
            masked_number_match_enabled: true,
            stated_account_number_enabled: true,
            manual_entry_enabled: true
          }
        },
        additionalSandboxCreateParams: {
          institution_id: 'ins_127991'
        }
      }
    ]
  },
  personal_finance_insights: {
    id: 'personal_finance_insights',
    name: 'Personal Finance Insights',
    shortName: 'Personal Finance',
    products: [],
    required_if_supported: [],
    gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
    icon: '/icons/accounts-open.png',
    children: [
      {
        id: 'transactions',
        name: 'Transactions',
        products: ['transactions'],
        required_if_supported: [],
        gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
        icon: '/icons/transactions.png',
        children: [
          {
            id: 'transactions-get',
            name: 'Transactions Get',
            shortName: 'Get',
            products: ['transactions'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
            icon: '/icons/transactions.png',
            apiEndpoint: '/api/transactions-get',
            apiTitle: '/transactions/get',
            additionalApiParams: getDateRange(),
            additionalSandboxCreateParams: {
              options: {
                override_username: "user_transactions_dynamic",
                override_password: "pass_transactions_dynamic",
              }
            },
            layerTemplateId: 'template_zpynxmk2g4tr'
          },
          {
            id: 'transactions-sync',
            name: 'Transactions Sync',
            shortName: 'Sync',
            products: ['transactions'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
            icon: '/icons/transactions.png',
            apiEndpoint: '/api/transactions-sync',
            apiTitle: '/transactions/sync',
            additionalLinkParams: {
              transactions: {
                days_requested: 14
              }
            },
            additionalSandboxCreateParams: {
              options: {
                override_username: "user_transactions_dynamic",
                override_password: "pass_transactions_dynamic",
              }
            },
            highlightKeys: ['added', 'has_more', 'modified', 'next_cursor', 'removed', 'transactions_update_status'],
            layerTemplateId: 'template_zpynxmk2g4tr'
          }
        ],
      },
      {
        id: 'investments',
        name: 'Investments',
        products: ['investments'],
        required_if_supported: [],
        gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
        icon: '/icons/investments.png',
        children: [
          {
            id: 'investments-holdings',
            name: 'Investments Holdings',
            shortName: 'Holdings',
            products: ['investments'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
            icon: '/icons/investments.png',
            apiEndpoint: '/api/investments-holdings-get',
            apiTitle: '/investments/holdings/get',
            highlightKeys: ['holdings']
          },
          {
            id: 'investments-transactions',
            name: 'Investments Transactions',
            shortName: 'Transactions',
            products: ['investments'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
            icon: '/icons/investments.png',
            apiEndpoint: '/api/investments-transactions-get',
            apiTitle: '/investments/transactions/get',
            additionalApiParams: getDateRange()
          }
        ]
      },
      {
        id: 'liabilities',
        name: 'Liabilities',
        products: ['liabilities'],
        required_if_supported: [],
        gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
        apiEndpoint: '/api/liabilities-get',
        apiTitle: '/liabilities/get',
        highlightKeys: ['liabilities'],
        icon: '/icons/liabilities.png'
      },
      {
        id: 'enrich',
        name: 'Enrich',
        shortName: 'Enrich',
        products: [],
        required_if_supported: [],
        gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
        icon: '/icons/transactions.png',
        children: [
          {
            id: 'transactions-enrich',
            name: 'Enrich',
            shortName: 'Enrich',
            products: [],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
            icon: '/icons/transactions.png',
            apiEndpoint: '/api/transactions-enrich',
            apiTitle: '/transactions/enrich',
            noAccessToken: true,
            highlightKeys: [''],
            sampleApiBody: {
              account_type: 'depository',
              transactions: [
                {
                  id: '101',
                  description: 'GRUBHUBCHICKFILA',
                  amount: 30.28,
                  direction: 'OUTFLOW',
                  iso_currency_code: 'USD',
                },
                {
                  id: '102',
                  description: 'WAWA 915 MEDFORD NJ',
                  amount: 49.61,
                  direction: 'OUTFLOW',
                  iso_currency_code: 'USD',
                },
                {
                  id: '103',
                  description: 'HOME DEPOT',
                  amount: 115.23,
                  direction: 'OUTFLOW',
                  iso_currency_code: 'USD',
                  location: { city: 'CAMPBELL', region: 'CA' },
                },
                {
                  id: '104',
                  description: 'MTA*NYCT PAYGO',
                  amount: 2.75,
                  direction: 'OUTFLOW',
                  iso_currency_code: 'USD',
                },
                {
                  id: '105',
                  description: 'WAL-MART ASSOCS. PAYROLL',
                  amount: 1058.23,
                  direction: 'INFLOW',
                  iso_currency_code: 'USD',
                },
                {
                  id: '106',
                  description: 'PURCHASE WM SUPERCENTER #1700',
                  amount: 72.1,
                  direction: 'OUTFLOW',
                  iso_currency_code: 'USD',
                  location: { city: 'POWAY', region: 'CA' },
                },
              ],
            },
          },
        ],
      },
    ]
  },
  cra: {
    id: 'cra',
    name: 'CRA',
    products: ['cra_base_report'],
    required_if_supported: [],
    gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
    icon: '/icons/cra.png',
    isCRA: true,
    children: [
      {
        id: 'cra-base-report',
        name: 'Base Report',
        shortName: 'Base Report',
        products: ['cra_base_report'],
        required_if_supported: [],
        gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
        icon: '/icons/cra.png',
        apiEndpoint: '/api/cra-base-report-get',
        apiTitle: '/cra/check_report/base_report/get',
        isCRA: true,
        highlightKeys: [],
        additionalLinkParams: {
          consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT',
          cra_options: {
            days_requested: 365
          }
        },
        requiresWebhook: true,
        layerTemplateId: 'template_jbeu3j65l0z7'
      },
      {
        id: 'cra-underwriting',
        name: 'Underwriting',
        shortName: 'Underwriting',
        products: [],
        required_if_supported: [],
        gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
        icon: '/icons/cra.png',
        children: [
          {
            id: 'cra-cashflow-insights',
            name: 'Cashflow Insights',
            shortName: 'Cashflow Insights',
            products: ['cra_base_report', 'cra_cashflow_insights'],
            sandboxProducts: ['cra_base_report'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
            icon: '/icons/cra.png',
            apiEndpoint: '/api/cra-cashflow-insights-get',
            apiTitle: '/cra/check_report/cashflow_insights/get',
            isCRA: true,
            highlightKeys: ['cashflow_insights'],
            additionalLinkParams: {
              consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT',
              cra_options: {
                cashflow_insights: {
                  attributes_version: 'CFI1'
                }
              }
            },
            requiresWebhook: true,
            layerTemplateId: 'template_jbeu3j65l0z7'
          }
        ]
      },
      {
        id: 'cra-home-lending',
        name: 'Home Lending',
        shortName: 'Home Lending',
        products: [],
        required_if_supported: [],
        gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
        icon: '/icons/cra.png',
        children: [
          {
            id: 'cra-home-lending-voa',
            name: 'Home Lending VOA',
            shortName: 'Home Lending VOA',
            products: ['cra_base_report'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
            icon: '/icons/cra.png',
            apiEndpoint: '/api/cra-home-lending-voa-get',
            apiTitle: '/cra/check_report/verification/get',
            isCRA: true,
            additionalApiParams: {
              reports_requested: ['voa'],
            },
            additionalLinkParams: {
              consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT',
              gse_options: {
                report_types: 'VOA',
              },
            },
            requiresWebhook: true,
            layerTemplateId: 'template_jbeu3j65l0z7',
            highlightKeys: []
          },
          {
            id: 'cra-home-lending-voa-pdf',
            name: 'Home Lending VOA PDF',
            shortName: 'Home Lending VOA PDF',
            products: ['cra_base_report'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
            icon: '/icons/cra.png',
            apiEndpoint: '/api/cra-home-lending-voa-pdf-get',
            apiTitle: '/cra/check_report/verification/pdf/get',
            isCRA: true,
            additionalApiParams: {
              report_requested: 'voa',
            },
            additionalLinkParams: {
              consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT',
              gse_options: {
                report_types: 'VOA',
              },
            },
            requiresWebhook: true,
            layerTemplateId: 'template_jbeu3j65l0z7',
            returnsPdf: true
          }
        ]
      },
      {
        id: 'cra-income',
        name: 'Income',
        shortName: 'Income',
        products: [],
        required_if_supported: [],
        gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
        icon: '/icons/cra.png',
        children: [
          {
            id: 'cra-income-insights',
            name: 'Income Insights',
            shortName: 'Income Insights',
            products: ['cra_base_report', 'cra_income_insights'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
            icon: '/icons/cra.png',
            apiEndpoint: '/api/cra-income-insights-get',
            apiTitle: '/cra/check_report/income_insights/get',
            isCRA: true,
            highlightKeys: ['income_insights'],
            additionalLinkParams: {
              consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT',
              cra_options: {
                income_insights: {
                  income_insights_version: 'II2'
                }
              }
            },
            additionalSandboxCreateParams: {
              initial_products: ['cra_income_insights'],
              options: {
                override_username: "user_bank_income",
                override_password: "{}",
              }
            },
            requiresWebhook: true,
            layerTemplateId: 'template_jbeu3j65l0z7'
          },
          {
            id: 'cra-income-insights-pdf',
            name: 'Income Insights PDF',
            shortName: 'Income Insights PDF',
            products: ['cra_base_report', 'cra_income_insights'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
            icon: '/icons/cra.png',
            apiEndpoint: '/api/cra-income-insights-pdf-get',
            apiTitle: '/cra/check_report/pdf/get',
            isCRA: true,
            additionalApiParams: {
              add_ons: ['cra_income_insights'],
            },
            additionalLinkParams: {
              consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT'
            },
            additionalSandboxCreateParams: {
              initial_products: ['cra_income_insights'],
              options: {
                override_username: "user_bank_income",
                override_password: "{}",
              }
            },
            requiresWebhook: true,
            layerTemplateId: 'template_jbeu3j65l0z7',
            returnsPdf: true
          }
        ]
      },
      {
        id: 'cra-addon-modules',
        name: 'Add-on Modules',
        shortName: 'Add-on Modules',
        products: [],
        required_if_supported: [],
        gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
        icon: '/icons/cra.png',
        children: [
          {
            id: 'cra-cashflow-updates',
            name: 'Cashflow Updates',
            shortName: 'Cashflow Updates',
            products: ['cra_base_report'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
            icon: '/icons/cra.png',
            apiEndpoint: '/api/cra-cashflow-updates-get',
            apiTitle: '/cra/monitoring_insights/get',
            isCRA: true,
            highlightKeys: [],
            additionalApiParams: {
              consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT'
            },
            additionalLinkParams: {
              consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT'
            },
            requiresWebhook: true,
            layerTemplateId: 'template_jbeu3j65l0z7'
          },
          {
            id: 'cra-partner-insights',
            name: 'Partner Insights',
            shortName: 'Partner Insights',
            products: ['cra_base_report', 'cra_partner_insights'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
            icon: '/icons/cra.png',
            apiEndpoint: '/api/cra-partner-insights-get',
            apiTitle: '/cra/check_report/partner_insights/get',
            isCRA: true,
            highlightKeys: ['partner_insights'],
            additionalLinkParams: {
              consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT'
            },
            requiresWebhook: true,
            layerTemplateId: 'template_jbeu3j65l0z7'
          }
        ]
      },
      {
        id: 'link-upgrade-mode',
        name: 'Upgrade Mode',
        shortName: 'Upgrade Mode',
        products: [],
        required_if_supported: [],
        gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
        icon: '/icons/layer.png',
      }
    ]
  },
  link: {
    id: 'link',
    name: 'Link',
    shortName: 'Link',
    products: [],
    required_if_supported: [],
    gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
    icon: '/icons/layer.png',
    children: [
      {
        id: 'link-update-mode',
        name: 'Update Mode',
        shortName: 'Update Mode',
        products: [],
        required_if_supported: [],
        gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
        icon: '/icons/layer.png',
      },
    ],
  }
};

export const PRODUCTS_ARRAY = Object.values(PRODUCT_CONFIGS);

// Helper to get config by ID (searches parent, children, and grandchildren)
export const getProductConfigById = (id: string): ProductConfig | undefined => {
  for (const config of PRODUCTS_ARRAY) {
    if (config.id === id) return config;
    if (config.children) {
      for (const child of config.children) {
        if (child.id === id) return child;
        // Search grandchildren (3rd level)
        if (child.children) {
          const grandchild = child.children.find(gc => gc.id === id);
          if (grandchild) return grandchild;
        }
      }
    }
  }
  return undefined;
};

// Recursively collect every leaf descendant of `cfg` (including `cfg` itself
// if it has no children). Used by the Configuration Wizard to flatten a
// top-level parent's subtree into a single row of selectable pills.
export const collectLeafConfigs = (cfg: ProductConfig): ProductConfig[] => {
  if (!cfg.children || cfg.children.length === 0) return [cfg];
  return cfg.children.flatMap(collectLeafConfigs);
};


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
  craApi?: 'legacy' | 'report'; // legacy check_report calls vs /cra/report/*
  instantCra?: boolean; // PLAID_NETWORK report get; skips Link
  requiresWebhook?: boolean; // Products that need a webhook URL (like CRA)
  sandboxProducts?: string[]; // Override `products` for /sandbox/public_token/create initial_products
  layerTemplateId?: string; // Layer: template_id to use with /session/token/create (leaf products only)
  returnsPdf?: boolean; // When true, success step renders a PDF viewer instead of JSON
  hideFromLanding?: boolean; // Omit from the pre-Link product picker; Link is shared with another leaf
  postLinkCompanionOf?: string; // Also offer this leaf after Link when that product id was selected
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
            name: 'Home Lending Report',
            shortName: 'Home Lending Report',
            products: ['cra_base_report'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
            icon: '/icons/cra.png',
            apiEndpoint: '/api/cra-home-lending-voa-get',
            apiTitle: '/cra/check_report/verification/get',
            isCRA: true,
            additionalApiParams: {
              reports_requested: ['voa', 'income'],
            },
            additionalLinkParams: {
              consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT',
              cra_options: {
                base_report: {
                  home_lending_report_options: {
                    reports_requested: ['VOA', 'INCOME']
                  }
                }
              }
            },
            requiresWebhook: true,
            layerTemplateId: 'template_jbeu3j65l0z7',
            highlightKeys: []
          },
          {
            id: 'cra-home-lending-voa-pdf',
            name: 'Home Lending Report PDF',
            shortName: 'Home Lending Report PDF',
            products: ['cra_base_report'],
            required_if_supported: [],
            gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
            icon: '/icons/cra.png',
            apiEndpoint: '/api/cra-home-lending-voa-pdf-get',
            apiTitle: '/cra/check_report/verification/pdf/get',
            isCRA: true,
            additionalApiParams: {
              reports_requested: ['voa', 'income'],
            },
            additionalLinkParams: {
              consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT',
              cra_options: {
                base_report: {
                  home_lending_report_options: {
                    reports_requested: ['VOA', 'INCOME']
                  }
                }
              }
            },
            requiresWebhook: true,
            layerTemplateId: 'template_jbeu3j65l0z7',
            returnsPdf: true,
            hideFromLanding: true,
            postLinkCompanionOf: 'cra-home-lending-voa'
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
            returnsPdf: true,
            hideFromLanding: true,
            postLinkCompanionOf: 'cra-income-insights'
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

const CRA_GRADIENT = 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)';
const CRA_ICON = '/icons/cra.png';
const CRA_LAYER_TEMPLATE = 'template_jbeu3j65l0z7';
const CRA_REPORT_ENDPOINT = '/api/cra-report-get';
const CRA_REPORT_TITLE = '/cra/report/get';

export const NEW_CRA_DECISION_STAGE = 'DECISIONING';
export const NEW_CRA_PERMISSIBLE_PURPOSE = 'EXTENSION_OF_CREDIT';

function tagLegacyCra(nodes: ProductConfig[] | undefined): ProductConfig[] {
  if (!nodes) return [];
  return nodes.map((node) => ({
    ...node,
    ...(node.isCRA && node.apiEndpoint ? { craApi: 'legacy' as const } : {}),
    ...(node.children ? { children: tagLegacyCra(node.children) } : {}),
  }));
}

export const LEGACY_CRA_CHILDREN: ProductConfig[] = tagLegacyCra(PRODUCT_CONFIGS.cra.children);

type NewCraLeafSpec = {
  id: string;
  name: string;
  product: string;
  version: string;
  scope: 'CLIENT_USER' | 'PLAID_NETWORK';
  options?: Record<string, unknown>;
  sandboxIncome?: boolean;
};

function buildNewCraLeaf(spec: NewCraLeafSpec): ProductConfig {
  const productEntry: Record<string, unknown> = {
    product: spec.product,
    version: spec.version,
    ...(spec.options ? { options: spec.options } : {}),
  };
  const instant = spec.scope === 'PLAID_NETWORK';
  return {
    id: spec.id,
    name: spec.name,
    shortName: spec.name,
    products: [spec.product],
    required_if_supported: [],
    gradient: CRA_GRADIENT,
    icon: CRA_ICON,
    apiEndpoint: CRA_REPORT_ENDPOINT,
    apiTitle: CRA_REPORT_TITLE,
    isCRA: true,
    craApi: 'report',
    ...(instant ? { instantCra: true } : {}),
    highlightKeys: [],
    requiresWebhook: !instant,
    ...(instant ? {} : { layerTemplateId: CRA_LAYER_TEMPLATE }),
    additionalApiParams: {
      scope: spec.scope,
      decision_stage: NEW_CRA_DECISION_STAGE,
      consumer_report_permissible_purpose: NEW_CRA_PERMISSIBLE_PURPOSE,
      products: [productEntry],
    },
    ...(instant
      ? {}
      : {
          additionalLinkParams: {
            consumer_report_permissible_purpose: NEW_CRA_PERMISSIBLE_PURPOSE,
            cra_report_parameter: {
              scope: 'CLIENT_USER',
              decision_stage: NEW_CRA_DECISION_STAGE,
              days_requested: 365,
              products: [productEntry],
            },
          },
        }),
    ...(spec.sandboxIncome
      ? {
          additionalSandboxCreateParams: {
            initial_products: [spec.product],
            options: {
              override_username: 'user_bank_income',
              override_password: '{}',
            },
          },
        }
      : {}),
  };
}

const LEND_SCORE_OPTIONS = { variants: ['GENERALIST'] };

const UPGRADE_MODE_CONFIG: ProductConfig = {
  id: 'link-upgrade-mode',
  name: 'Upgrade Mode',
  shortName: 'Upgrade Mode',
  products: [],
  required_if_supported: [],
  gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
  icon: '/icons/layer.png',
};

function craGroup(id: string, name: string, children: ProductConfig[]): ProductConfig {
  return {
    id,
    name,
    shortName: name,
    products: [],
    required_if_supported: [],
    gradient: CRA_GRADIENT,
    icon: CRA_ICON,
    children,
  };
}

export const NEW_CRA_CHILDREN: ProductConfig[] = [
  buildNewCraLeaf({
    id: 'cra-report-base',
    name: 'Base Report',
    product: 'cra_base_report',
    version: 'V1',
    scope: 'CLIENT_USER',
  }),
  craGroup('cra-report-underwriting', 'Underwriting', [
    buildNewCraLeaf({
      id: 'cra-report-cashflow-insights',
      name: 'Cash Flow Insights',
      product: 'cra_cashflow_insights',
      version: 'V2',
      scope: 'CLIENT_USER',
    }),
    buildNewCraLeaf({
      id: 'cra-report-lend-score',
      name: 'LendScore',
      product: 'cra_lend_score',
      version: 'V2',
      scope: 'CLIENT_USER',
      options: LEND_SCORE_OPTIONS,
    }),
    buildNewCraLeaf({
      id: 'cra-report-lend-score-complete',
      name: 'LendScore Complete',
      product: 'cra_lend_score_complete',
      version: 'V1',
      scope: 'CLIENT_USER',
      options: LEND_SCORE_OPTIONS,
    }),
    buildNewCraLeaf({
      id: 'cra-report-network-insights',
      name: 'Network Insights',
      product: 'cra_network_insights',
      version: 'V2',
      scope: 'CLIENT_USER',
    }),
  ]),
  craGroup('cra-report-home-lending-group', 'Home Lending', [
    buildNewCraLeaf({
      id: 'cra-report-home-lending',
      name: 'Home Lending Insights',
      product: 'cra_home_lending',
      version: 'V1',
      scope: 'CLIENT_USER',
    }),
  ]),
  craGroup('cra-report-income', 'Income', [
    buildNewCraLeaf({
      id: 'cra-report-income-insights',
      name: 'Income Insights',
      product: 'cra_income_insights',
      version: 'V2',
      scope: 'CLIENT_USER',
      sandboxIncome: true,
    }),
    buildNewCraLeaf({
      id: 'cra-report-income-complete',
      name: 'Income Complete',
      product: 'cra_income_complete',
      version: 'V2',
      scope: 'CLIENT_USER',
      sandboxIncome: true,
    }),
  ]),
  craGroup('cra-report-instant-link', 'Instant Link', [
    buildNewCraLeaf({
      id: 'cra-instant-cashflow-insights',
      name: 'Cash Flow Insights',
      product: 'cra_cashflow_insights',
      version: 'V2',
      scope: 'PLAID_NETWORK',
    }),
    buildNewCraLeaf({
      id: 'cra-instant-lend-score',
      name: 'LendScore',
      product: 'cra_lend_score',
      version: 'V2',
      scope: 'PLAID_NETWORK',
      options: LEND_SCORE_OPTIONS,
    }),
    buildNewCraLeaf({
      id: 'cra-instant-lend-score-complete',
      name: 'LendScore Complete',
      product: 'cra_lend_score_complete',
      version: 'V1',
      scope: 'PLAID_NETWORK',
      options: LEND_SCORE_OPTIONS,
    }),
    buildNewCraLeaf({
      id: 'cra-instant-network-insights',
      name: 'Network Insights',
      product: 'cra_network_insights',
      version: 'V2',
      scope: 'PLAID_NETWORK',
    }),
  ]),
  UPGRADE_MODE_CONFIG,
];

// The CRA card defaults to the new /cra/report/* tree. Legacy CRA restores
// the previous children without removing them from lookup.
PRODUCT_CONFIGS.cra.children = NEW_CRA_CHILDREN;

export const PRODUCTS_ARRAY = Object.values(PRODUCT_CONFIGS);

export function productsForCraMode(legacyCra: boolean): ProductConfig[] {
  const children = legacyCra ? LEGACY_CRA_CHILDREN : NEW_CRA_CHILDREN;
  return PRODUCTS_ARRAY.map((cfg) => (cfg.id === 'cra' ? { ...cfg, children } : cfg));
}

export function collectConfigIds(nodes: ProductConfig[]): string[] {
  const ids: string[] = [];
  const visit = (node: ProductConfig) => {
    ids.push(node.id);
    node.children?.forEach(visit);
  };
  nodes.forEach(visit);
  return ids;
}

export function clientReportId(): string {
  return `flash-${Date.now()}`;
}

/** CLIENT_USER /cra/report/get requires the report_id from /cra/report/create or CRA_REPORT_READY. Instant Link does not. */
export function craReportGetRequiresReportId(leaf: ProductConfig): boolean {
  return leaf.craApi === 'report' && !leaf.instantCra;
}

export function craReportProductKey(products: Array<Record<string, unknown>>): string {
  return products.map((product) => `${product.product}:${product.version}`).join(',');
}

/** /cra/report/get with a report_id must not resend the options used at creation. */
export function productsWithoutReportOptions(
  products: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  return products.map((product) => {
    const { options: _options, ...rest } = product;
    return rest;
  });
}

export function buildCraReportCreateRequest(args: {
  userId: string;
  products: Array<Record<string, unknown>>;
  webhook?: string | null;
  clientReportId?: string;
}): Record<string, unknown> {
  return {
    user_id: args.userId,
    scope: 'CLIENT_USER',
    decision_stage: NEW_CRA_DECISION_STAGE,
    consumer_report_permissible_purpose: NEW_CRA_PERMISSIBLE_PURPOSE,
    days_requested: 365,
    client_report_id: args.clientReportId ?? clientReportId(),
    products: args.products,
    ...(args.webhook ? { webhook: args.webhook } : {}),
  };
}

export function applyClientUserReportId(
  body: Record<string, any>,
  reportId: string
): Record<string, any> {
  const next: Record<string, any> = { ...body, report_id: reportId };
  if (Array.isArray(next.products)) {
    next.products = productsWithoutReportOptions(next.products);
  }
  return next;
}

/**
 * Body for /cra/report/get.
 * Instant Link (PLAID_NETWORK) is synchronous: omit report_id and keep product
 * options such as LendScore variants. CLIENT_USER callers add report_id after
 * /cra/report/create via applyClientUserReportId.
 */
export function buildCraReportGetRequest(
  leaf: ProductConfig,
  userId: string
): Record<string, any> {
  const params =
    leaf.additionalApiParams && typeof leaf.additionalApiParams === 'object'
      ? { ...leaf.additionalApiParams }
      : {};
  const body: Record<string, any> = { user_id: userId, ...params };
  if (!craReportGetRequiresReportId(leaf)) {
    delete body.report_id;
  }
  return body;
}

export function craReportProductsFromLeaf(leaf: ProductConfig): Array<Record<string, unknown>> {
  const fromLink = leaf.additionalLinkParams?.cra_report_parameter?.products;
  if (Array.isArray(fromLink) && fromLink.length > 0) {
    return fromLink.map((product) => ({ ...product }));
  }
  const fromApi = leaf.additionalApiParams?.products;
  if (Array.isArray(fromApi) && fromApi.length > 0) {
    return fromApi.map((product) => ({ ...product }));
  }
  return [];
}

export function mergeNewCraLinkParams(
  leaves: ProductConfig[],
  reportId: string = clientReportId()
): Record<string, unknown> | null {
  const reportLeaves = leaves.filter((leaf) => leaf.craApi === 'report' && !leaf.instantCra);
  if (reportLeaves.length === 0) return null;
  const products: Array<Record<string, unknown>> = [];
  for (const leaf of reportLeaves) {
    for (const product of craReportProductsFromLeaf(leaf)) {
      const key = `${product.product}:${product.version}`;
      if (!products.some((existing) => `${existing.product}:${existing.version}` === key)) {
        products.push(product);
      }
    }
  }
  return {
    consumer_report_permissible_purpose: NEW_CRA_PERMISSIBLE_PURPOSE,
    cra_report_parameter: {
      scope: 'CLIENT_USER',
      decision_stage: NEW_CRA_DECISION_STAGE,
      days_requested: 365,
      client_report_id: reportId,
      products,
    },
  };
}

/** Drop legacy Link fields and stamp a fresh client_report_id for /cra/report/* leaves. */
export function applyNewCraLinkBody(
  config: Record<string, any>,
  leaves: ProductConfig[],
  reportId?: string
): Record<string, any> {
  const merged = mergeNewCraLinkParams(leaves, reportId);
  if (!merged) return config;
  const next: Record<string, any> = { ...config, ...merged };
  delete next.user;
  delete next.user_token;
  delete next.cra_options;
  return next;
}

export function isInstantCraOnly(leaves: ProductConfig[]): boolean {
  return leaves.length > 0 && leaves.every((leaf) => !!leaf.instantCra);
}

function findInTree(configs: ProductConfig[], id: string): ProductConfig | undefined {
  for (const config of configs) {
    if (config.id === id) return config;
    if (config.children) {
      const found = findInTree(config.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

// Searches the active tree, then both CRA trees, so legacy and new ids resolve.
export const getProductConfigById = (id: string): ProductConfig | undefined => {
  return (
    findInTree(PRODUCTS_ARRAY, id) ||
    findInTree(LEGACY_CRA_CHILDREN, id) ||
    findInTree(NEW_CRA_CHILDREN, id)
  );
};

// Recursively collect every leaf descendant of `cfg` (including `cfg` itself
// if it has no children). Used by the Configuration Wizard to flatten a
// top-level parent's subtree into a single row of selectable pills.
export const collectLeafConfigs = (cfg: ProductConfig): ProductConfig[] => {
  if (!cfg.children || cfg.children.length === 0) return [cfg];
  return cfg.children.flatMap(collectLeafConfigs);
};

// Non-CRA leaves that call an API with the access_token returned from Link.
// Used when a session is opened from an existing link token, where the
// original /link/token/create product list is unknown. Enrich is excluded
// because it does not use an access_token.
export const isNonCraAccessTokenProduct = (
  cfg: ProductConfig | undefined
): cfg is ProductConfig => {
  if (!cfg?.apiEndpoint) return false;
  if (cfg.isCRA) return false;
  if (cfg.noAccessToken) return false;
  if (cfg.id === 'link' || cfg.id.startsWith('link-')) return false;
  return true;
};


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
        icon: '/icons/auth.png'
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
            }
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
            highlightKeys: ['balances']
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
            highlightKeys: ['owners']
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
            highlightKeys: ['legal_name', 'phone_number', 'email_address', 'address']
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
            }
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
            highlightKeys: ['added', 'has_more', 'modified', 'next_cursor', 'removed', 'transactions_update_status']
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
        highlightKeys: ['report'],
        additionalLinkParams: {
          consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT'
        },
        requiresWebhook: true
      },
      {
        id: 'cra-income-insights',
        name: 'Income Insights',
        shortName: 'Income',
        products: ['cra_base_report', 'cra_income_insights'],
        required_if_supported: [],
        gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
        icon: '/icons/cra.png',
        apiEndpoint: '/api/cra-income-insights-get',
        apiTitle: '/cra/check_report/income_insights/get',
        isCRA: true,
        highlightKeys: ['income_insights'],
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
        requiresWebhook: true
      },
      {
        id: 'cra-partner-insights',
        name: 'Partner Insights',
        shortName: 'Partner',
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
        requiresWebhook: true
      },
      {
        id: 'cra-cashflow-insights',
        name: 'Cashflow Insights',
        shortName: 'Cashflow',
        products: ['cra_base_report', 'cra_cashflow_insights'],
        required_if_supported: [],
        gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
        icon: '/icons/cra.png',
        apiEndpoint: '/api/cra-cashflow-insights-get',
        apiTitle: '/cra/check_report/cashflow_insights/get',
        isCRA: true,
        highlightKeys: ['cashflow_insights'],
        additionalLinkParams: {
          consumer_report_permissible_purpose: 'ACCOUNT_REVIEW_CREDIT'
        },
        requiresWebhook: true
      }
    ]
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


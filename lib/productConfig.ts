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
  additionalApiParams?: Record<string, any>;
  highlightKeys?: string[];
  icon?: string;
}

export const PRODUCT_CONFIGS: Record<string, ProductConfig> = {
  auth: {
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
  identity: {
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
  transactions: {
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
        additionalApiParams: {
          start_date: '2025-01-01',
          end_date: '2025-05-31'
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
        highlightKeys: ['added', 'has_more', 'modified', 'next_cursor', 'removed', 'transactions_update_status']
      }
    ]
  },
  signal: {
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
          client_transaction_id: 'txn_flash_' + Date.now(),
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
  investments: {
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
        additionalApiParams: {
          start_date: '2025-01-01',
          end_date: '2025-05-31'
        }
      }
    ]
  },
  liabilities: {
    id: 'liabilities',
    name: 'Liabilities',
    products: ['liabilities'],
    required_if_supported: [],
    gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
    apiEndpoint: '/api/liabilities-get',
    apiTitle: '/liabilities/get',
    highlightKeys: ['liabilities'],
    icon: '/icons/liabilities.png'
  }
};

export const PRODUCTS_ARRAY = Object.values(PRODUCT_CONFIGS);

// Helper to get config by ID (searches both parent and children)
export const getProductConfigById = (id: string): ProductConfig | undefined => {
  for (const config of PRODUCTS_ARRAY) {
    if (config.id === id) return config;
    if (config.children) {
      const child = config.children.find(c => c.id === id);
      if (child) return child;
    }
  }
  return undefined;
};


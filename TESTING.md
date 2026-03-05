# Testing Guide

Plaid Flash uses [Jest](https://jestjs.io/) with [ts-jest](https://kulshekhar.github.io/ts-jest/) for unit testing. Tests cover library utilities, API routes, and React components.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run a specific test file
npx jest __tests__/lib/productConfig.test.ts

# Run tests matching a name pattern
npx jest -t "getProductConfigById"

# Run only server-side tests
npx jest --selectProjects server

# Run only component tests
npx jest --selectProjects components
```

## Test Structure

```
__tests__/
├── lib/                          # Library/utility unit tests
│   ├── productConfig.test.ts     # Product tree, config lookup, data integrity
│   ├── generateClientUserId.test.ts  # ID generation format and uniqueness
│   └── server/
│       └── plaidCredentials.test.ts  # Credential switching, cookie parsing, client creation
├── api/                          # API route unit tests
│   ├── auth-get.test.ts          # Standard product API pattern
│   ├── create-link-token.test.ts # Link token creation with all config variations
│   ├── exchange-public-token.test.ts # Token exchange and error handling
│   ├── credentials-mode.test.ts  # GET/POST credential state, cookie management
│   └── user-create.test.ts       # CRA user creation (user_id and legacy user_token flows)
├── utils/
│   └── deviceDetection.test.ts   # Mobile device detection (UA, screen size, touch)
└── components/                   # React component tests (jsdom environment)
    ├── ProductSelector.test.tsx   # Card rendering, click handlers, disabled states, settings
    ├── Modal.test.tsx             # Visibility toggling, CSS classes, children rendering
    └── JsonHighlight.test.tsx     # JSON type rendering, key highlighting, copy UI
```

## How Tests Work

### No Plaid credentials needed

All tests run with **mocked Plaid APIs**. No real API calls are made, no credentials are required, and tests run fully offline. The mocks verify that your code sends the correct parameters to Plaid and handles responses properly.

### Two test environments

The Jest config (`jest.config.ts`) defines two projects:

- **`server`** — runs in Node.js environment for library code, utilities, and API routes
- **`components`** — runs in jsdom environment for React component rendering

### What the tests verify

**Library tests** check that utility functions produce correct outputs:
- Product config lookups find the right products at all tree depths
- Credential management correctly reads cookies and selects primary vs. alt keys

**API route tests** verify request handling end-to-end within each route:
- **Input validation** — missing or invalid parameters return proper error responses
- **Outbound request shape** — the parameters sent to Plaid are correctly structured
- **Response transformation** — Plaid responses are filtered/transformed before returning to the client
- **Error handling** — Plaid API errors, network failures, and JSON parse errors all produce appropriate HTTP responses

**Component tests** verify rendering and interaction:
- Components render the expected elements given their props
- Click handlers fire with the correct arguments
- Conditional rendering (disabled states, optional buttons, visibility) works correctly

## Writing New Tests

### Adding tests for a new API route

Most product API routes follow the same pattern as `auth-get`. Copy `__tests__/api/auth-get.test.ts` as a starting point:

```typescript
import { NextRequest } from 'next/server';

// Mock the Plaid SDK method your route uses
const mockYourMethod = jest.fn();
jest.mock('plaid-fetch', () => ({
  Configuration: jest.fn(),
  PlaidApi: jest.fn().mockImplementation(() => ({
    yourMethod: mockYourMethod,
  })),
}));

process.env.PLAID_CLIENT_ID = 'test_client_id';
process.env.PLAID_SECRET = 'test_secret';
process.env.PLAID_ENV = 'sandbox';

import { POST } from '@/app/api/your-route/route';

describe('POST /api/your-route', () => {
  beforeEach(() => {
    mockYourMethod.mockReset();
  });

  function createRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/your-route', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('returns data on success', async () => {
    mockYourMethod.mockResolvedValue({ /* mock Plaid response */ });
    const req = createRequest({ access_token: 'access-sandbox-123' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    // Verify the outbound call to Plaid
    expect(mockYourMethod).toHaveBeenCalledWith({ access_token: 'access-sandbox-123' });
  });
});
```

For routes that use **direct `fetch()`** instead of the Plaid SDK (like `create-link-token` and `user-create`), mock `global.fetch` instead:

```typescript
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Then in tests:
mockFetch.mockResolvedValue({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue({ /* mock response */ }),
});
```

### Adding tests for a new component

Component tests use `@testing-library/react`. Add a `@jest-environment jsdom` docblock and place the file in `__tests__/components/`:

```typescript
/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import YourComponent from '@/components/YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent someProp="value" />);
    expect(screen.getByText('expected text')).toBeTruthy();
  });
});
```

### Adding tests for a new utility

Place the test in `__tests__/lib/` or `__tests__/utils/` to match the source location:

```typescript
import { yourFunction } from '@/lib/yourModule';

describe('yourFunction', () => {
  it('does the right thing', () => {
    expect(yourFunction('input')).toBe('expected output');
  });
});
```

## CI Integration

To run tests in a CI pipeline, add this step:

```yaml
- name: Run tests
  run: npm test -- --ci
```

The `--ci` flag optimizes Jest for CI environments (fails on snapshot mismatches, disables watch mode). No environment variables or credentials are needed since all external calls are mocked.

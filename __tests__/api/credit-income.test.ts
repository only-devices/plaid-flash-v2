import { NextRequest } from 'next/server';

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('plaid-fetch', () => ({
  Configuration: jest.fn(),
  PlaidApi: jest.fn(),
}));

process.env.PLAID_CLIENT_ID = 'test_client_id';
process.env.PLAID_SECRET = 'test_secret';
process.env.PLAID_ENV = 'sandbox';

import { POST as payrollIncomeGet } from '@/app/api/credit-payroll-income-get/route';
import { POST as bankIncomeGet } from '@/app/api/credit-bank-income-get/route';
import { POST as sessionsGet } from '@/app/api/credit-sessions-get/route';
import { POST as bankStatementsGet } from '@/app/api/credit-bank-statements-uploads-get/route';
import { POST as riskSignalsGet } from '@/app/api/credit-payroll-income-risk-signals-get/route';
import { POST as employmentGet } from '@/app/api/credit-employment-get/route';

const routes: Array<{ name: string; path: string; post: (request: NextRequest) => Promise<Response> }> = [
  { name: 'payroll income', path: '/credit/payroll_income/get', post: payrollIncomeGet },
  { name: 'bank income', path: '/credit/bank_income/get', post: bankIncomeGet },
  { name: 'sessions', path: '/credit/sessions/get', post: sessionsGet },
  { name: 'bank statement uploads', path: '/credit/bank_statements/uploads/get', post: bankStatementsGet },
  { name: 'risk signals', path: '/credit/payroll_income/risk_signals/get', post: riskSignalsGet },
  { name: 'employment', path: '/credit/employment/get', post: employmentGet },
];

describe('Income credit routes', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.PLAID_CLIENT_ID = 'test_client_id';
    process.env.PLAID_SECRET = 'test_secret';
    process.env.PLAID_ENV = 'sandbox';
  });

  function createRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost:3000/api/credit-income', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it.each(routes)('forwards $name with user_id and editor params', async ({ path, post }) => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ request_id: 'req_income' }),
    });

    const res = await post(createRequest({
      user_id: 'usr_example',
      user_token: 'should-stay-if-sent',
      options: { count: 1 },
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.request_id).toBe('req_income');
    expect(mockFetch.mock.calls[0][0]).toBe(`https://sandbox.plaid.com${path}`);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
      client_id: 'test_client_id',
      secret: 'test_secret',
      user_id: 'usr_example',
      user_token: 'should-stay-if-sent',
      options: { count: 1 },
    });
  });

  it('forwards a Plaid error from payroll income', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({
        error_code: 'PRODUCT_NOT_READY',
        error_message: 'income verification is still processing',
      }),
    });

    const res = await payrollIncomeGet(createRequest({ user_id: 'usr_example' }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error_code).toBe('PRODUCT_NOT_READY');
  });
});

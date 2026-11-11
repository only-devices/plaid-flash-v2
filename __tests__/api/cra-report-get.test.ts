import { NextRequest } from 'next/server';
import { buildCraReportGetRequest, getProductConfigById } from '@/lib/productConfig';

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('plaid-fetch', () => ({
  Configuration: jest.fn(),
  PlaidApi: jest.fn(),
}));

process.env.PLAID_CLIENT_ID = 'test_client_id';
process.env.PLAID_SECRET = 'test_secret';
process.env.PLAID_ENV = 'sandbox';

import { POST } from '@/app/api/cra-report-get/route';

describe('POST /api/cra-report-get', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.PLAID_CLIENT_ID = 'test_client_id';
    process.env.PLAID_SECRET = 'test_secret';
    process.env.PLAID_ENV = 'sandbox';
  });

  function createRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost:3000/api/cra-report-get', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('forwards an Instant Link get without adding report_id', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ report: { products: [] } }),
    });

    const leaf = getProductConfigById('cra-instant-lend-score')!;
    const requestBody = buildCraReportGetRequest(leaf, 'usr_9nSp2KuZ2x4JDw');
    const res = await POST(createRequest({ ...requestBody, user_token: 'should-be-stripped' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.report).toEqual({ products: [] });

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe('https://sandbox.plaid.com/cra/report/get');
    const body = JSON.parse(fetchCall[1].body);
    expect(body).toEqual({
      client_id: 'test_client_id',
      secret: 'test_secret',
      user_id: 'usr_9nSp2KuZ2x4JDw',
      scope: 'PLAID_NETWORK',
      decision_stage: 'DECISIONING',
      consumer_report_permissible_purpose: 'EXTENSION_OF_CREDIT',
      products: [
        { product: 'cra_lend_score', version: 'V2', options: { variants: ['GENERALIST'] } },
      ],
    });
    expect(body.report_id).toBeUndefined();
    expect(body.user_token).toBeUndefined();
  });

  it('forwards a CLIENT_USER report_id unchanged', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ report: { report_id: 'cra-report-1' } }),
    });

    await POST(createRequest({
      user_id: 'usr_9nSp2KuZ2x4JDw',
      report_id: 'cra-report-1',
      scope: 'CLIENT_USER',
      decision_stage: 'DECISIONING',
      consumer_report_permissible_purpose: 'EXTENSION_OF_CREDIT',
      products: [{ product: 'cra_income_insights', version: 'V2' }],
    }));

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.report_id).toBe('cra-report-1');
    expect(body.scope).toBe('CLIENT_USER');
    expect(body.products).toEqual([{ product: 'cra_income_insights', version: 'V2' }]);
  });
});

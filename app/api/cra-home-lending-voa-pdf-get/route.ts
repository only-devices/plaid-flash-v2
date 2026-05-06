import { NextRequest } from 'next/server';
import { applyUserIdOrToken, proxyPlaidJsonOrPdf } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { user_id, user_token } = await request.json();
  const body: Record<string, unknown> = { report_requested: 'voa' };
  applyUserIdOrToken(body, user_id, user_token);
  return proxyPlaidJsonOrPdf(request, '/cra/check_report/verification/pdf/get', body);
}

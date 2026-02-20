import { NextRequest, NextResponse } from 'next/server';
import { getPlaidKeys } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      webhook,
      days_requested,
      consumer_report_permissible_purpose,
      products,
    } = body || {};

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { error_code: 'INVALID_REQUEST', error_message: 'user_id is required' },
        { status: 400 }
      );
    }

    if (!webhook || typeof webhook !== 'string') {
      return NextResponse.json(
        { error_code: 'INVALID_REQUEST', error_message: 'webhook is required' },
        { status: 400 }
      );
    }

    if (!consumer_report_permissible_purpose || typeof consumer_report_permissible_purpose !== 'string') {
      return NextResponse.json(
        { error_code: 'INVALID_REQUEST', error_message: 'consumer_report_permissible_purpose is required' },
        { status: 400 }
      );
    }

    const normalizedDaysRequested =
      typeof days_requested === 'number' && Number.isFinite(days_requested) ? days_requested : 365;

    const { clientId, secret } = getPlaidKeys(request);

    const requestBody: any = {
      client_id: clientId,
      secret,
      user_id,
      webhook,
      days_requested: normalizedDaysRequested,
      consumer_report_permissible_purpose,
    };

    if (Array.isArray(products) && products.length > 0) {
      requestBody.products = products;
    }

    const response = await fetch(
      `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com/cra/check_report/create`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error calling cra/check_report/create:', error);
    return NextResponse.json(
      {
        error_code: 'INTERNAL_SERVER_ERROR',
        error_message: error.message || 'Failed to create CRA check report',
        display_message: 'Unable to create CRA report. Please try again.',
      },
      { status: 500 }
    );
  }
}


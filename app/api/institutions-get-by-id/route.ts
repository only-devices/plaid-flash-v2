import { NextRequest, NextResponse } from 'next/server';
import { createPlaidClient } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const { institution_id, country_codes } = await request.json();

    if (!institution_id) {
      return NextResponse.json({ error: 'institution_id is required' }, { status: 400 });
    }

    const plaid = createPlaidClient(request);

    const response = await plaid.institutionsGetById({
      institution_id,
      country_codes: Array.isArray(country_codes) && country_codes.length > 0 ? country_codes : ['US'],
    });

    return NextResponse.json({
      institution: response.institution,
      institution_name: response.institution?.name,
      request_id: response.request_id,
    });
  } catch (error: any) {
    console.error('Error fetching institution:', error);

    if (error.response) {
      const errorBody = await error.response.json().catch(() => ({
        error: error.message || 'Failed to fetch institution',
      }));
      return NextResponse.json(errorBody, { status: error.response.status });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch institution' },
      { status: 500 }
    );
  }
}


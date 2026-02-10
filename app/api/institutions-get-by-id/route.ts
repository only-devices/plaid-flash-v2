import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi } from 'plaid-fetch';

export async function POST(request: NextRequest) {
  try {
    const { institution_id, country_codes, useAltCredentials } = await request.json();

    if (!institution_id) {
      return NextResponse.json({ error: 'institution_id is required' }, { status: 400 });
    }

    // Select credentials based on flag
    const clientId =
      useAltCredentials && process.env.ALT_PLAID_CLIENT_ID
        ? process.env.ALT_PLAID_CLIENT_ID
        : process.env.PLAID_CLIENT_ID;
    const secret =
      useAltCredentials && process.env.ALT_PLAID_SECRET
        ? process.env.ALT_PLAID_SECRET
        : process.env.PLAID_SECRET;

    const configuration = new Configuration({
      basePath: `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com`,
      headers: {
        'PLAID-CLIENT-ID': clientId!,
        'PLAID-SECRET': secret!,
      },
    });

    const plaid = new PlaidApi(configuration);

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


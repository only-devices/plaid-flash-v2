import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi } from 'plaid-fetch';

const configuration = new Configuration({
  basePath: `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com`,
  headers: {
    'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
    'PLAID-SECRET': process.env.PLAID_SECRET!,
  },
});

const plaid = new PlaidApi(configuration);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products, required_if_supported_products, ...otherParams } = body;

    // Default to auth if no products specified
    const productsArray = products || ['auth'];
    const requiredProducts = required_if_supported_products || [];

    const linkTokenConfig: any = {
      link_customization_name: 'flash',
      user: {
        client_user_id: 'flash_user_id01',
        phone_number: '+14155550011'
      },
      client_name: 'Plaid Flash',
      products: productsArray,
      country_codes: ['US'],
      language: 'en',
      ...(requiredProducts.length > 0 && { required_if_supported_products: requiredProducts })
    };

    // Merge any other additional params (including transactions if provided)
    Object.assign(linkTokenConfig, otherParams);

    const response = await plaid.linkTokenCreate(linkTokenConfig);

    // Note: plaid-fetch returns data directly (no .data property)
    return NextResponse.json({ link_token: response.link_token });
  } catch (error: any) {
    console.error('Error creating link token:', error);
    
    // Extract Plaid error details if available
    if (error.response) {
      try {
        const errorBody = await error.response.json();
        return NextResponse.json(errorBody, { status: error.response.status });
      } catch (parseError) {
        // If we can't parse the response, fall back to generic error
        return NextResponse.json(
          { 
            error_code: 'INTERNAL_SERVER_ERROR',
            error_message: error.message || 'Failed to create link token',
            display_message: 'Unable to create link token. Please try again.'
          },
          { status: error.response.status || 500 }
        );
      }
    }
    
    // Generic error if no response object
    return NextResponse.json(
      { 
        error_code: 'INTERNAL_SERVER_ERROR',
        error_message: error.message || 'Failed to create link token',
        display_message: 'Unable to create link token. Please try again.'
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products, required_if_supported_products, user_id, user_token, user, webhook, useAltCredentials, ...otherParams } = body;

    // Default to auth if no products specified
    const productsArray = products || ['auth'];
    const requiredProducts = required_if_supported_products || [];

    // Select credentials based on flag
    const clientId = useAltCredentials && process.env.ALT_PLAID_CLIENT_ID 
      ? process.env.ALT_PLAID_CLIENT_ID 
      : process.env.PLAID_CLIENT_ID;
    const secret = useAltCredentials && process.env.ALT_PLAID_SECRET 
      ? process.env.ALT_PLAID_SECRET 
      : process.env.PLAID_SECRET;

    const linkTokenConfig: any = {
      client_id: clientId,
      secret: secret,
      link_customization_name: 'flash',
      user: user || {
        client_user_id: 'flash_user_id01',
        phone_number: '+14155550011'
      },
      client_name: 'Plaid Flash',
      products: productsArray,
      country_codes: ['US'],
      language: 'en',
      ...(requiredProducts.length > 0 && { required_if_supported_products: requiredProducts })
    };

    // Add user_id or user_token for CRA products
    if (user_id) {
      linkTokenConfig.user_id = user_id;
    }
    if (user_token) {
      linkTokenConfig.user_token = user_token;
    }

    // Add webhook URL if provided
    if (webhook) {
      linkTokenConfig.webhook = webhook;
    }

    // Merge any other additional params (including transactions if provided)
    Object.assign(linkTokenConfig, otherParams);



    // Make direct fetch call to bypass plaid-fetch's field stripping
    // (plaid-fetch v1.0.2 doesn't support user_id in LinkTokenCreateRequest)
    const response = await fetch(
      `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com/link/token/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(linkTokenConfig),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.log('Plaid error response:', JSON.stringify(data, null, 2));
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({ link_token: data.link_token });
  } catch (error: any) {
    console.error('Error creating link token:', error);
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

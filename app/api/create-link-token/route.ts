import { NextRequest, NextResponse } from 'next/server';
import { generateClientUserId } from '@/lib/generateClientUserId';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products, required_if_supported_products, user_id, user_token, user, webhook, useAltCredentials, ...otherParams } = body;
    const isUpdateMode =
      (typeof otherParams?.access_token === 'string' && otherParams.access_token.trim().length > 0) ||
      (typeof user_token === 'string' && user_token.trim().length > 0) ||
      (typeof user_id === 'string' && user_id.trim().length > 0);

    // Default to auth if no products specified
    const productsArray = products ?? (isUpdateMode ? undefined : ['auth']);
    const requiredProducts = required_if_supported_products ?? [];

    // Select credentials based on flag
    const clientId = useAltCredentials && process.env.ALT_PLAID_CLIENT_ID 
      ? process.env.ALT_PLAID_CLIENT_ID 
      : process.env.PLAID_CLIENT_ID;
    const secret = useAltCredentials && process.env.ALT_PLAID_SECRET 
      ? process.env.ALT_PLAID_SECRET 
      : process.env.PLAID_SECRET;

    // In Update Mode, we still include a `user` object, but we omit `client_user_id`.
    // In non-Update flows, we include the default `user` block only when user_id/user_token aren't provided.
    const shouldIncludeUser = isUpdateMode || !!user || (!user_id && !user_token);

    const linkTokenConfig: any = {
      client_id: clientId,
      secret: secret,
      link_customization_name: 'flash',
      client_name: 'Plaid Flash',
      country_codes: ['US'],
      language: 'en',
      ...(Array.isArray(productsArray) && productsArray.length > 0 ? { products: productsArray } : {}),
      ...(Array.isArray(requiredProducts) && requiredProducts.length > 0 ? { required_if_supported_products: requiredProducts } : {})
    };

    if (shouldIncludeUser) {
      const baseUser: any =
        user ||
        (!isUpdateMode
          ? { client_user_id: generateClientUserId(), phone_number: '+14155550011' }
          : { phone_number: '+14155550011' });

      if (isUpdateMode) {
        // Omit client_user_id specifically for all Update Mode scenarios
        const { client_user_id: _omit, ...rest } = baseUser || {};
        linkTokenConfig.user = rest;
      } else {
        linkTokenConfig.user = baseUser;
      }
    }

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

    return NextResponse.json({
      link_token: data.link_token,
      ...(data.hosted_link_url ? { hosted_link_url: data.hosted_link_url } : {})
    });
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

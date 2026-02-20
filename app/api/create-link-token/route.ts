import { NextRequest, NextResponse } from 'next/server';
import { generateClientUserId } from '@/lib/generateClientUserId';
import { getPlaidKeys } from '@/lib/server/plaidCredentials';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products, required_if_supported_products, user_id, user_token, user, webhook, ...otherParams } = body;
    const isUpdateMode =
      (typeof otherParams?.access_token === 'string' && otherParams.access_token.trim().length > 0) ||
      (typeof user_token === 'string' && user_token.trim().length > 0) ||
      (typeof user_id === 'string' && user_id.trim().length > 0);
    const isUserBasedUpdateMode =
      (typeof user_token === 'string' && user_token.trim().length > 0) ||
      (typeof user_id === 'string' && user_id.trim().length > 0);

    // Default to auth if no products specified
    const productsArray = products ?? (isUpdateMode ? undefined : ['auth']);
    const requiredProducts = required_if_supported_products ?? [];

    const { clientId, secret } = getPlaidKeys(request);

    const hasUserKey = Object.prototype.hasOwnProperty.call(body ?? {}, 'user');
    if (isUserBasedUpdateMode && !hasUserKey) {
      return NextResponse.json(
        {
          error_code: 'INVALID_FIELD',
          error_message: 'user.client_user_id is required when user_id/user_token is provided for Update Mode',
          error_type: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    if (hasUserKey && (user == null || typeof user !== 'object' || Array.isArray(user))) {
      return NextResponse.json(
        {
          error_code: 'INVALID_FIELD',
          error_message: 'user must be an object when provided',
          error_type: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    // Respect whether `user` was explicitly provided in the request body.
    // If absent, we add the minimum required user block for non-CRA flows.
    const shouldIncludeUser = hasUserKey ? true : (!user_id && !user_token);

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
      // Plaid requires user.client_user_id whenever `user` is provided.
      // If the caller didn't provide `user`, we only add client_user_id (no extra defaults).
      const baseUser: any = user || {};
      const rawClientUserId = typeof baseUser?.client_user_id === 'string' ? baseUser.client_user_id.trim() : '';
      if (isUserBasedUpdateMode && !rawClientUserId) {
        return NextResponse.json(
          {
            error_code: 'INVALID_FIELD',
            error_message: 'user.client_user_id is required when user object is provided',
            error_type: 'INVALID_REQUEST',
          },
          { status: 400 }
        );
      }

      linkTokenConfig.user = { ...baseUser, client_user_id: rawClientUserId || generateClientUserId() };
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

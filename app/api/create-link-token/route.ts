import { NextRequest } from 'next/server';
import { generateClientUserId } from '@/lib/generateClientUserId';
import { proxyPlaidJson } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { products, required_if_supported_products, user_id, user_token, user, webhook, ...otherParams } = body;
  const isUpdateMode =
    (typeof otherParams?.access_token === 'string' && otherParams.access_token.trim().length > 0) ||
    (typeof user_token === 'string' && user_token.trim().length > 0) ||
    (typeof user_id === 'string' && user_id.trim().length > 0);

  // Default to auth if no products specified (skipped in update mode where
  // products come from the existing access_token / user).
  const productsArray = products ?? (isUpdateMode ? undefined : ['auth']);
  const requiredProducts = required_if_supported_products ?? [];

  const hasUserKey = Object.prototype.hasOwnProperty.call(body ?? {}, 'user');
  // Respect whether `user` was explicitly provided in the request body.
  // If absent, we add the minimum required user block for non-CRA flows.
  const shouldIncludeUser = hasUserKey ? true : !user_id && !user_token;

  const linkTokenConfig: any = {
    link_customization_name: 'flash',
    client_name: 'Plaid Flash',
    country_codes: ['US'],
    language: 'en',
    ...(Array.isArray(productsArray) && productsArray.length > 0 ? { products: productsArray } : {}),
    ...(Array.isArray(requiredProducts) && requiredProducts.length > 0
      ? { required_if_supported_products: requiredProducts }
      : {}),
  };

  if (shouldIncludeUser) {
    // Plaid requires user.client_user_id whenever `user` is provided.
    // If the caller didn't provide one, we synthesize a stable random id.
    const baseUser: any = user && typeof user === 'object' && !Array.isArray(user) ? user : {};
    const rawClientUserId =
      typeof baseUser?.client_user_id === 'string' ? baseUser.client_user_id.trim() : '';
    linkTokenConfig.user = { ...baseUser, client_user_id: rawClientUserId || generateClientUserId() };
  }

  if (user_id) linkTokenConfig.user_id = user_id;
  if (user_token) linkTokenConfig.user_token = user_token;
  if (webhook) linkTokenConfig.webhook = webhook;

  // Forward any other additional params (e.g. transactions options)
  Object.assign(linkTokenConfig, otherParams);

  return proxyPlaidJson(request, '/link/token/create', linkTokenConfig, {
    transformOk: (data) => ({
      link_token: data.link_token,
      ...(data.hosted_link_url ? { hosted_link_url: data.hosted_link_url } : {}),
    }),
  });
}

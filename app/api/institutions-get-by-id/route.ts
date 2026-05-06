import { NextRequest } from 'next/server';
import { createPlaidClient } from '@/lib/server/plaidCredentials';
import { withPlaidSdk } from '@/lib/server/plaidApi';

export async function POST(request: NextRequest) {
  const { institution_id, country_codes } = await request.json();
  return withPlaidSdk(
    () =>
      createPlaidClient(request).institutionsGetById({
        institution_id,
        country_codes:
          Array.isArray(country_codes) && country_codes.length > 0 ? country_codes : ['US'],
      }),
    (response) => ({
      institution: response.institution,
      institution_name: response.institution?.name,
      request_id: response.request_id,
    })
  );
}

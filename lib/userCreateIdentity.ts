/**
 * Default CRA /user/create identity payloads and helpers so name, DOB, emails,
 * phones, addresses, and last-4 SSN stay complete when those objects are
 * present. identity / consumer_report_user_identity are CRA-only.
 */

export const DEFAULT_USER_CREATE_IDENTITY = {
  name: {
    given_name: 'Test',
    family_name: 'User',
  },
  date_of_birth: '1970-01-31',
  emails: [{ data: 'test@email.com', primary: true }],
  phone_numbers: [{ data: '+14155550011', primary: true }],
  addresses: [
    {
      street_1: '100 Grey St',
      city: 'San Francisco',
      region: 'CA',
      country: 'US',
      postal_code: '94109',
      primary: true,
    },
  ],
  id_numbers: [{ value: '1234', type: 'us_ssn_last_4' }],
} as const;

export const DEFAULT_CONSUMER_REPORT_USER_IDENTITY = {
  first_name: 'Flash',
  last_name: 'User',
  ssn_last_4: '1234',
  date_of_birth: '1970-01-01',
  phone_numbers: ['+14155550011'],
  emails: ['email@example.com'],
  primary_address: {
    city: 'Greenville',
    region: 'SC',
    street: '650 N Academy St',
    postal_code: '29601',
    country: 'US',
  },
} as const;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function firstNonEmptyString(...candidates: unknown[]): string {
  for (const raw of candidates) {
    const v = typeof raw === 'string' ? raw.trim() : '';
    if (v) return v;
  }
  return '';
}

export function ensureIdentityFields(identity: unknown): Record<string, any> {
  const src = isPlainObject(identity) ? identity : {};
  const defaults = clone(DEFAULT_USER_CREATE_IDENTITY);
  const name = isPlainObject(src.name) ? src.name : {};
  return {
    ...src,
    name: {
      ...name,
      given_name: firstNonEmptyString(name.given_name, defaults.name.given_name),
      family_name: firstNonEmptyString(name.family_name, defaults.name.family_name),
    },
    date_of_birth: firstNonEmptyString(src.date_of_birth, defaults.date_of_birth),
    emails: Array.isArray(src.emails) && src.emails.length > 0 ? src.emails : defaults.emails,
    phone_numbers:
      Array.isArray(src.phone_numbers) && src.phone_numbers.length > 0
        ? src.phone_numbers
        : defaults.phone_numbers,
    addresses:
      Array.isArray(src.addresses) && src.addresses.length > 0 ? src.addresses : defaults.addresses,
    id_numbers:
      Array.isArray(src.id_numbers) && src.id_numbers.length > 0 ? src.id_numbers : defaults.id_numbers,
  };
}

export function ensureConsumerReportUserIdentityFields(identity: unknown): Record<string, any> {
  const src = isPlainObject(identity) ? identity : {};
  const defaults = clone(DEFAULT_CONSUMER_REPORT_USER_IDENTITY);
  const addr = isPlainObject(src.primary_address) ? src.primary_address : {};
  return {
    ...src,
    first_name: firstNonEmptyString(src.first_name, defaults.first_name),
    last_name: firstNonEmptyString(src.last_name, defaults.last_name),
    ssn_last_4: firstNonEmptyString(src.ssn_last_4, defaults.ssn_last_4),
    date_of_birth: firstNonEmptyString(src.date_of_birth, defaults.date_of_birth),
    phone_numbers:
      Array.isArray(src.phone_numbers) && src.phone_numbers.length > 0
        ? src.phone_numbers
        : defaults.phone_numbers,
    emails: Array.isArray(src.emails) && src.emails.length > 0 ? src.emails : defaults.emails,
    primary_address: {
      ...defaults.primary_address,
      ...addr,
      city: firstNonEmptyString(addr.city, defaults.primary_address.city),
      region: firstNonEmptyString(addr.region, defaults.primary_address.region),
      street: firstNonEmptyString(addr.street, defaults.primary_address.street),
      postal_code: firstNonEmptyString(addr.postal_code, defaults.primary_address.postal_code),
      country: firstNonEmptyString(addr.country, defaults.primary_address.country),
    },
  };
}

/**
 * Complete identity objects that are already on the /user/create payload.
 * Does not add identity / consumer_report_user_identity when they are absent
 * (non-CRA /user/create is client_user_id only).
 */
export function applyUserCreateIdentityToPayload(config: unknown): Record<string, any> {
  const src = isPlainObject(config) ? { ...config } : {};
  if (isPlainObject(src.identity)) {
    src.identity = ensureIdentityFields(src.identity);
  }
  if (isPlainObject(src.consumer_report_user_identity)) {
    src.consumer_report_user_identity = ensureConsumerReportUserIdentityFields(
      src.consumer_report_user_identity
    );
  }
  return src;
}

export function buildUserCreateConfig(options: {
  client_user_id: string;
  useLegacyUserToken?: boolean;
  includeCraIdentity?: boolean;
}): Record<string, any> {
  const config: Record<string, any> = { client_user_id: options.client_user_id };
  if (!options.includeCraIdentity) {
    return config;
  }
  if (options.useLegacyUserToken) {
    config.consumer_report_user_identity = ensureConsumerReportUserIdentityFields({});
  } else {
    config.identity = ensureIdentityFields({});
  }
  return config;
}

import {
  applyUserCreateIdentityToPayload,
  buildUserCreateConfig,
  DEFAULT_CONSUMER_REPORT_USER_IDENTITY,
  DEFAULT_USER_CREATE_IDENTITY,
  ensureConsumerReportUserIdentityFields,
  ensureIdentityFields,
} from '@/lib/userCreateIdentity';

describe('userCreateIdentity', () => {
  describe('ensureIdentityFields', () => {
    it('fills name, date_of_birth, emails, phone_numbers, addresses, and last-4 SSN', () => {
      expect(ensureIdentityFields(undefined)).toEqual(DEFAULT_USER_CREATE_IDENTITY);
      expect(ensureIdentityFields({})).toEqual(DEFAULT_USER_CREATE_IDENTITY);
    });

    it('preserves editor values and only fills missing required fields', () => {
      const ensured = ensureIdentityFields({
        name: { given_name: 'Ada' },
        emails: [{ data: 'ada@example.com', primary: true }],
        extra: 'keep-me',
      });
      expect(ensured.name).toEqual({ given_name: 'Ada', family_name: 'User' });
      expect(ensured.emails).toEqual([{ data: 'ada@example.com', primary: true }]);
      expect(ensured.date_of_birth).toBe(DEFAULT_USER_CREATE_IDENTITY.date_of_birth);
      expect(ensured.phone_numbers).toEqual(DEFAULT_USER_CREATE_IDENTITY.phone_numbers);
      expect(ensured.addresses).toEqual(DEFAULT_USER_CREATE_IDENTITY.addresses);
      expect(ensured.id_numbers).toEqual(DEFAULT_USER_CREATE_IDENTITY.id_numbers);
      expect(ensured.extra).toBe('keep-me');
    });
  });

  describe('ensureConsumerReportUserIdentityFields', () => {
    it('fills legacy identity fields including ssn_last_4', () => {
      expect(ensureConsumerReportUserIdentityFields(undefined)).toEqual(
        DEFAULT_CONSUMER_REPORT_USER_IDENTITY
      );
    });

    it('preserves editor values and fills missing address/ssn fields', () => {
      const ensured = ensureConsumerReportUserIdentityFields({
        first_name: 'Ada',
        primary_address: { city: 'Austin' },
      });
      expect(ensured.first_name).toBe('Ada');
      expect(ensured.last_name).toBe('User');
      expect(ensured.ssn_last_4).toBe('1234');
      expect(ensured.primary_address.city).toBe('Austin');
      expect(ensured.primary_address.street).toBe('650 N Academy St');
    });
  });

  describe('applyUserCreateIdentityToPayload', () => {
    it('does not add identity objects for non-CRA payloads', () => {
      const payload = applyUserCreateIdentityToPayload({ client_user_id: 'flash_user_1' });
      expect(payload).toEqual({ client_user_id: 'flash_user_1' });
    });

    it('completes an existing identity object without dropping required fields', () => {
      const payload = applyUserCreateIdentityToPayload({
        client_user_id: 'flash_user_3',
        identity: { name: { given_name: 'Ada' } },
      });
      expect(payload.identity.name).toEqual({ given_name: 'Ada', family_name: 'User' });
      expect(payload.identity.date_of_birth).toBe(DEFAULT_USER_CREATE_IDENTITY.date_of_birth);
      expect(payload.identity.emails).toEqual(DEFAULT_USER_CREATE_IDENTITY.emails);
      expect(payload.identity.phone_numbers).toEqual(DEFAULT_USER_CREATE_IDENTITY.phone_numbers);
      expect(payload.identity.addresses).toEqual(DEFAULT_USER_CREATE_IDENTITY.addresses);
      expect(payload.identity.id_numbers).toEqual(DEFAULT_USER_CREATE_IDENTITY.id_numbers);
      expect(payload.consumer_report_user_identity).toBeUndefined();
    });

    it('completes an existing consumer_report_user_identity object', () => {
      const payload = applyUserCreateIdentityToPayload({
        client_user_id: 'flash_user_2',
        consumer_report_user_identity: { first_name: 'Ada' },
      });
      expect(payload.identity).toBeUndefined();
      expect(payload.consumer_report_user_identity.first_name).toBe('Ada');
      expect(payload.consumer_report_user_identity.last_name).toBe('User');
      expect(payload.consumer_report_user_identity.ssn_last_4).toBe('1234');
      expect(payload.consumer_report_user_identity.emails).toEqual(
        DEFAULT_CONSUMER_REPORT_USER_IDENTITY.emails
      );
      expect(payload.consumer_report_user_identity.phone_numbers).toEqual(
        DEFAULT_CONSUMER_REPORT_USER_IDENTITY.phone_numbers
      );
    });
  });

  describe('buildUserCreateConfig', () => {
    it('omits identity objects for non-CRA /user/create', () => {
      expect(buildUserCreateConfig({ client_user_id: 'multi_item_user_1' })).toEqual({
        client_user_id: 'multi_item_user_1',
      });
    });

    it('builds a complete CRA identity payload', () => {
      expect(
        buildUserCreateConfig({
          client_user_id: 'flash_user_1',
          includeCraIdentity: true,
        })
      ).toEqual({
        client_user_id: 'flash_user_1',
        identity: DEFAULT_USER_CREATE_IDENTITY,
      });
    });

    it('builds a complete CRA legacy payload', () => {
      expect(
        buildUserCreateConfig({
          client_user_id: 'flash_user_1',
          includeCraIdentity: true,
          useLegacyUserToken: true,
        })
      ).toEqual({
        client_user_id: 'flash_user_1',
        consumer_report_user_identity: DEFAULT_CONSUMER_REPORT_USER_IDENTITY,
      });
    });
  });
});

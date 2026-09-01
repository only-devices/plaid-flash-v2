import { parseHostedLinkPublicTokens } from '@/lib/hostedLinkPublicTokens';

describe('parseHostedLinkPublicTokens', () => {
  it('accepts a single public- token string', () => {
    expect(parseHostedLinkPublicTokens('public-sandbox-abc')).toEqual(['public-sandbox-abc']);
    expect(parseHostedLinkPublicTokens('  public-production-xyz  ')).toEqual(['public-production-xyz']);
  });

  it('accepts a JSON string beginning with public-', () => {
    expect(parseHostedLinkPublicTokens('"public-sandbox-abc"')).toEqual(['public-sandbox-abc']);
  });

  it('accepts a public_tokens array and returns each token', () => {
    expect(
      parseHostedLinkPublicTokens(
        JSON.stringify({ public_tokens: ['public-one', 'public-two'] })
      )
    ).toEqual(['public-one', 'public-two']);
  });

  it('reads public_tokens from a larger JSON object', () => {
    expect(
      parseHostedLinkPublicTokens(
        JSON.stringify({
          webhook_type: 'LINK',
          webhook_code: 'SESSION_FINISHED',
          public_tokens: ['public-from-webhook'],
        })
      )
    ).toEqual(['public-from-webhook']);
  });

  it('rejects empty input and non-public strings', () => {
    expect(() => parseHostedLinkPublicTokens('')).toThrow(/public_token/);
    expect(() => parseHostedLinkPublicTokens('access-sandbox-abc')).toThrow(/public-/);
    expect(() => parseHostedLinkPublicTokens('{')).toThrow(/public_tokens array/);
    expect(() => parseHostedLinkPublicTokens(JSON.stringify({ tokens: ['public-a'] }))).toThrow(
      /public_tokens array/
    );
    expect(() => parseHostedLinkPublicTokens(JSON.stringify({ public_tokens: [] }))).toThrow(
      /at least one/
    );
  });
});

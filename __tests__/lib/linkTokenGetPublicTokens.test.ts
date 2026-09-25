import { extractPublicTokensFromLinkTokenGet } from '@/lib/linkTokenGetPublicTokens';

describe('extractPublicTokensFromLinkTokenGet', () => {
  it('reads public_token from every link session item_add_results entry', () => {
    expect(
      extractPublicTokensFromLinkTokenGet({
        link_sessions: [
          { results: { item_add_results: [] } },
          {
            results: {
              item_add_results: [
                { public_token: 'public-one' },
                { public_token: 'public-two' },
              ],
            },
          },
        ],
      })
    ).toEqual(['public-one', 'public-two']);
  });

  it('reads a singular item_add_result object or array', () => {
    expect(
      extractPublicTokensFromLinkTokenGet({
        link_sessions: [
          {
            results: {
              item_add_result: { public_token: 'public-single' },
            },
          },
        ],
      })
    ).toEqual(['public-single']);

    expect(
      extractPublicTokensFromLinkTokenGet({
        results: {
          item_add_result: [{ public_token: 'public-a' }, { public_token: 'public-b' }],
        },
      })
    ).toEqual(['public-a', 'public-b']);
  });

  it('reads tokens and public_tokens arrays of strings or objects', () => {
    expect(
      extractPublicTokensFromLinkTokenGet({
        link_sessions: [
          {
            results: {
              tokens: ['public-from-tokens', { public_token: 'public-from-token-object' }],
              public_tokens: ['public-from-public-tokens'],
            },
          },
        ],
      })
    ).toEqual(['public-from-tokens', 'public-from-token-object', 'public-from-public-tokens']);
  });

  it('falls back to on_success.public_token and dedupes', () => {
    expect(
      extractPublicTokensFromLinkTokenGet({
        link_sessions: [
          {
            results: { item_add_results: [{ public_token: 'public-same' }] },
            on_success: { public_token: 'public-same' },
          },
          { on_success: { public_token: 'public-legacy' } },
        ],
      })
    ).toEqual(['public-same', 'public-legacy']);
  });

  it('returns an empty list when the session has not produced tokens yet', () => {
    expect(extractPublicTokensFromLinkTokenGet({ link_sessions: [{ results: {} }] })).toEqual([]);
    expect(extractPublicTokensFromLinkTokenGet(null)).toEqual([]);
  });
});
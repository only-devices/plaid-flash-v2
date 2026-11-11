import { ensurePlaidLinkScript, PLAID_LINK_INITIALIZE_SRC } from '@/lib/plaidLinkScript';

describe('ensurePlaidLinkScript', () => {
  beforeEach(() => {
    document.head.querySelectorAll(`script[src="${PLAID_LINK_INITIALIZE_SRC}"]`).forEach((node) => {
      node.remove();
    });
  });

  it('inserts link-initialize.js once', () => {
    ensurePlaidLinkScript();
    ensurePlaidLinkScript();

    const scripts = document.head.querySelectorAll(`script[src="${PLAID_LINK_INITIALIZE_SRC}"]`);
    expect(scripts).toHaveLength(1);
    expect((scripts[0] as HTMLScriptElement).async).toBe(true);
  });
});

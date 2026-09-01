/**
 * Parse the Hosted Link paste box. Accepts either a lone public_token
 * (`public-…`) or JSON that contains a `public_tokens` array.
 */
export function parseHostedLinkPublicTokens(payloadText: string): string[] {
  const text = payloadText.trim();
  if (!text) {
    throw new Error('Paste a public_token or a public_tokens array');
  }

  if (text.startsWith('public-')) {
    return [text];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Expected a public- token or JSON with a public_tokens array');
  }

  if (typeof parsed === 'string') {
    const token = parsed.trim();
    if (token.startsWith('public-')) return [token];
    throw new Error('Expected a string beginning with public-');
  }

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const raw = (parsed as { public_tokens?: unknown }).public_tokens;
    if (!Array.isArray(raw)) {
      throw new Error('Expected a public_tokens array');
    }
    const tokens = raw
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.trim())
      .filter((t) => t.startsWith('public-') && t.length > 0);
    if (tokens.length === 0) {
      throw new Error('public_tokens must contain at least one public- token');
    }
    return tokens;
  }

  throw new Error('Expected a public- token or JSON with a public_tokens array');
}

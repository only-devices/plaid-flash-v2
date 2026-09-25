/**
 * Pull public tokens out of a /link/token/get response.
 *
 * Hosted Link sessions put them on each link session result:
 * - results.item_add_results[].public_token
 * - results.item_add_result.public_token (object or array)
 * - results.tokens / results.public_tokens
 * Legacy sessions may only have on_success.public_token.
 */
function addToken(tokens: string[], seen: Set<string>, value: unknown) {
  if (typeof value !== 'string') return;
  const token = value.trim();
  if (!token.startsWith('public-') || seen.has(token)) return;
  seen.add(token);
  tokens.push(token);
}

function collectEntry(tokens: string[], seen: Set<string>, entry: unknown) {
  if (typeof entry === 'string') {
    addToken(tokens, seen, entry);
    return;
  }
  if (!entry || typeof entry !== 'object') return;
  const record = entry as Record<string, unknown>;
  addToken(tokens, seen, record.public_token);
  for (const key of ['tokens', 'public_tokens'] as const) {
    const raw = record[key];
    if (!Array.isArray(raw)) continue;
    for (const item of raw) collectEntry(tokens, seen, item);
  }
}

function collectBucket(tokens: string[], seen: Set<string>, bucket: unknown) {
  if (Array.isArray(bucket)) {
    for (const item of bucket) collectEntry(tokens, seen, item);
    return;
  }
  collectEntry(tokens, seen, bucket);
}

function collectResults(tokens: string[], seen: Set<string>, results: unknown) {
  if (!results || typeof results !== 'object') return;
  const record = results as Record<string, unknown>;
  collectBucket(tokens, seen, record.item_add_results);
  collectBucket(tokens, seen, record.item_add_result);
  collectBucket(tokens, seen, record.tokens);
  collectBucket(tokens, seen, record.public_tokens);
}

export function extractPublicTokensFromLinkTokenGet(data: unknown): string[] {
  const tokens: string[] = [];
  const seen = new Set<string>();
  if (!data || typeof data !== 'object') return tokens;

  const root = data as Record<string, unknown>;
  collectResults(tokens, seen, root.results);
  collectBucket(tokens, seen, root.tokens);
  collectBucket(tokens, seen, root.public_tokens);
  addToken(tokens, seen, root.public_token);

  const sessions = Array.isArray(root.link_sessions) ? root.link_sessions : [];
  for (const session of sessions) {
    if (!session || typeof session !== 'object') continue;
    const record = session as Record<string, unknown>;
    collectResults(tokens, seen, record.results);
    const onSuccess = record.on_success;
    if (onSuccess && typeof onSuccess === 'object') {
      addToken(tokens, seen, (onSuccess as Record<string, unknown>).public_token);
    }
  }

  return tokens;
}

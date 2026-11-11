export const PLAID_LINK_INITIALIZE_SRC =
  'https://cdn.plaid.com/link/v2/stable/link-initialize.js';

/**
 * Insert link-initialize.js once, before react-plaid-link's hook runs.
 * That hook's effect removes an in-flight script on React Strict Mode's
 * simulated unmount and then inserts a second copy. Plaid warns when the
 * script executes more than once. An existing tag is reused instead.
 */
export function ensurePlaidLinkScript(): void {
  if (typeof document === 'undefined') return;
  const selector = `script[src="${PLAID_LINK_INITIALIZE_SRC}"]`;
  if (document.querySelector(selector)) return;
  const script = document.createElement('script');
  script.src = PLAID_LINK_INITIALIZE_SRC;
  script.async = true;
  document.head.appendChild(script);
}

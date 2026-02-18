export function generateClientUserId(prefix: string = 'flash_user_') {
  const rand = Math.random().toString(16).slice(2, 12);
  return `${prefix}${rand}`;
}


import { generateClientUserId } from '@/lib/generateClientUserId';

describe('generateClientUserId', () => {
  it('generates a string with default prefix', () => {
    const id = generateClientUserId();
    expect(id).toMatch(/^flash_user_[0-9a-f]+$/);
  });

  it('uses the default prefix when none is provided', () => {
    const id = generateClientUserId();
    expect(id.startsWith('flash_user_')).toBe(true);
  });

  it('uses a custom prefix when provided', () => {
    const id = generateClientUserId('custom_');
    expect(id.startsWith('custom_')).toBe(true);
  });

  it('generates unique IDs on subsequent calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateClientUserId());
    }
    // With 100 calls, we should have close to 100 unique IDs
    // (extremely unlikely to have collisions with 10-char hex)
    expect(ids.size).toBe(100);
  });

  it('generates IDs with hex suffix of expected length', () => {
    const id = generateClientUserId();
    const suffix = id.replace('flash_user_', '');
    // Math.random().toString(16).slice(2, 12) produces up to 10 hex chars
    expect(suffix.length).toBeLessThanOrEqual(10);
    expect(suffix.length).toBeGreaterThan(0);
    expect(suffix).toMatch(/^[0-9a-f]+$/);
  });

  it('handles empty string prefix', () => {
    const id = generateClientUserId('');
    expect(id).toMatch(/^[0-9a-f]+$/);
  });
});

/**
 * Helpers for gating live integration tests.
 *
 * Live tests are skipped unless RUN_LIVE_TESTS=true AND the required API key is set.
 * This lets `npm test` run safely with no keys, while `npm run test:live` exercises
 * the real engines when keys are present.
 */

export function liveEnabled(): boolean {
  return process.env.RUN_LIVE_TESTS === "true";
}

export function hasKey(name: string): boolean {
  const v = process.env[name];
  return !!v && v.length > 0 && !v.startsWith("placeholder");
}

export function liveReady(keyName: string): boolean {
  return liveEnabled() && hasKey(keyName);
}

/** Returns a describe-skip-reason string when the suite should be skipped. */
export function skipReason(keyName: string): string | null {
  if (!liveEnabled()) return "RUN_LIVE_TESTS is not true";
  if (!hasKey(keyName)) return `${keyName} is missing from .env.local`;
  return null;
}

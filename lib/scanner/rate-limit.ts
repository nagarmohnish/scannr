interface Entry {
  count: number;
  resetTime: number;
}

export interface RateLimiter {
  /** Returns true if the request is allowed; false if blocked. */
  check(key: string): boolean;
  reset(): void;
  /** Internal — exposed for tests. */
  _peek(key: string): Entry | undefined;
}

export function createRateLimiter(opts: {
  max: number;
  windowMs: number;
  now?: () => number;
}): RateLimiter {
  const { max, windowMs } = opts;
  const now = opts.now ?? (() => Date.now());
  const store = new Map<string, Entry>();

  return {
    check(key) {
      const t = now();
      const entry = store.get(key);
      if (!entry || t > entry.resetTime) {
        store.set(key, { count: 1, resetTime: t + windowMs });
        return true;
      }
      if (entry.count >= max) return false;
      entry.count++;
      return true;
    },
    reset() {
      store.clear();
    },
    _peek(key) {
      return store.get(key);
    },
  };
}

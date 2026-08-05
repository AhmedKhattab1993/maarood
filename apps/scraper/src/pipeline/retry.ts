/**
 * Minimal retry-with-backoff helper. No external deps.
 * Exponential delay with jitter so concurrent crawls don't thunder-herd.
 */

export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
}

const DEFAULTS: RetryOptions = { retries: 3, baseDelayMs: 1000 };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: Partial<RetryOptions> = {},
): Promise<T> {
  const { retries, baseDelayMs } = { ...DEFAULTS, ...opts };
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      const jitter = Math.random() * baseDelayMs;
      const delay = baseDelayMs * 2 ** attempt + jitter;
      await sleep(delay);
    }
  }
  throw lastError;
}

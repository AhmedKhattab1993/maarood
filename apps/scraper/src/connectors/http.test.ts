import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchMerchantJson } from './http';

const originalFetch = globalThis.fetch;

/**
 * The helper is curl-first: Node fetch is only used when the curl binary does
 * not exist (ENOENT), e.g. in serverless sandboxes. Both transports matter.
 */

/**
 * execFile mock that mirrors the real one's promisify contract: resolving
 * { stdout } on success. `impl` receives (cmd, args, opts, cb).
 */
const execFileImpl = vi.fn();

vi.mock('node:child_process', async () => {
  const { promisify } = await import('node:util');
  const fn = Object.assign(
    (cmd: string, args: string[], opts: unknown, cb: (err: Error | null, stdout?: string) => void) =>
      execFileImpl(cmd, args, opts, cb),
    {
      [promisify.custom]: (cmd: string, args: string[], opts: unknown) =>
        new Promise<{ stdout: string }>((resolve, reject) => {
          execFileImpl(cmd, args, opts, (err: Error | null, stdout?: string) => {
            if (err) reject(err);
            else resolve({ stdout: stdout ?? '' });
          });
        }),
    },
  );
  return { execFile: fn };
});

describe('fetchMerchantJson', () => {
  beforeEach(() => {
    execFileImpl.mockReset();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('falls back to Node fetch when curl is not installed (ENOENT)', async () => {
    execFileImpl.mockImplementation(
      (_c: string, _a: string[], _o: unknown, cb: (err: Error | null) => void) => {
        const err = new Error('spawn curl ENOENT') as NodeJS.ErrnoException;
        err.code = 'ENOENT';
        cb(err);
      },
    );

    const fetchMock = vi.fn(async () => new Response('{"ok":true}', { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await fetchMerchantJson('https://example.com/products.json', 5);
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not fall back to fetch when curl fails for a real reason (non-ENOENT)', async () => {
    execFileImpl.mockImplementation(
      (_c: string, _a: string[], _o: unknown, cb: (err: Error | null) => void) => {
        cb(new Error('curl: (22) The requested URL returned error: 403'));
      },
    );

    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(fetchMerchantJson('https://example.com/products.json', 5)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses curl and parses its JSON output when curl succeeds', async () => {
    execFileImpl.mockImplementation(
      (_c: string, _a: string[], _o: unknown, cb: (err: Error | null, stdout?: string) => void) => {
        cb(null, '{"via":"curl"}');
      },
    );

    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await fetchMerchantJson('https://example.com/products.json', 5);
    expect(result).toEqual({ via: 'curl' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

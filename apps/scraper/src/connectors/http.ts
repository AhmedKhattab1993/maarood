/**
 * Shared HTTP fetch for store connectors.
 *
 * Curl-first: several merchants sit behind Cloudflare, which fingerprints
 * Node's TLS stack and serves a sanitized feed (discounts stripped). curl's
 * TLS fingerprint receives the true product payload.
 *
 * Fetch-fallback: in sandboxes where the curl binary does not exist (e.g.
 * serverless functions), fall back to Node fetch. Verified to work against
 * all current merchants; revisit if a store starts sanitizing.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** curl's exit code when the binary is not found is ENOENT before any exec. */
function isMissingBinary(err: unknown): boolean {
  return (
    err instanceof Error &&
    ('code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT')
  );
}

async function curlJson(url: string, timeoutS: number): Promise<unknown> {
  const { stdout } = await execFileAsync(
    'curl',
    [
      '-sS',
      '--fail',
      '--max-time',
      String(timeoutS),
      '-H',
      'accept: application/json',
      '-A',
      USER_AGENT,
      url,
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  return JSON.parse(stdout);
}

async function nodeFetchJson(url: string, timeoutS: number): Promise<unknown> {
  const res = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': USER_AGENT },
    signal: AbortSignal.timeout(timeoutS * 1000),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

/** Fetch JSON from a merchant URL: curl when available, Node fetch otherwise. */
export async function fetchMerchantJson(
  url: string,
  timeoutS: number,
): Promise<unknown> {
  try {
    return await curlJson(url, timeoutS);
  } catch (err) {
    if (isMissingBinary(err)) {
      return nodeFetchJson(url, timeoutS);
    }
    throw err;
  }
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidateFollowing, listFollowing } from './auth';
import { invalidateSaved, listSaved } from './saved';

describe('account collection caches', () => {
  let token = 'account-a';
  const fetcher = vi.fn();
  beforeEach(() => {
    token = 'account-a';
    invalidateFollowing();
    invalidateSaved();
    fetcher.mockReset();
    vi.stubGlobal('window', { localStorage: { getItem: () => token } });
    vi.stubGlobal('fetch', fetcher);
  });
  afterEach(() => vi.unstubAllGlobals());

  for (const collection of ['saved', 'following'] as const) {
    const load = collection === 'saved' ? listSaved : listFollowing;
    const response = (id: string) =>
      new Response(
        JSON.stringify(
          collection === 'saved' ? [{ product: { id } }] : { items: [{ merchantId: id }] },
        ),
        { status: 200 },
      );

    it(`${collection} retries a failed request instead of caching its rejection`, async () => {
      fetcher.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: 'unavailable', message: 'Temporary failure' } }),
          { status: 503 },
        ),
      );
      await expect(load()).rejects.toThrow('Temporary failure');
      fetcher.mockResolvedValueOnce(response('recovered'));
      expect(await load()).toHaveLength(1);
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it(`${collection} shares requests only inside the same account`, async () => {
      fetcher.mockResolvedValueOnce(response('first'));
      const first = await load();
      expect(await load()).toEqual(first);
      expect(fetcher).toHaveBeenCalledTimes(1);
      token = 'account-b';
      fetcher.mockResolvedValueOnce(response('second'));
      expect(await load()).not.toEqual(first);
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  }
});

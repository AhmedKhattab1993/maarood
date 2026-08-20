import { describe, it, expect, vi } from 'vitest';
import type { Pool, PoolClient } from 'pg';
import { CrawlService, type CrawlRunner } from './crawl.service';
import type { CrawlSummary } from '@maarood/scraper';
import type { DrizzleDB } from '../db/db.module';

/** Minimal fake of a pg PoolClient — only query() and release() are used. */
function makeClient(locked: boolean) {
  return {
    query: vi.fn(async () => ({ rows: [{ locked }] })),
    release: vi.fn(),
  } as unknown as PoolClient & { query: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn> };
}

function makeService(client: PoolClient, runner: CrawlRunner, db: DrizzleDB = {} as DrizzleDB) {
  const pool = { connect: vi.fn(async () => client) } as unknown as Pool;
  return {
    service: new CrawlService(db, pool, runner),
    runner,
  };
}

const SUMMARY: CrawlSummary = { crawled: 2, skipped: 1, failed: 0, completed: true };

describe('CrawlService', () => {
  it('runs the crawl and returns the summary when the advisory lock is acquired', async () => {
    const client = makeClient(true);
    const { service, runner } = makeService(client, vi.fn(async () => SUMMARY));

    const result = await service.triggerCrawl();

    expect(result).toEqual({ started: true, summary: SUMMARY });
    expect(runner).toHaveBeenCalledTimes(1);

    // Deadline is a near-future timestamp under the 700s budget.
    const opts = (runner as ReturnType<typeof vi.fn>).mock.calls[0]![1] as { deadlineMs: number };
    expect(opts.deadlineMs).toBeGreaterThan(Date.now() - 5_000);
    expect(opts.deadlineMs).toBeLessThanOrEqual(Date.now() + 700_001);

    // Lock acquired, then released; client returned to the pool.
    expect(client.query).toHaveBeenCalledTimes(2);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('reports already-running without crawling when the advisory lock is busy', async () => {
    const client = makeClient(false);
    const { service, runner } = makeService(client, vi.fn(async () => SUMMARY));

    const result = await service.triggerCrawl();

    expect(result).toEqual({ started: false, reason: 'crawl_already_running' });
    expect(runner).not.toHaveBeenCalled();
    // Only the lock attempt ran — no unlock for a lock we do not hold.
    expect(client.query).toHaveBeenCalledTimes(1);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('releases the lock and client even when the crawl throws', async () => {
    const client = makeClient(true);
    const { service } = makeService(client, vi.fn(async () => {
      throw new Error('connector exploded');
    }));

    await expect(service.triggerCrawl()).rejects.toThrow('connector exploded');

    expect(client.query).toHaveBeenCalledTimes(2); // lock + unlock
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { CRAWL_INTERVAL_MS, runScheduledTick, type TickState } from './schedule-tick';

describe('CRAWL_INTERVAL_MS', () => {
  it('matches the production 6-hour Vercel cron', () => {
    expect(CRAWL_INTERVAL_MS).toBe(6 * 60 * 60 * 1000);
    const vercel = JSON.parse(
      readFileSync(new URL('../../../apps/web/vercel.json', import.meta.url), 'utf8'),
    ) as { crons: { schedule: string }[] };
    expect(vercel.crons[0]?.schedule).toBe('0 */6 * * *');
  });
});

describe('runScheduledTick', () => {
  it('runs crawl when idle', async () => {
    const state: TickState = { running: false };
    let calls = 0;
    const status = await runScheduledTick(async () => {
      calls += 1;
    }, state);
    expect(status).toBe('ran');
    expect(calls).toBe(1);
    expect(state.running).toBe(false);
  });

  it('skips when a tick is already running', async () => {
    const state: TickState = { running: true };
    let calls = 0;
    const status = await runScheduledTick(async () => {
      calls += 1;
    }, state);
    expect(status).toBe('skipped');
    expect(calls).toBe(0);
    expect(state.running).toBe(true);
  });
});

/** Matches apps/web/vercel.json: cron every 6 hours. */
export const CRAWL_INTERVAL_MS = 6 * 60 * 60 * 1000;

export interface TickState {
  running: boolean;
}

/** Skip if a previous tick is still crawling (first full run can exceed 6h). */
export async function runScheduledTick(
  crawl: () => Promise<unknown>,
  state: TickState,
): Promise<'ran' | 'skipped'> {
  if (state.running) return 'skipped';
  state.running = true;
  try {
    await crawl();
    return 'ran';
  } finally {
    state.running = false;
  }
}

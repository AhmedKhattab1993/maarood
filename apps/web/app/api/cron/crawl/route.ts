/**
 * Cron entrypoint for the crawl workflow (Vercel Cron → GET every 6h).
 *
 * Auth: Vercel sends `Authorization: Bearer ${CRON_SECRET}`; compare in
 * constant time. start() enqueues the durable workflow run and returns
 * immediately — the crawl itself is not bound by this request's duration.
 */

import { timingSafeEqual } from 'node:crypto';
import { start } from 'workflow/api';
import { crawlAll } from '@/workflows/crawl';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') ?? '';
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const run = await start(crawlAll);
  return Response.json({ started: true, runId: run.runId });
}

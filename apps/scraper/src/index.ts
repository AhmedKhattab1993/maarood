/**
 * Library entrypoint for @maarood/scraper.
 *
 * The backend service imports the pipeline from here to run crawls in-process
 * (Vercel Cron -> GET /admin/crawl -> crawlDueMerchants). The CLI entrypoints
 * (main.js, run-all.js) are unaffected.
 */

export { runPipeline, type PipelineCounts } from './pipeline/run-pipeline';
export { getDueMerchants, crawlDueMerchants, type CrawlDueOptions, type CrawlSummary } from './crawl-due';
export { createDb, type DbHandle, type ScraperDb } from './db';

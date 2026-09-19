/**
 * Fetch merchant-site branding and persist `merchants.logo_url`.
 * Failures are non-fatal: the posting card keeps the initial-letter avatar.
 */

import { eq } from 'drizzle-orm';
import { merchants } from '@maarood/schema';
import type { ScraperDb } from '../db';
import { fetchMerchantJson, fetchMerchantText } from '../connectors/http';
import { magentoStoreConfigUrl } from '../connectors/magento/magento.query';
import { extractLogoUrl } from './extract-logo';

const FETCH_TIMEOUT_S = 30;

function merchantHomeUrl(domain: string): string {
  const host = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `https://${host}/`;
}

export async function discoverMerchantLogoUrl(
  domain: string,
  connectorType: string,
): Promise<string | null> {
  const baseUrl = merchantHomeUrl(domain);
  if (connectorType === 'magento') {
    try {
      const json = await fetchMerchantJson(magentoStoreConfigUrl(domain), FETCH_TIMEOUT_S);
      const fromJson = extractLogoUrl(json, baseUrl);
      if (fromJson) return fromJson;
    } catch {
      // Homepage HTML / favicon still apply when GraphQL has no logo src.
    }
  }
  try {
    const html = await fetchMerchantText(baseUrl, FETCH_TIMEOUT_S);
    return extractLogoUrl(html, baseUrl);
  } catch {
    return null;
  }
}

export async function persistMerchantLogo(
  db: ScraperDb,
  merchant: { id: string; domain: string; connectorType: string },
): Promise<string | null> {
  const logoUrl = await discoverMerchantLogoUrl(merchant.domain, merchant.connectorType);
  if (!logoUrl) return null;
  await db.update(merchants).set({ logoUrl }).where(eq(merchants.id, merchant.id));
  return logoUrl;
}

export async function refreshAllMerchantLogos(
  db: ScraperDb,
): Promise<{ slug: string; logoUrl: string | null }[]> {
  const rows = await db.select().from(merchants).where(eq(merchants.optedOut, false));
  const out: { slug: string; logoUrl: string | null }[] = [];
  for (const m of rows) {
    try {
      const logoUrl = await persistMerchantLogo(db, m);
      console.log(`logo '${m.slug}': ${logoUrl ?? '(none)'}`);
      out.push({ slug: m.slug, logoUrl });
    } catch (err) {
      console.log(
        `logo '${m.slug}': failed ${err instanceof Error ? err.message : String(err)}`,
      );
      out.push({ slug: m.slug, logoUrl: null });
    }
  }
  return out;
}

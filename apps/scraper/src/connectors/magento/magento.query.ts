/**
 * Magento GraphQL products URL (GET). Live Mobaco rejects POST /graphql
 * (empty-body EOF) but accepts GET ?query=.
 */

export const MAGENTO_PAGE_SIZE = 50;

export function magentoProductsQuery(currentPage: number, pageSize: number): string {
  return (
    `{products(search:"",pageSize:${pageSize},currentPage:${currentPage})` +
    `{total_count page_info{current_page page_size total_pages}` +
    `items{sku name url_key stock_status image{url}small_image{url}thumbnail{url}` +
    `media_gallery{url label}` +
    `price_range{minimum_price{regular_price{value currency}final_price{value currency}}}` +
    `categories{name}description{html}short_description{html}` +
    `...on ConfigurableProduct{variants{product{sku stock_status ` +
    `price_range{minimum_price{regular_price{value}final_price{value}}}}` +
    `attributes{label code}}}}}}`
  );
}

function magentoHost(domain: string): string {
  return domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export function magentoProductsUrl(
  domain: string,
  currentPage: number,
  pageSize: number = MAGENTO_PAGE_SIZE,
): string {
  const query = magentoProductsQuery(currentPage, pageSize);
  return `https://${magentoHost(domain)}/graphql?query=${encodeURIComponent(query)}`;
}

export function magentoStoreConfigQuery(): string {
  return '{storeConfig{header_logo_src secure_base_media_url}}';
}

export function magentoStoreConfigUrl(domain: string): string {
  const query = magentoStoreConfigQuery();
  return `https://${magentoHost(domain)}/graphql?query=${encodeURIComponent(query)}`;
}

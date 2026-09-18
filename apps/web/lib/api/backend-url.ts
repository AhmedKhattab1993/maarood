/**
 * Backend origins used by SSR fetches, outbound-click hrefs, and the
 * browser saved-products client. Local fallback is loopback; production
 * and public-IP serving set BACKEND_URL / NEXT_PUBLIC_BACKEND_URL.
 */

const LOCAL_BACKEND = "http://localhost:8080";

/** Origin used by Server Components and redirect hrefs rendered into HTML. */
export function serverBackendUrl(env?: NodeJS.ProcessEnv): string {
  const value = (env?.BACKEND_URL ?? process.env.BACKEND_URL)?.trim();
  return value && value.length > 0 ? value.replace(/\/$/, "") : LOCAL_BACKEND;
}

/** Origin used by client-side fetch (saved products). Inlined as NEXT_PUBLIC_*. */
export function publicBackendUrl(env?: NodeJS.ProcessEnv): string {
  // Direct `process.env.NEXT_PUBLIC_*` access so Next inlines it in the client bundle.
  const value = (
    env?.NEXT_PUBLIC_BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL
  )?.trim();
  return value && value.length > 0 ? value.replace(/\/$/, "") : LOCAL_BACKEND;
}

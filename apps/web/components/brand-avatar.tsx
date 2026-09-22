'use client';

import { useState } from 'react';

/**
 * Brand logo with a letter-avatar fallback for missing or broken images.
 * The logo is a plain <img> to the merchant CDN — Next's optimizer 400s on
 * arbitrary Shopify/Woo/Magento hosts (`/_next/image?url=...`).
 */
export function BrandAvatar({
  name,
  logoUrl,
  size = 40,
}: {
  name: string;
  logoUrl?: string | null;
  /** Rendered edge length in px; the fallback letter scales with it. */
  size?: number;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = logoUrl && !logoFailed;
  return showLogo ? (
    <img
      src={logoUrl}
      alt=""
      width={size}
      height={size}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setLogoFailed(true)}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full border border-stone-grey/70 bg-white object-contain p-1"
    />
  ) : (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.35) }}
      className="flex shrink-0 items-center justify-center rounded-full border border-maaroud-blue/10 bg-blue-soft font-semibold text-maaroud-blue"
    >
      {name.trim().charAt(0)}
    </span>
  );
}

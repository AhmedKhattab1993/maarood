import { fileURLToPath } from "node:url";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";
import { withWorkflow } from "workflow/next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const tokensDist = fileURLToPath(
  new URL("./node_modules/@maarood/tokens/dist", import.meta.url),
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile workspace packages so Next's compiler sees their source/dist.
  transpilePackages: ["@maarood/tokens", "@maarood/schema", "@maarood/scraper"],
  images: {
    // Product imagery is hosted on merchant CDNs (Shopify CDN etc.).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Workspace alias fallback so imports resolve during local development.
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@maarood/tokens": path.resolve(tokensDist),
    };
    return config;
  },
};

// withWorkflow enables the "use workflow" / "use step" directives (crawl host).
export default withWorkflow(withNextIntl(nextConfig));

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tests live next to source as *.test.ts. No DOM, node environment.
    environment: 'node',
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    // Backend sources import compiled @maarood/schema via workspaces symlink.
    // Resolve aliases so tests can import source TS without prior builds.
    alias: {
      '@maarood/schema': new URL('./packages/schema/src/index.ts', import.meta.url).pathname,
    },
  },
});

// The web app is linted by the repo-wide flat config (typescript-eslint
// recommended) via the root `eslint.config.mjs`. This file exists only to add
// Next.js-specific ignores; no rules are added to avoid a peer conflict with
// eslint-config-next (the repo standardizes on eslint 9 flat config).
export default [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts"],
  },
];

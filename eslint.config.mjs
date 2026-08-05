// Flat-config ESLint setup for the Maarood monorepo.
// Intentionally minimal — TypeScript recommended rules only.

import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/build/**'],
  },
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
    },
  },
);

import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    // exFAT/AppleDouble junk files (._foo.test.ts) match the default glob
    exclude: [...configDefaults.exclude, '**/._*'],
  },
});

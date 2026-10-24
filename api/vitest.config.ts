import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Starting Postgres + PostGIS in memory (PGlite) takes a few seconds.
    hookTimeout: 60_000,
    testTimeout: 20_000,
  },
})

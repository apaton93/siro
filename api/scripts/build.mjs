// Bundle the API (and workspace packages like @siro/db) into dist/index.js for Azure Functions.
// Usage: node scripts/build.mjs [--watch]
import { context, build } from 'esbuild'

const options = {
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  sourcemap: true,
  logLevel: 'info',
  // Provided by node_modules at runtime: the Functions SDK must not be bundled,
  // and pg-native is an optional pg dependency we don't use.
  external: ['@azure/functions', 'pg-native'],
}

if (process.argv.includes('--watch')) {
  const ctx = await context(options)
  await ctx.watch()
} else {
  await build(options)
}

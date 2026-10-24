// Entry point for the Azure Functions host (bundled by esbuild into dist/index.js).
// Every function module registers itself with app.http(...) when imported.
import './functions/health'
import './functions/fixtures'

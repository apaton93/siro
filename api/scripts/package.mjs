// Create a standalone Azure Functions folder for deployment: .deploy/api
// (npm workspaces hoist dependencies to the repo root, so Azure needs its own node_modules).
// Usage (from repo root, after `npm run build`): node api/scripts/package.mjs
import { execSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const apiDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(apiDir, '..', '.deploy', 'api')
const pkg = JSON.parse(readFileSync(join(apiDir, 'package.json'), 'utf8'))

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })
cpSync(join(apiDir, 'host.json'), join(outDir, 'host.json'))
cpSync(join(apiDir, 'dist'), join(outDir, 'dist'), { recursive: true })

// Everything else is bundled into dist/index.js – only the Functions SDK is needed at runtime.
writeFileSync(
  join(outDir, 'package.json'),
  JSON.stringify(
    {
      name: 'siro-api',
      private: true,
      main: 'dist/index.js',
      dependencies: { '@azure/functions': pkg.dependencies['@azure/functions'] },
    },
    null,
    2,
  ),
)

execSync('npm install --omit=dev --no-package-lock --no-workspaces --ignore-scripts --no-audit --no-fund', {
  cwd: outDir,
  stdio: 'inherit',
})
console.log(`Packaged API → ${outDir}`)

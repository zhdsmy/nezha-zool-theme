// Single-folder Nezha ZIP layout matching nezha-kumo-theme.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const app = fileURLToPath(new URL('../', import.meta.url))
const out = fileURLToPath(new URL('../../../release/', import.meta.url))
const { version } = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
assert(existsSync(join(app, 'dist/index.html')), 'Run pnpm build first')
mkdirSync(out, { recursive: true })
const stage = join(out, '.frontend-stage')
const name = `nezha-zool-frontend-v${version}.zip`
const file = join(out, name)
rmSync(stage, { recursive: true, force: true })
try {
  cpSync(join(app, 'dist'), join(stage, 'zool-dist'), {
    recursive: true,
    filter: (path) =>
      !['config.js', '.vite', 'size-report.json'].includes(path.split('/').at(-1)) &&
      !path.endsWith('.map'),
  })
  rmSync(file, { force: true })
  execFileSync('zip', ['-r', '-X', '-q', file, 'zool-dist'], { cwd: stage })
  const entries = execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' }).trim().split('\n')
  assert(entries.includes('zool-dist/index.html'), 'Missing Nezha index')
  assert(
    entries.every((entry) => entry.startsWith('zool-dist/')),
    'Expected one top-level folder',
  )
  assert(
    !entries.some(
      (entry) =>
        entry.endsWith('config.js') || entry.endsWith('.map') || entry.includes('.vite/'),
    ),
    'User config and source maps must stay out of ZIP',
  )
  execFileSync('unzip', ['-tq', file], { stdio: 'pipe' })
  const sha = createHash('sha256').update(readFileSync(file)).digest('hex')
  writeFileSync(join(out, `${name}.sha256`), `${sha}  ${name}\n`)
  console.log(
    `${file}\nsha256 ${sha}\n${entries.length} entries; config.js excluded; ZIP integrity passed`,
  )
} finally {
  rmSync(stage, { recursive: true, force: true })
}

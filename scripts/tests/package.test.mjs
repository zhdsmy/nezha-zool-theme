import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync,
  symlinkSync, truncateSync, utimesSync, writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let root
let script
let frontend

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'zool-package-'))
  script = join(root, 'scripts/package.py')
  mkdirSync(join(root, 'scripts'))
  copyFileSync(new URL('../package.py', import.meta.url), script)
  frontend = join(root, 'apps/frontend/dist')
  mkdirSync(frontend, { recursive: true })
  writeFileSync(join(frontend, 'index.html'), 'frontend')
})

afterEach(() => rmSync(root, { recursive: true, force: true }))

it('packages both installer ZIPs reproducibly and binds each checksum to its filename', () => {
  const admin = join(root, 'apps/admin/dist')
  mkdirSync(admin, { recursive: true })
  writeFileSync(join(admin, 'index.html'), 'admin')
  mkdirSync(join(frontend, '.vite'))
  mkdirSync(join(frontend, 'assets'))
  for (const name of ['config.js', 'assets/config.js', 'assets/site.js.map', '.vite/manifest.json', 'size-report.json']) {
    writeFileSync(join(frontend, name), 'excluded')
  }
  writeFileSync(join(frontend, 'assets/site.js'), 'site')
  const packages = [
    ['dist.zip', 'frontend', ['dist/assets/site.js', 'dist/index.html']],
    ['nezha-zool-admin-dist.zip', 'admin', ['dist/index.html']],
  ]
  execFileSync('python3', [script, 'frontend', 'admin'])
  const first = packages.map(([name]) => readFileSync(join(root, 'release', name)))
  for (const dist of [admin, frontend]) {
    const index = join(dist, 'index.html')
    utimesSync(index, 1_000_000_000, 1_000_000_000)
    chmodSync(index, 0o600)
  }
  execFileSync('python3', [script, 'frontend', 'admin'])
  for (const [i, [name, page, entries]] of packages.entries()) {
    const zip = join(root, 'release', name)
    expect(readFileSync(zip)).toEqual(first[i])
    expect(execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).trim().split('\n')).toEqual(entries)
    expect(execFileSync('unzip', ['-p', zip, 'dist/index.html'], { encoding: 'utf8' })).toBe(page)
    const digest = createHash('sha256').update(first[i]).digest('hex')
    expect(readFileSync(zip + '.sha256', 'utf8')).toBe(`${digest}  ${name}\n`)
  }
})

it.each([
  ['empty index', () => truncateSync(join(frontend, 'index.html'))],
  ['symlink', () => symlinkSync('index.html', join(frontend, 'linked'))],
  ['unsafe path', () => writeFileSync(join(frontend, 'bad:name.js'), '')],
  ['oversized build', () => truncateSync(join(frontend, 'index.html'), 256 * 1024 * 1024 + 1)],
])('rejects %s and preserves the previous ZIP and checksum', (_reason, invalidate) => {
  execFileSync('python3', [script, 'frontend'])
  const zip = join(root, 'release/dist.zip')
  const checksum = readFileSync(zip + '.sha256')
  const bytes = readFileSync(zip)
  invalidate()
  expect(spawnSync('python3', [script, 'frontend']).status).toBe(1)
  expect(readFileSync(zip)).toEqual(bytes)
  expect(readFileSync(zip + '.sha256')).toEqual(checksum)
})

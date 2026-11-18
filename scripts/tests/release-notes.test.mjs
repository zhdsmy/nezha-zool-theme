import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('../release_notes.py', import.meta.url))
let root

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'zool-notes-'))
  writeFileSync(join(root, 'CHANGELOG.md'), [
    '# Changelog', '## [Unreleased]', 'Future', '## [0.1.0] - date',
    '', '- Installer', '', '### Details', '发布', '## [0.0.1]', '', '## [0.0.0]', 'Old',
  ].join('\n'))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

it('extracts only the requested section and preserves its Markdown', () => {
  const result = spawnSync('python3', [script, 'v0.1.0'], { cwd: root, encoding: 'utf8' })
  expect(result.status).toBe(0)
  expect(result.stdout).toBe('- Installer\n\n### Details\n发布\n')
})

it.each(['v0.0.1', 'v9.9.9', 'v../bad'])('rejects empty, missing or invalid notes for %s', (tag) => {
  const result = spawnSync('python3', [script, tag], { cwd: root, encoding: 'utf8' })
  expect(result.status).toBe(1)
  expect(result.stdout).toBe('')
})

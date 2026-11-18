import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const css = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8')

it('keeps touch login fields at the iOS focus zoom threshold', () => {
  expect(css).toMatch(/@media \(pointer: coarse\)\s*\{\s*\.field\s*\{[^}]*font-size: 16px/)
})

it('gives the skip link a programmatically focusable destination', () => {
  const app = readFileSync(new URL('../src/app/App.tsx', import.meta.url), 'utf8')
  expect(app).toContain('href="#main"')
  expect(app).toMatch(/<main\b[^>]*\bid="main"[^>]*tabIndex=\{-1\}/)
})

it('allows node information values to wrap on desktop as well as mobile', () => {
  const page = readFileSync(new URL('../src/pages/NodePage.tsx', import.meta.url), 'utf8')
  const cell = page.match(/<dd className="node-info-dd[^"]+/)?.[0]
  expect(cell).toContain('wrap-anywhere')
  expect(cell).not.toContain('truncate')
})

it('keeps the latency legend and reset control at least 32px high', () => {
  const page = readFileSync(new URL('../src/pages/NodePage.tsx', import.meta.url), 'utf8')
  expect(page).toMatch(/node-ping-row[^"]*min-h-8/)
  expect(page).toMatch(/min-h-8 rounded-full[^"]+" onClick=\{\(\) => setShown\(null\)/)
})

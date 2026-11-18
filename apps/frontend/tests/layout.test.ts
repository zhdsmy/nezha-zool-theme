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

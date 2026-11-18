import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const css = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8')

it('keeps touch login fields at the iOS focus zoom threshold', () => {
  expect(css).toMatch(/@media \(pointer: coarse\)\s*\{\s*\.field\s*\{[^}]*font-size: 16px/)
})

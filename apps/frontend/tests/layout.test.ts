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

it('reserves 44px touch targets for header and chart controls', () => {
  expect(css).toMatch(/header \.icon-btn\s*\{\s*width: 44px;\s*height: 44px/)
  expect(css).toMatch(/@media \(pointer: coarse\)\s*\{\s*\.node-tabs[^}]*\.node-ping-list button[^}]*min-height: 44px/)
})

it('labels latency legend and detail readings with the same precision and unit', () => {
  const page = readFileSync(new URL('../src/pages/NodePage.tsx', import.meta.url), 'utf8')
  for (const reading of ['task.avg', 'task.min', 'task.max', 'solo.avg', 'solo.min', 'solo.max']) {
    expect(page).toContain(`formatLatency(${reading})`)
  }
})

it('lets long public notes and the search field fit a narrow viewport', () => {
  const node = readFileSync(new URL('../src/pages/NodePage.tsx', import.meta.url), 'utf8')
  const search = readFileSync(new URL('../src/components/SearchDialog.tsx', import.meta.url), 'utf8')
  expect(node).toMatch(/node-note[^"]*wrap-anywhere/)
  expect(search).toMatch(/<input\b[^>]*(?:[\s\S]*?)className="[^"]*min-w-0[^"]*flex-1/)
})

it('reserves the filtered empty message for a nonempty fleet', () => {
  const page = readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  expect(page).toContain("t(nodes.length ? 'toolbar.empty' : 'status.noNodes')")
})

it('retains touch readings after pointerup and dismisses them on an outside press', () => {
  const chart = readFileSync(new URL('../src/components/Chart.tsx', import.meta.url), 'utf8')
  expect(chart).toMatch(/onPointerUp=[\s\S]*?setPinned\(true\)/)
  expect(chart).toContain("document.addEventListener('pointerdown', dismiss)")
})

it('matches the process chart and swap legend to their actual series', () => {
  const page = readFileSync(new URL('../src/pages/NodePage.tsx', import.meta.url), 'utf8')
  expect(page).toMatch(/s\('process', t\('metric.process'\)[^\n]*p\.process/)
  expect(page).toMatch(/<SeriesDot color="var\(--chart-3\)"\s*\/>\{t\('metric.swap'\)\}/)
})

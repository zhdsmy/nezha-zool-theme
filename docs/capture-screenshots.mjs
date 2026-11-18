// Run pnpm screenshots, or NZT_DOCS_LANG=zh-CN pnpm screenshots.
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const docs = fileURLToPath(new URL('.', import.meta.url))
const fromAdmin = createRequire(new URL('../apps/admin/package.json', import.meta.url))
const { chromium } = fromAdmin('@playwright/test')
const { build, preview } = await import(fromAdmin.resolve('vite'))
const language = process.env.NZT_DOCS_LANG ?? 'en'
assert(['en', 'zh-CN'].includes(language), 'NZT_DOCS_LANG must be en or zh-CN')
const zh = language === 'zh-CN'
const locale = zh ? 'zh-CN' : 'en-US'
const date = '2026-11-16T12:32:00Z'
const out = join(docs, 'screenshots', zh ? 'zh-CN' : '')

const frontend = [
  // Filename, CSS viewport, demo node (home when omitted).
  ['frontend-ledger-light', 1440, 940],
  ['frontend-cards-dark', 1440, 980],
  ['frontend-node-light', 1440, 1180, 1],
  ['frontend-node-dark', 1440, 1180, 4],
  ['frontend-charts-dark', 1440, 980, 1],
  ['frontend-latency-light', 1440, 920, 1],
  ['frontend-tablet-light', 834, 1112],
  ['frontend-mobile-light', 390, 844],
  ['frontend-mobile-dark', 390, 844, 1],
]

const serverNames = ['Tokyo Edge', 'Hong Kong Relay', 'San Jose Core', 'Frankfurt Core', 'Singapore Edge', 'Lab Storage']
const servers = serverNames.map((name, i) => ({
  id: i + 1, name, display_index: 60 - i * 10,
  host: { version: '1.14.2' }, owner: { id: 1, username: 'lab' },
  geoip: { ip: { ipv4_addr: '192.0.2.' + (10 + i), ipv6_addr: '2001:db8::' + (10 + i) } },
  enable_ddns: i % 2 === 0, hide_for_guest: i === 5,
}))

const services = [
  [zh ? '边缘延迟' : 'Edge latency', '192.0.2.10', 2, 30],
  [zh ? '状态页面' : 'Status page', 'https://status.example.invalid/health', 1, 60],
  [zh ? '核心网关' : 'Core gateway', 'gateway.example.invalid:443', 3, 30],
  [zh ? '证书有效期' : 'Certificate expiry', 'status.example.invalid:443', 4, 300],
].map(([name, target, type, duration], i) => ({
  id: i + 1, name, target, type, duration, display_index: 40 - i * 10, cover: i % 2,
  skip_servers: i % 2 ? { 1: true, 4: true } : {}, notification_group_id: 1,
  latency_notify: true, max_latency: 150, enable_trigger_task: i === 1,
  fail_trigger_tasks: i === 1 ? [2] : [], recover_trigger_tasks: [],
}))

const alerts = [
  [zh ? '节点心跳' : 'Node heartbeat', 'offline', 0],
  [zh ? 'CPU 持续高负载' : 'Sustained CPU load', 'cpu', 90],
  [zh ? '磁盘使用率' : 'Disk utilization', 'disk', 85],
  [zh ? '内存使用率' : 'Memory utilization', 'memory', 90],
].map(([name, type, min], i) => ({
  id: i + 1, name, notification_group_id: 1, trigger_mode: i % 2, enable: true,
  rules: [{ type, min, duration: 120 }], fail_trigger_tasks: [], recover_trigger_tasks: [],
}))

const api = {
  profile: { id: 1, username: 'lab', role: 0 },
  setting: {
    config: {
      site_name: 'ZOOL Status', language: locale, user_template: 'zool', tls: true,
      install_host: 'agent.example.invalid:443', dashboard_host: 'status.example.invalid',
      dns_servers: '192.0.2.53', nat_member_domains: ['tunnel.example.invalid'],
      online_stats_days: 30, cover: 1, ip_change_notification_group_id: 1,
    },
    frontend_templates: [{ path: 'zool', name: 'ZOOL', author: 'Demo Lab', is_official: false }],
    version: '2.6.1',
  },
  server: servers,
  'server-group': [
    { group: { id: 1, name: 'Edge' }, servers: [1, 2, 5] },
    { group: { id: 2, name: 'Core' }, servers: [3, 4, 6] },
  ],
  'notification-group': [{ group: { id: 1, name: zh ? '值班组' : 'On call' }, notifications: [] }],
  'service/list': services,
  'alert-rule': alerts,
}

const admin = [
  // Filename, CSS viewport, dashboard route, evidence that its data arrived.
  ['admin-servers-light', 1440, 880, '', servers.at(-1).name],
  ['admin-servers-dark', 1440, 880, '', servers.at(-1).name],
  ['admin-services-light', 1440, 780, 'service', services.at(-1).name],
  ['admin-settings-dark', 1440, 960, 'settings'],
  ['admin-tablet-dark', 834, 980, 'alert-rule', alerts.at(-1).name],
  ['admin-mobile-light', 390, 844, '', servers.at(-1).name],
  ['admin-mobile-dark', 390, 844, '', servers.at(-1).name],
]

async function serve(app, temp, port) {
  assert(Number.isInteger(port) && port >= 1 && port <= 65535, 'Invalid ' + app + ' port')
  const root = resolve(docs, '../apps', app)
  const outDir = join(temp, app)
  // Tailwind discovers sources relative to the app's working directory.
  process.chdir(root)
  const demo = app === 'frontend'
  const base = demo ? '/' : '/dashboard/'
  await build({
    root, base, logLevel: 'warn', build: { outDir, emptyOutDir: true }, mode: demo ? 'demo' : 'production',
    resolve: demo ? { alias: { '@adapter': join(docs, 'screenshot-demo.ts') } } : undefined,
  })
  // Serve only the static build. The admin dev config has a proxy to a local dashboard.
  return preview({
    root, base, configFile: false, envDir: false, logLevel: 'warn', build: { outDir },
    preview: { host: '127.0.0.1', port, strictPort: true },
  })
}

async function prepareFrontend(page, name, node) {
  if (!node) {
    await page.getByText(zh ? '实时' : 'Live', { exact: true }).first().waitFor()
    const cards = name.includes('cards') || name.includes('tablet')
    await page.locator(`a.${cards ? 'card' : 'node-strip'}[href="/instance/demo-1"]`).waitFor()
    if (name.includes('tablet')) await page.locator('[data-grid="cards"]').nth(1).waitFor()
    assert.equal(await page.locator('main [data-pending], main [data-stale]').count(), 0, name)
    return
  }
  await page.getByRole('heading', { name: node === 4 ? 'Frankfurt' : 'Tokyo Edge', exact: true }).waitFor()
  await page.getByText(zh ? '在线' : 'Online', { exact: true }).first().waitFor()
  const charts = page.locator('.node-charts')
  if (name.includes('charts') || name.includes('latency')) {
    if (name.includes('latency')) {
      await charts.getByRole('tab', { name: zh ? '延迟' : 'Latency' }).click()
      await charts.locator('.node-ping-row').nth(1).waitFor()
    }
    await charts.getByRole('button', { name: zh ? '1 天' : '1 d', exact: true }).click()
    await charts.locator('[role="img"] path[vector-effect][d^="M"]').first().waitFor({ state: 'attached' })
    await charts.evaluate(el => {
      const rect = el.getBoundingClientRect()
      window.scrollBy(0, Math.min(rect.top - 80, rect.bottom + 32 - window.innerHeight))
    })
  }
}

async function capture(browser, url, shot, isAdmin) {
  const [name, width, height, target, marker] = shot
  const theme = name.endsWith('-dark') ? 'dark' : 'light'
  const page = await browser.newPage({
    viewport: { width, height }, deviceScaleFactor: 2, colorScheme: theme,
    locale, timezoneId: 'UTC', reducedMotion: 'reduce', serviceWorkers: 'block',
  })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/*', route => {
    const req = new URL(route.request().url())
    if (req.origin !== new URL(url).origin) {
      if (req.hostname === 'api.frankfurter.dev') {
        const rates = [{ quote: 'EUR', rate: 0.92 }, { quote: 'CNY', rate: 7.2 }]
        return route.fulfill({ json: rates.map(rate => ({ ...rate, base: 'USD', date: date.slice(0, 10) })) })
      }
      errors.push('Unexpected origin ' + req.origin)
      return route.abort()
    }
    if (req.pathname.startsWith('/api/')) {
      const key = req.pathname.slice('/api/v1/'.length)
      if (isAdmin && Object.hasOwn(api, key)) return route.fulfill({ json: { success: true, data: api[key] } })
      errors.push('Missing fixture ' + req.pathname)
      return route.abort()
    }
    return route.continue()
  })
  await page.clock.setFixedTime(new Date(date))
  await page.addInitScript(({ locale, theme, cards, grouped }) => {
    localStorage.setItem('language', locale)
    localStorage.setItem('appearance', theme)
    localStorage.setItem('vite-ui-theme', theme)
    localStorage.setItem('zool:view', cards ? 'cards' : 'ledger')
    localStorage.setItem('zool:grouped', grouped ? 'grouped' : 'flat')
    let seed = 20261116
    Math.random = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 2 ** 32)
  }, { locale, theme, cards: name.includes('cards') || width === 834, grouped: width === 834 })
  const path = isAdmin ? '/dashboard/' + target : target ? '/instance/demo-' + target : '/'
  await page.goto(new URL(path, url).href, { waitUntil: 'networkidle' })
  await page.locator(`html[lang="${isAdmin ? locale : language}"][data-theme="${theme}"]`).waitFor()
  if (isAdmin) {
    if (marker) {
      await page.getByText(marker, { exact: true }).filter({ visible: true }).first().waitFor()
    } else {
      const site = page.locator('input[name="site_name"]')
      await site.waitFor()
      assert.equal(await site.inputValue(), api.setting.config.site_name)
    }
    if (name === 'admin-mobile-dark') {
      await page.getByRole('button', { name: zh ? '导航至' : 'Navigate to' }).click()
      await page.getByRole('menuitem').last().waitFor()
    }
  } else {
    await prepareFrontend(page, name, target)
  }
  await page.mouse.move(0, 0)
  await page.evaluate(() => document.fonts.ready)
  const png = await page.screenshot({ animations: 'disabled' })
  assert.deepEqual(errors, [], name)
  console.log('Captured ' + name)
  await page.close()
  return png
}

const temp = await mkdtemp(join(tmpdir(), 'zool-screenshots-'))
const outputs = new Map()
const serversToClose = []
let browser
try {
  browser = await chromium.launch()
  for (const [app, shots, port] of [
    ['frontend', frontend, Number(process.env.NZT_DOCS_FE_PORT ?? 5383)],
    ['admin', admin, Number(process.env.NZT_DOCS_ADMIN_PORT ?? 5384)],
  ]) {
    const server = await serve(app, temp, port)
    serversToClose.push(server)
    for (const shot of shots) {
      outputs.set(shot[0], await capture(browser, server.resolvedUrls.local[0], shot, app === 'admin'))
    }
  }
  await mkdir(out, { recursive: true })
  for (const [name, png] of outputs) await writeFile(join(out, name + '.png'), png)
} finally {
  await browser?.close()
  await Promise.all(serversToClose.map(server => server.close()))
  await rm(temp, { recursive: true, force: true })
}

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { nezha } from '../src/adapters/nezha'
import type { SiteInfo } from '../src/core/model'
import { LoginDialog } from '../src/components/LoginDialog'

const view = vi.hoisted(() => ({ site: null as SiteInfo | null }))
vi.mock('@/app/store', async () => ({
  adapter: (await import('../src/adapters/nezha')).nezha,
  useStore: (select: (state: unknown) => unknown) => select({ site: view.site, settings: { siteTitle: '' } }),
}))
vi.mock('@/app/ui', () => ({ useDialog: () => true, closeDialog: vi.fn() }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: { provider?: string }) => options?.provider ?? key }),
}))

function respond(data: unknown, status = 200) {
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify(data), { status }))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

async function loadSite(providers?: string[] | null) {
  vi.stubGlobal('window', { ZoolConfig: {} })
  respond({ success: true, data: { config: { oauth2_providers: providers } } })
  return nezha.loadSite()
}

afterEach(() => vi.unstubAllGlobals())

describe('Nezha OAuth login', () => {
  it('shows every configured provider alongside password login', async () => {
    view.site = await loadSite(['GitHub', 'Google'])
    expect(view.site.oauth).toBe(true)
    const html = renderToStaticMarkup(createElement(LoginDialog))
    expect(html.match(/<dialog[^>]+>/)?.[0]).toContain('overflow-y-auto')
    expect(html).toContain('>GitHub</button>')
    expect(html).toContain('>Google</button>')
    expect(html).toContain('autoComplete="username"')
    expect(html).toContain('type="password"')
  })

  it.each([undefined, null, [], ['']])('hides OAuth when no providers are available: %j', async (providers) => {
    view.site = await loadSite(providers)
    expect(view.site.oauth).toBe(false)
    expect(await nezha.oauthUrl(view.site)).toBeNull()
    const html = renderToStaticMarkup(createElement(LoginDialog))
    expect(html).not.toContain('btn-outline min-h-12')
    expect(html).toContain('type="password"')
  })

  it('uses the official login action and follows the returned authorization URL', async () => {
    const site = await loadSite(['GitHub', 'My SSO/Team'])
    const redirect = 'https://github.com/login/oauth/authorize?client_id=test&state=example'
    const fetch = respond({ success: true, data: { redirect } })
    expect(await nezha.oauthUrl(site, 'My SSO/Team')).toBe(redirect)
    expect(fetch).toHaveBeenCalledWith('/api/v1/oauth2/My%20SSO%2FTeam?type=1', expect.objectContaining({ credentials: 'same-origin' }))
    expect(await nezha.oauthUrl(site)).toBe(redirect)
    expect(fetch).toHaveBeenLastCalledWith('/api/v1/oauth2/GitHub?type=1', expect.anything())
    expect(await nezha.oauthUrl(site, 'unconfigured')).toBeNull()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it.each([
    { success: false, error: 'provider not found' },
    { success: true, data: {} },
    { success: true, data: { redirect: 'javascript:alert(1)' } },
    { success: true, data: { redirect: 'data:text/html,hello' } },
  ])('rejects unsuccessful or unsafe authorization responses: %j', async (response) => {
    const site = await loadSite(['GitHub'])
    respond(response)
    await expect(nezha.oauthUrl(site)).rejects.toThrow()
  })

  it('propagates HTTP failures so the login dialog can show an error', async () => {
    const site = await loadSite(['GitHub'])
    respond({ success: false }, 503)
    await expect(nezha.oauthUrl(site)).rejects.toThrow('HTTP 503')
  })

  it('preserves the password login request', async () => {
    const fetch = respond({ success: true })
    expect(await nezha.login('alice', 'test-password')).toEqual({ ok: true })
    expect(fetch).toHaveBeenCalledWith('/api/v1/login', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ username: 'alice', password: 'test-password' }),
    }))
  })

  it('supports OAuth-only login when password login is disabled', async () => {
    view.site = { ...await loadSite(['GitHub']), passwordLogin: false }
    const html = renderToStaticMarkup(createElement(LoginDialog))
    expect(html).toContain('>GitHub</button>')
    expect(html).not.toContain('type="password"')
  })
})

it('rejects failed settings so the load-error screen can retry', async () => {
  vi.stubGlobal('window', { ZoolConfig: {} })
  respond({ success: false })
  await expect(nezha.loadSite()).rejects.toThrow('Nezha settings unavailable')
  await expect(loadSite(['GitHub'])).resolves.toMatchObject({ oauth: true })
})

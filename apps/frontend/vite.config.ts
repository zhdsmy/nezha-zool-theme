/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

type Target = 'nezha' | 'demo'

/**
 * Dev server upstream, e.g. `.env.local` → `ZOOL_UPSTREAM=https://nezha.example.com`.
 * Without one, `pnpm --filter frontend dev` falls back to demo data.
 */
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}
const src = (p: string) => fileURLToPath(new URL(`./src/${p}`, import.meta.url))

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'ZOOL_')
  const upstream = mode === 'demo' ? '' : (env.ZOOL_UPSTREAM ?? '')
  const requested: Target = mode === 'demo' ? 'demo' : 'nezha'
  // Builds always target Nezha; only the dev server swaps in demo data when no upstream is set.
  const target: Target = command === 'serve' && !upstream ? 'demo' : requested

  const proxied = (path: string) => ({
    [path]: {
      target: upstream,
      changeOrigin: true,
      ws: true,
      secure: true,
      // Nezha checks the Origin of WebSocket upgrades.
      headers: { Origin: upstream, Referer: `${upstream}/` },
    },
  })

  return {
    base: '/',
    plugins: [
      react(),
      tailwindcss(),
      { name: 'zool:version', transformIndexHtml: (html) => html.replace('%ZOOL_VERSION%', pkg.version) },
    ],
    define: {
      __ZOOL_TARGET__: JSON.stringify(target),
      __ZOOL_VERSION__: JSON.stringify(pkg.version),
    },
    resolve: {
      alias: {
        '@adapter': src(`adapters/${target}/index.ts`),
        '@': src(''),
      },
    },
    server: {
      host: '127.0.0.1',
      proxy: upstream ? { ...proxied('/api'), ...proxied('/dashboard') } : undefined,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 700,
    },
    test: {
      include: ['tests/**/*.test.ts'],
      environment: 'node',
    },
  }
})

/// <reference types="vite/client" />

declare const __ZOOL_TARGET__: 'nezha' | 'demo'
declare const __ZOOL_VERSION__: string

interface Window {
  /** Nezha runtime configuration, see public/config.js. */
  ZoolConfig?: Record<string, unknown>
}

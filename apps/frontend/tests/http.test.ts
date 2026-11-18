import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { request } from '../src/core/http'

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('AbortSignal', class {}) // Safari before AbortSignal.any.
  vi.stubGlobal('fetch', (_url: string, { signal }: RequestInit) => new Promise<Response>((_, reject) => {
    if (signal!.aborted) reject(signal!.reason)
    else signal!.addEventListener('abort', () => reject(signal!.reason), { once: true })
  }))
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it.each([true, false])('forwards caller cancellation, already aborted = %s', async already => {
  const ctrl = new AbortController()
  const reason = new DOMException('view closed', 'AbortError')
  if (already) ctrl.abort(reason)
  const pending = request('/metrics', { signal: ctrl.signal })
  if (!already) ctrl.abort(reason)
  await expect(pending).rejects.toBe(reason)
  expect(vi.getTimerCount()).toBe(0)
})

it('keeps the timeout active and detaches the external listener after settling', async () => {
  const ctrl = new AbortController()
  const remove = vi.spyOn(ctrl.signal, 'removeEventListener')
  const pending = expect(request('/metrics', { signal: ctrl.signal }, 100)).rejects.toMatchObject({ name: 'AbortError' })
  await vi.advanceTimersByTimeAsync(100)
  await pending
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function))
  expect(ctrl.signal.aborted).toBe(false)
  vi.stubGlobal('fetch', async () => Response.json({ ok: true }))
  await expect(request('/metrics', { signal: ctrl.signal })).resolves.toEqual({ ok: true })
  expect(remove).toHaveBeenCalledTimes(2)
})

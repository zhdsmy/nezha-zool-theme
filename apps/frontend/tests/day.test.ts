import { expect, it, vi } from 'vitest'
import { watchDay } from '../src/app/day'

it('refreshes at local midnight and when a suspended tab resumes', () => {
  vi.useFakeTimers()
  const events = new EventTarget()
  vi.stubGlobal('document', events)
  try {
    vi.setSystemTime(new Date(2026, 10, 18, 23, 59, 59))
    const changed = vi.fn()
    const stop = watchDay(changed)
    vi.advanceTimersByTime(1_000)
    expect(changed).toHaveBeenLastCalledWith(+new Date(2026, 10, 19))
    vi.setSystemTime(new Date(2026, 10, 21, 10))
    events.dispatchEvent(new Event('visibilitychange'))
    expect(changed).toHaveBeenLastCalledWith(+new Date(2026, 10, 21))
    stop()
    expect(vi.getTimerCount()).toBe(0)
  } finally {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  }
})

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { daysUntil, formatBytes, formatNumber, monthlyCost, splitSpeed, trafficUsed } from '../src/core/format'
import { flagToRegion, stripFlag } from '../src/core/region'
import { DEFAULT_SETTINGS, normalizeSettings } from '../src/core/settings'
import { recordCounters, spikeLimit, summariseDay } from '../src/core/summary'

describe('format', () => {
  it('formats bytes with sensible precision', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(0.5)).toBe('0.50 B')
    expect(splitSpeed(0.25)).toEqual({ value: '0.25', unit: 'B/s' })
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.50 KB')
    expect(formatBytes(125 * 1024 ** 4)).toBe('125 TB')
    expect(splitSpeed(3.11 * 1024 ** 2)).toEqual({ value: '3.11', unit: 'MB/s' })
  })

  it('trims only decimal zeros', () => {
    expect(formatNumber(100, 0)).toBe('100')
    expect(formatNumber(50, 1)).toBe('50')
    expect(formatNumber(0.5)).toBe('0.5')
    expect(formatNumber(2.0)).toBe('2')
  })

  it('follows the traffic limit type', () => {
    expect(trafficUsed('sum', 3, 4)).toBe(7)
    expect(trafficUsed('max', 3, 4)).toBe(4)
    expect(trafficUsed('min', 3, 4)).toBe(3)
    expect(trafficUsed('up', 3, 4)).toBe(3)
    expect(trafficUsed('down', 3, 4)).toBe(4)
  })

  it('normalises prices to a month', () => {
    expect(monthlyCost(120, 365)).toBe(10)
    expect(monthlyCost(30, 90)).toBe(10)
    expect(monthlyCost(60, 182)).toBe(10)
    expect(monthlyCost(240, 730)).toBe(10)
    expect(monthlyCost(360, 1095)).toBe(10)
    expect(monthlyCost(10, 31)).toBe(10)
    expect(monthlyCost(365, 1)).toBeCloseTo(365 * 365 / 12)
    expect(monthlyCost(Infinity, 30)).toBe(0)
    expect(monthlyCost(-1, 30)).toBe(0)
    expect(monthlyCost(10, 0)).toBe(0)
    expect(daysUntil(Date.now() + 86_400_000 * 2.5)).toBe(3)
  })
})

describe('day summary', () => {
  const p = (at: number, netUp: number, netDown: number, totalUp?: number, totalDown?: number) => ({
    at, cpu: 0, memUsed: 0, swapUsed: 0, diskUsed: 0, netUp, netDown, load1: 0, tcp: 0, udp: 0, process: 0, totalUp, totalDown,
  })

  it('uses counter growth since midnight and the highest recorded rates', () => {
    const midnight = 1_000
    const s = summariseDay([p(500, 9, 1, 100, 200), p(1_000, 3, 7, 150, 260), p(2_000, 5, 2, 400, 300)], [{ at: 3_000, totalUp: 450, totalDown: 360 }], midnight)
    expect(s).toMatchObject({ todayUp: 300, todayDown: 100, peakUp: 9, peakUpAt: 500, peakDown: 7, peakDownAt: 1_000 })
  })

  it('requires a recorded baseline separately for each direction', () => {
    const live = [{ at: 5, totalUp: 100, totalDown: 90 }]
    expect(summariseDay([p(2, 0, 0, 75)], live, 1)).toMatchObject({ todayUp: 25, todayDown: null })
    expect(summariseDay([p(2, 0, 0, 75), p(3, 0, 0, undefined, 80)], live, 1).todayDown).toBe(10)
  })

  it('merges delayed reports by measurement time and retains reset endpoints', () => {
    const live: { at: number; totalUp: number; totalDown: number }[] = []
    for (const [at, value] of [[3, 140], [5, 15], [2, 120], [4, 10], [6, 20], [7, 25]]) {
      recordCounters(live, { at, totalUp: value, totalDown: value }, 1)
    }
    expect(live.length).toBeLessThan(6)
    const summary = summariseDay([p(1, 0, 0, 100, 100), p(3, 0, 0, 150, 140)], live, 1)
    expect(summary).toMatchObject({ todayUp: 75, todayDown: 65 })
    recordCounters(live, { at: 8, totalUp: 30, totalDown: 30 }, 8)
    expect(live.map(p => p.at)).toEqual([8])
  })

  it('includes bytes recorded after a counter reset', () => {
    const s = summariseDay([p(2_000, 1, 1, 900, 900)], [{ at: 3_000, totalUp: 10, totalDown: 10 }], 1_000)
    expect(s.todayUp).toBe(10)
    expect(s.todayDown).toBe(10)
  })
})

describe('region', () => {
  it('reads flag emoji', () => {
    expect(flagToRegion('🇺🇸 SJC')).toBe('US')
    expect(flagToRegion('🏠 Home')).toBe('')
    expect(stripFlag('🇭🇰 HK Bage')).toBe('HK Bage')
    expect(stripFlag('🏠 ChinaNet')).toBe('🏠 ChinaNet')
  })
})

describe('settings', () => {
  it('defaults to a flat home page when defaultGrouped is omitted', () => {
    expect(DEFAULT_SETTINGS.defaultGrouped).toBe(false)
    expect(normalizeSettings(undefined).defaultGrouped).toBe(false)
    expect(normalizeSettings({}).defaultGrouped).toBe(false)
  })

  it.each([
    [true, true],
    [false, false],
    ['true', true],
    ['false', false],
    ['invalid', false],
  ])('normalises defaultGrouped %j to %j', (value, expected) => {
    expect(normalizeSettings({ defaultGrouped: value }).defaultGrouped).toBe(expected)
  })

  it('fills every key when the backend sends nothing', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings({ defaultDensity: 'nope', showCost: 'false', hiddenNodes: 'a, b' })).toMatchObject({
      defaultDensity: 'comfortable',
      showCost: false,
      hiddenNodes: ['a', 'b'],
    })
  })

  it('reads a saved pre-0.2 view setting as the view it named', () => {
    expect(normalizeSettings({ defaultView: 'grid' }).defaultView).toBe('cards')
    // v0.2 briefly read `list` as a row height; the key means a view again, so it maps to one.
    expect(normalizeSettings({ defaultView: 'list' }).defaultView).toBe('ledger')
    expect(normalizeSettings({ defaultView: 'list' }).defaultDensity).toBe('comfortable')
    expect(normalizeSettings({ defaultView: 'cards' }).defaultView).toBe('cards')
  })

  it('documents every setting in public/config.js', () => {
    const configJs = readFileSync(new URL('../public/config.js', import.meta.url), 'utf8')
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      expect(configJs).toMatch(new RegExp(`\\b${key}\\s*:`))
    }
  })
})

describe('spikeLimit', () => {
  it('drops rare spikes but keeps normal jitter', () => {
    const line = [100, 96, 104, 98, 102, 101, 99, 97, 103, 100, 1151, 640]
    const limit = spikeLimit(line)
    expect(line.filter((v) => v > limit)).toEqual([1151, 640])
    expect(spikeLimit([2, 3, 2, 3, 2, 2, 3, 4, 2, 16])).toBeGreaterThanOrEqual(4)
    expect(spikeLimit([2, 3, 2, 3, 2, 2, 3, 4, 2, 16])).toBeLessThan(16)
    expect(spikeLimit([1, 500])).toBe(Infinity)
  })
})

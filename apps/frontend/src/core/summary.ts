import type { HistoryPoint, Snapshot } from './model'

type Counters = Pick<Snapshot, 'at' | 'totalUp' | 'totalDown'>

/** Only the endpoints of a monotonic run affect its total, even after the chart buffer rolls over. */
export function recordCounters(samples: Counters[], point: Counters, midnight: number) {
  while (samples.length && samples[0].at < midnight) samples.shift()
  if (point.at < midnight) return
  const index = samples.findIndex(p => p.at >= point.at)
  if (index < 0) samples.push(point)
  else if (samples[index].at === point.at) samples[index] = point
  else samples.splice(index, 0, point)
  for (let i = samples.length - 2; i > 0; i--) {
    const before = samples[i - 1], current = samples[i], after = samples[i + 1]
    if (before.totalUp <= current.totalUp && current.totalUp <= after.totalUp &&
        before.totalDown <= current.totalDown && current.totalDown <= after.totalDown) samples.splice(i, 1)
  }
}

export interface DaySummary {
  todayUp: number | null
  todayDown: number | null
  peakUp: number
  peakUpAt: number
  peakDown: number
  peakDownAt: number
}

/**
 * History arrives in chronological order. Count its recorded increments, then continue
 * with newer live reports. Peaks use the full 24-hour history supplied by the node page.
 */
export function summariseDay(
  points: HistoryPoint[],
  live: readonly Counters[],
  midnight: number,
): DaySummary {
  const s: DaySummary = { todayUp: null, todayDown: null, peakUp: 0, peakUpAt: 0, peakDown: 0, peakDownAt: 0 }
  for (const p of points) {
    if (p.netUp > s.peakUp) {
      s.peakUp = p.netUp
      s.peakUpAt = p.at
    }
    if (p.netDown > s.peakDown) {
      s.peakDown = p.netDown
      s.peakDownAt = p.at
    }
  }
  const reports = [...new Map(live.map(p => [p.at, p])).values()].sort((a, b) => a.at - b.at)
  for (const [key, total] of [['totalUp', 'todayUp'], ['totalDown', 'todayDown']] as const) {
    const history = points.filter(p => p.at >= midnight && Number.isFinite(p[key]))
    if (!history.length) continue
    // Nezha 1d timestamps mark the start of each last-value 30-second bucket.
    const liveFrom = history[history.length - 1].at + 30_000
    let previous = history[0][key]!
    let sum = 0
    for (const p of [...history, ...reports.filter(p => p.at >= liveFrom)]) {
      const value = p[key]!
      sum += value >= previous ? value - previous : value
      previous = value
    }
    s[total] = sum
  }
  return s
}

/**
 * Latency above this counts as a spike: Tukey's far-out fence (Q3 + 3 × IQR), never
 * tighter than 1.5 × the median, so a steady 2 ms line keeps its normal 3–4 ms jitter.
 */
export function spikeLimit(values: number[]): number {
  if (values.length < 8) return Infinity
  const s = [...values].sort((a, b) => a - b)
  const q = (f: number) => s[Math.floor((s.length - 1) * f)]
  return Math.max(q(0.75) + 3 * (q(0.75) - q(0.25)), q(0.5) * 1.5)
}

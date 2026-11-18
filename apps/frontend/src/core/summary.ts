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
  todayUp: number
  todayDown: number
  peakUp: number
  peakUpAt: number
  peakDown: number
  peakDownAt: number
}

/**
 * Today's traffic is the growth of the cumulative counters since local midnight, so it
 * does not depend on how the backend buckets its records. Peaks are the highest recorded
 * averages in the given points (the node page passes the last 24 hours).
 */
export function summariseDay(
  points: HistoryPoint[],
  live: readonly Counters[],
  midnight: number,
): DaySummary {
  const s: DaySummary = { todayUp: 0, todayDown: 0, peakUp: 0, peakUpAt: 0, peakDown: 0, peakDownAt: 0 }
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
  for (const [key, total] of [['totalUp', 'todayUp'], ['totalDown', 'todayDown']] as const) {
    let previous: number | undefined
    const readings = new Map<number, number>()
    for (const p of [...live, ...points]) {
      if (p.at >= midnight && p[key] !== undefined) readings.set(p.at, p[key]!)
    }
    for (const [, value] of [...readings].sort(([a], [b]) => a - b)) {
      if (previous !== undefined) s[total] += value >= previous ? value - previous : value
      previous = value
    }
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

import type { HistoryPoint } from './model'

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
  now: { totalUp: number; totalDown: number } | undefined,
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
    for (const p of [...points.filter(p => p.at >= midnight), ...(now ? [now] : [])]) {
      const value = p[key]
      if (value === undefined) continue
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

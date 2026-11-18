import { expect, it } from 'vitest'
import { reportingWindow } from '../src/components/HourGrid'
import type { HistoryPoint } from '../src/core/model'

it('counts only the parts of boundary hours inside a rolling day', () => {
  const now = +new Date(2026, 0, 8, 10, 15)
  const since = now - 86_400_000
  const points = [since - 1, since, now, now + 1].map(at => ({ at }) as HistoryPoint)
  const { rows, seen } = reportingWindow(points, 1, now)
  expect(rows).toHaveLength(2)
  expect(seen).toBe(1)
  expect(rows.flat().filter(c => c.state === 'up')).toHaveLength(2)
  expect(rows[0][9].inWindow).toBe(false)
  expect(rows[1][11].inWindow).toBe(false)
  expect(reportingWindow([points[0], points[3]], 1, now).seen).toBe(0)
})

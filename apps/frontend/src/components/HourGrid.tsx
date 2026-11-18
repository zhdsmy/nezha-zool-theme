import { useTranslation } from 'react-i18next'
import type { HistoryPoint } from '@/core/model'

const HOUR = 3_600_000

export function reportingWindow(points: readonly HistoryPoint[], days: number, now: number) {
  const since = now - days * 24 * HOUR
  const observed = new Set<number>()
  let first = Infinity
  for (const { at } of points) {
    if (at < since || at > now) continue
    const start = new Date(at).setHours(0, 0, 0, 0)
    observed.add(start + Math.floor((at - start) / HOUR) * HOUR)
    first = Math.min(first, at)
  }
  let seen = 0
  const rows = []
  const date = new Date(since)
  date.setHours(0, 0, 0, 0)
  while (+date <= now) {
    const start = +date
    const end = date.setDate(date.getDate() + 1)
    const cells = []
    for (let at = start; at < end; at += HOUR) {
      const until = Math.min(at + HOUR, end)
      const inWindow = at <= now && until > since
      const up = observed.has(at)
      if (up) seen += (Math.min(now, until) - Math.max(at, since)) / HOUR
      const state = up ? 'up' : !inWindow || until <= first ? 'unwatched' : 'down'
      cells.push({ at, inWindow, state })
    }
    rows.push(cells)
  }
  return { rows, seen: Math.round(seen * 10) / 10 }
}

/**
 * Seven days, one cell per hour: filled when the node reported, hollow when it did not.
 *
 * Seven days is the longest range the backend keeps at hourly resolution — the 30-day range
 * is averaged to one point per day, which quietly swallows a real outage. Drawing 90 days
 * from it would be fiction, so this grid stops where the honest data stops.
 */
export function HourGrid({ points, days = 7, now = Date.now() }: { points: readonly HistoryPoint[]; days?: number; now?: number }) {
  const { t, i18n } = useTranslation()
  const { rows, seen } = reportingWindow(points, days, now)

  return (
    <section aria-label={t('node.uptimeGrid')}>
      <div className="flex items-baseline justify-between">
        <h2 className="eyebrow">{t('node.uptimeGrid')}</h2>
        <p className="num text-[12px] text-muted">{t('node.reportedHours', { count: seen, total: days * 24 })}</p>
      </div>
      <div className="mt-2 space-y-[2px] md:mt-3 md:space-y-[3px]">
        {rows.map((row, d) => (
          <div key={d} className="flex items-center gap-2">
            <span className="num w-10 shrink-0 text-right text-[10px] text-muted">{new Date(row[0].at).toLocaleDateString(i18n.language, { month: 'numeric', day: 'numeric' })}</span>
            <span className="flex flex-1 gap-[2px]">
              {row.map(({ at, state, inWindow }) => {
                const hour = new Date(at)
                const stamp = `${hour.toLocaleDateString(i18n.language, { month: 'numeric', day: 'numeric' })} ${String(hour.getHours()).padStart(2, '0')}:00`
                return (
                  <span
                    key={at}
                    // Hours that have not happened carry no reading, so they carry no tooltip either.
                    title={inWindow ? stamp : undefined}
                    className={`h-[8px] flex-1 rounded-[1px] md:h-[10px] ${state === 'up' ? 'bg-good' : state === 'down' ? 'bg-danger' : 'cell-empty'}`}
                  />
                )
              })}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

/** Reload visible daily records at midnight, as new TSDB samples arrive, and after suspension. */
export function watchDay(onChange: (day: number) => void) {
  let timer: ReturnType<typeof setTimeout>
  const update = () => {
    clearTimeout(timer)
    if (document.hidden) return
    const now = new Date()
    onChange(now.setHours(0, 0, 0, 0))
    timer = setTimeout(update, Math.min(5 * 60_000, now.setDate(now.getDate() + 1) - Date.now()))
  }
  update()
  document.addEventListener('visibilitychange', update)
  return () => {
    clearTimeout(timer)
    document.removeEventListener('visibilitychange', update)
  }
}

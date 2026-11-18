/** Notify an open overview when its local day changes, including after tab suspension. */
export function watchDay(onChange: (day: number) => void) {
  let timer: ReturnType<typeof setTimeout>
  const update = () => {
    clearTimeout(timer)
    const now = new Date()
    onChange(now.setHours(0, 0, 0, 0))
    timer = setTimeout(update, now.setDate(now.getDate() + 1) - Date.now())
  }
  update()
  document.addEventListener('visibilitychange', update)
  return () => {
    clearTimeout(timer)
    document.removeEventListener('visibilitychange', update)
  }
}

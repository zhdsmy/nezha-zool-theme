const goZeroTime = Date.parse("0001-01-01T00:00:00Z")

export function parseTimestamp(value: string | number | null | undefined): Date | undefined {
    if (value == null || value === "") return
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return
    // Go can send nonzero nanoseconds that JavaScript truncates to the zero millisecond.
    if (date.getTime() === goZeroTime && !(typeof value === "string" && /\.\d*[1-9]/.test(value))) return
    return date
}

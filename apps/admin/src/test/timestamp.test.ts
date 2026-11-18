import { parseTimestamp } from "@/lib/timestamp"
import { expect, test } from "vitest"

test.each([undefined, null, "", "invalid", "0001-01-01", "0001-01-01T00:00:00.000Z", "0001-01-01T08:00:00+08:00", -62135596800000])(
    "represents empty, invalid and Go zero timestamps as absent (%s)", value => {
        expect(parseTimestamp(value)).toBeUndefined()
    },
)
test.each([0, -1000, "1900-02-01T00:00:00Z", "0001-01-01T00:00:00.000000001Z", "0001-01-02"])(
    "retains valid historical timestamps (%s)", value => {
        expect(parseTimestamp(value)?.getTime()).toBe(new Date(value).getTime())
    },
)

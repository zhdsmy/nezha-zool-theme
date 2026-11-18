import { serverOptions } from "@/lib/server-options"
import { expect, test } from "vitest"

test("duplicate server names have distinct labels and retain their submitted IDs", () => {
    expect(serverOptions([{ id: 7, name: "dev" }, { id: 2, name: "prod" }, { id: 9, name: "dev" }])).toEqual([
        { value: "7", label: "dev #7" }, { value: "2", label: "prod" }, { value: "9", label: "dev #9" },
    ])
    expect(serverOptions(undefined)).toEqual([])
})

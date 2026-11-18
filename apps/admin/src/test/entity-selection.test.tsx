import { useSelectableTable } from "@/lib/table"
import { act, renderHook } from "@testing-library/react"
import { expect, test } from "vitest"

test("selection follows the same entity after refresh and forgets removed rows", () => {
    const { result, rerender } = renderHook(
        ({ data }) => useSelectableTable(data, []),
        { initialProps: { data: [{ id: 1 }, { id: 2 }] } },
    )
    act(() => result.current.getRowModel().rows[1].toggleSelected(true))
    rerender({ data: [{ id: 2 }, { id: 1 }] })
    expect(result.current.getSelectedRowModel().rows.map(row => row.original.id)).toEqual([2])
    rerender({ data: [{ id: 1 }] })
    rerender({ data: [{ id: 2 }] })
    expect(result.current.getSelectedRowModel().rows).toHaveLength(0)
})

test("concurrent connections behind one IP have distinct row IDs", () => {
    const data = [1, 2].map(user_id => ({ ip: "127.0.0.1", user_id, connected_at: "now" }))
    const { result } = renderHook(() => useSelectableTable(data, []))
    expect(new Set(result.current.getRowModel().rows.map(row => row.id)).size).toBe(2)
})

import {
    ColumnDef,
    columnSizingFeature,
    columnVisibilityFeature,
    createSortedRowModel,
    rowSelectionFeature,
    rowSortingFeature,
    sortFn_alphanumeric,
    sortFn_datetime,
    sortFn_text,
    tableFeatures,
    useTable,
} from "@tanstack/react-table"
import { useEffect } from "react"

export const selectableTableFeatures = tableFeatures({
    columnVisibilityFeature,
    rowSelectionFeature,
})

export const virtualizedTableFeatures = tableFeatures({
    columnSizingFeature,
    columnVisibilityFeature,
    rowSelectionFeature,
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: {
        alphanumeric: sortFn_alphanumeric,
        datetime: sortFn_datetime,
        text: sortFn_text,
    },
})

type EntityRow = { id: number } | { group: { id: number } } | { ip: string }
function entityRowId(row: EntityRow) {
    if ("group" in row) return String(row.group.id)
    if ("id" in row) return String(row.id)
    if ("user_id" in row && "connected_at" in row) {
        return JSON.stringify([row.ip, row.user_id, row.connected_at])
    }
    return row.ip
}

export function useSelectableTable<T extends EntityRow>(
    data: T[],
    columns: ColumnDef<typeof selectableTableFeatures, T>[],
) {
    const table = useTable({
        features: selectableTableFeatures,
        data,
        columns,
        getRowId: entityRowId,
    })
    useEffect(() => {
        const ids = new Set(data.map(entityRowId))
        table.setRowSelection((selected) => {
            const entries = Object.entries(selected).filter(([id]) => ids.has(id))
            return entries.length === Object.keys(selected).length
                ? selected
                : Object.fromEntries(entries)
        })
    }, [data, table])
    return table
}

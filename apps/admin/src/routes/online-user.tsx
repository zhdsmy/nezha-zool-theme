import { parseTimestamp } from "@/lib/timestamp"
import { swrFetcher } from "@/api/api"
import { blockUser } from "@/api/online-user"
import { BlockButtonGroup } from "@/components/action-button-group"
import { HeaderBlockButtonGroup } from "@/components/header-button-group"
import { SettingsTab } from "@/components/settings-tab"
import { Checkbox } from "@/components/ui/checkbox"
import { TablePagination } from "@/components/ui/pagination"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/hooks/useAuth"
import { selectableTableFeatures, useSelectableTable } from "@/lib/table"
import { ModelOnlineUser, ModelOnlineUserApi } from "@/types"
import { ColumnDef, flexRender } from "@tanstack/react-table"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useListPagination } from "@/hooks/useListPagination"
import { toast } from "sonner"
import useSWR from "swr"

export default function OnlineUserPage() {
    const { t } = useTranslation()
    const { profile } = useAuth()
    const pagination = useListPagination()
    const { page, pageSize } = pagination

    // 计算 offset
    const offset = (page - 1) * pageSize

    const { data, mutate, error, isLoading } = useSWR<ModelOnlineUserApi, Error>(
        `/api/v1/online-user?offset=${offset}&limit=${pageSize}`,
        swrFetcher,
    )

    const isAdmin = profile?.role === 0

    useEffect(() => {
        if (error)
            toast(t("Error"), {
                description: t(`Error fetching resource: ${error.message}.`),
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error])

    let columns: ColumnDef<typeof selectableTableFeatures, ModelOnlineUser>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableHiding: false,
        },
        {
            header: "IP",
            accessorKey: "ip",
            accessorFn: (row) => row.ip ?? "",
        },
        {
            header: t("UserId"),
            accessorKey: "user_id",
            accessorFn: (row) => row.user_id || "",
        },
        {
            header: t("ConnectedAt"),
            accessorKey: "connected_at",
            accessorFn: (row) => row.connected_at,
            cell: ({ row }) => parseTimestamp(row.original.connected_at)?.toISOString() ?? "—",
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const s = row.original
                return (
                    <BlockButtonGroup
                        className="flex gap-2"
                        block={{
                            fn: blockUser,
                            id: s.ip ?? "",
                            mutate: mutate,
                        }}
                    >
                        <></>
                    </BlockButtonGroup>
                )
            },
        },
    ]

    if (!isAdmin) {
        // 非管理员隐藏操作列
        columns = columns.filter((c) => c.id !== "actions")
    }

    const dataCache = useMemo(() => {
        return data?.value ?? []
    }, [data])

    const table = useSelectableTable(dataCache, columns)

    const selectedRows = table.getSelectedRowModel().rows

    return (
        <div className="px-3">
            <SettingsTab className="mt-6 w-full" />
            <div className="flex mt-4 mb-4">
                {isAdmin && (
                    <HeaderBlockButtonGroup
                        className="flex-2 flex gap-2 ml-auto"
                        block={{
                            fn: blockUser,
                            id: selectedRows.map((r) => r.original.ip ?? ""),
                            mutate: mutate,
                        }}
                    >
                        <></>
                    </HeaderBlockButtonGroup>
                )}
            </div>
            <Table error={data === undefined && error} onRetry={mutate}>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead
                                        key={header.id}
                                        data-col={header.column.id}
                                        className="text-sm"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext(),
                                              )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                {t("Loading")}...
                            </TableCell>
                        </TableRow>
                    ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                        key={cell.id}
                                        data-col={cell.column.id}
                                        className="text-xsm"
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                {t("NoResults")}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <TablePagination {...pagination} total={data?.pagination?.total} />
        </div>
    )
}

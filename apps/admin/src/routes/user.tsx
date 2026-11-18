import { swrFetcher } from "@/api/api"
import { deleteUser } from "@/api/user"
import { ActionButtonGroup } from "@/components/action-button-group"
import { HeaderButtonGroup } from "@/components/header-button-group"
import { SettingsTab } from "@/components/settings-tab"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { IconButton } from "@/components/xui/icon-button"
import { useAuth } from "@/hooks/useAuth"
import { UserCard } from "@/components/user"
import { selectableTableFeatures, useSelectableTable } from "@/lib/table"
import { ModelUser } from "@/types"
import { ColumnDef, flexRender } from "@tanstack/react-table"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import useSWR from "swr"

export default function UserPage() {
    const { profile } = useAuth()
    const { t } = useTranslation()
    const { data, mutate, error, isLoading } = useSWR<ModelUser[]>("/api/v1/user", swrFetcher)

    useEffect(() => {
        if (error)
            toast(t("Error"), {
                description: t("Results.UnExpectedError", {
                    error: error.message,
                }),
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error])

    const columns: ColumnDef<typeof selectableTableFeatures, ModelUser>[] = [
        {
            id: "select",
            header: ({ table }) => {
                const rows = table.getRowModel().rows.filter(row => row.getCanSelect())
                const all = rows.length > 0 && rows.every(row => row.getIsSelected())
                return (
                    <Checkbox
                        checked={all || (rows.some(row => row.getIsSelected()) && "indeterminate")}
                        disabled={!rows.length}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                )
            },
            cell: ({ row }) => (
                <Checkbox
                    disabled={!row.getCanSelect()}
                    checked={row.getCanSelect() && row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableHiding: false,
        },
        {
            header: "ID",
            accessorKey: "id",
            accessorFn: (row) => row.id,
        },
        {
            header: t("Username"),
            accessorKey: "username",
            accessorFn: (row) => row.username,
        },
        {
            header: t("Role"),
            accessorKey: "role",
            accessorFn: (row) => {
                return row.role === 1 ? t("User") : t("Admin")
            },
        },
        {
            header: t("LastLogin"),
            accessorKey: "updated_at",
            accessorFn: (row) =>
                row.updated_at ? new Date(row.updated_at).toLocaleString() : t("Never"),
        },
        {
            id: "actions",
            header: t("Actions"),
            cell: ({ row }) => {
                if (!row.getCanSelect()) return <IconButton icon="trash" variant="destructive" disabled aria-label={t("Delete")} />
                const s = row.original
                return (
                    <ActionButtonGroup
                        className="flex gap-2"
                        delete={{
                            fn: deleteUser,
                            id: s.id,
                            mutate: mutate,
                        }}
                    >
                        <></>
                    </ActionButtonGroup>
                )
            },
        },
    ]

    const dataCache = useMemo(() => {
        return data ?? []
    }, [data])

    const currentId = profile?.id
    const table = useSelectableTable(dataCache, columns, row =>
        currentId !== undefined && Number.isSafeInteger(currentId) && currentId > 0 && row.original.id !== currentId,
    )

    const selectedRows = table.getSelectedRowModel().rows.filter(row => row.getCanSelect())

    return (
        <div className="px-3">
            <SettingsTab className="mt-6 w-full" />
            <div className="flex mt-4 mb-4">
                <HeaderButtonGroup
                    className="flex-2 flex gap-2 ml-auto"
                    delete={{
                        fn: deleteUser,
                        id: selectedRows.map((r) => r.original.id),
                        mutate: mutate,
                    }}
                >
                    <UserCard mutate={mutate} />
                </HeaderButtonGroup>
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
        </div>
    )
}

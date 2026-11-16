import { swrFetcher } from "@/api/api"
import { deleteService } from "@/api/service"
import { ActionButtonGroup } from "@/components/action-button-group"
import { flagCell } from "@/components/flag"
import { HeaderButtonGroup } from "@/components/header-button-group"
import { ServiceCard } from "@/components/service"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { selectableTableFeatures } from "@/lib/table"
import { conv } from "@/lib/utils"
import { ModelService as Service } from "@/types"
import { serviceTypes } from "@/types"
import { ColumnDef, flexRender, useTable } from "@tanstack/react-table"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import useSWR from "swr"

export default function ServicePage() {
    const { t } = useTranslation()
    const { data, mutate, error, isLoading } = useSWR<Service[]>("/api/v1/service/list", swrFetcher)

    useEffect(() => {
        if (error)
            toast(t("Error"), {
                description: t("Results.ErrorFetchingResource", {
                    error: error.message,
                }),
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error])

    const columns: ColumnDef<typeof selectableTableFeatures, Service>[] = [
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
            header: "ID",
            accessorKey: "id",
            accessorFn: (row) => row.id,
            cell: ({ row }) => (
                <span className="whitespace-nowrap">
                    {row.original.id}
                    <span className="text-muted-foreground">
                        {" "}
                        · {row.original.display_index ?? 0}
                    </span>
                </span>
            ),
        },
        {
            header: t("Name"),
            accessorFn: (row) => row.name,
            accessorKey: "name",
            cell: ({ row }) => {
                const s = row.original
                return (
                    <div className="min-w-16 max-w-40 whitespace-normal break-words">{s.name}</div>
                )
            },
        },
        {
            header: t("Target"),
            accessorFn: (row) => row.target,
            accessorKey: "target",
            cell: ({ row }) => {
                const s = row.original
                return (
                    <div className="min-w-32 max-w-64 whitespace-normal [overflow-wrap:anywhere]">
                        {s.target}
                    </div>
                )
            },
        },
        {
            header: t("Coverage"),
            accessorKey: "cover",
            accessorFn: (row) => row.cover,
            cell: ({ row }) => {
                const s = row.original
                return (
                    <div className="max-w-48 whitespace-normal break-words">
                        {(() => {
                            switch (s.cover) {
                                case 0: {
                                    return <span>{t("CoverAll")}</span>
                                }
                                case 1: {
                                    return <span>{t("IgnoreAll")}</span>
                                }
                            }
                        })()}
                    </div>
                )
            },
        },
        {
            header: t("SpecificServers"),
            cell: ({ row }) => {
                const s = row.original
                return (
                    <div className="max-w-32 whitespace-normal break-words">
                        {Object.keys(s.skip_servers ?? {}).join(",")}
                    </div>
                )
            },
        },
        {
            header: t("Type"),
            accessorKey: "type",
            accessorFn: (row) => row.type,
            cell: ({ row }) => serviceTypes[row.original.type] || "",
        },
        {
            header: t("Interval"),
            accessorKey: "duration",
            accessorFn: (row) => row.duration,
        },
        {
            header: t("NotifierGroupID"),
            accessorKey: "ngroup",
            accessorFn: (row) => row.notification_group_id,
            cell: ({ getValue }) =>
                getValue<number>() || <span className="text-muted-foreground/60">—</span>,
        },
        {
            header: t("Trigger"),
            accessorKey: "triggerTask",
            accessorFn: (row) => row.enable_trigger_task ?? false,
            cell: flagCell,
        },
        {
            header: t("TasksToTriggerOnAlert"),
            accessorKey: "failTriggerTasks",
            accessorFn: (row) => conv.arrToStr(row.fail_trigger_tasks),
        },
        {
            header: t("TasksToTriggerAfterRecovery"),
            accessorKey: "recoverTriggerTasks",
            accessorFn: (row) => conv.arrToStr(row.recover_trigger_tasks),
        },
        {
            id: "actions",
            header: t("Actions"),
            cell: ({ row }) => {
                const s = row.original
                return (
                    <ActionButtonGroup
                        className="flex gap-2"
                        delete={{ fn: deleteService, id: s.id, mutate: mutate }}
                    >
                        <ServiceCard mutate={mutate} data={s} />
                    </ActionButtonGroup>
                )
            },
        },
    ]

    const dataCache = useMemo(() => {
        return data ?? []
    }, [data])

    const table = useTable({
        features: selectableTableFeatures,
        data: dataCache,
        columns,
    })

    const selectedRows = table.getSelectedRowModel().rows

    return (
        <div className="px-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3 mt-6 mb-4">
                <h1 className="text-3xl font-bold tracking-tight">{t("Service")}</h1>
                <HeaderButtonGroup
                    className="flex gap-2 flex-wrap shrink-0"
                    delete={{
                        fn: deleteService,
                        id: selectedRows.map((r) => r.original.id),
                        mutate: mutate,
                    }}
                >
                    <ServiceCard mutate={mutate} />
                </HeaderButtonGroup>
            </div>

            <Table>
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

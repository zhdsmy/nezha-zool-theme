import { cn } from "@/lib/utils"
import {
    HTMLAttributes,
    MouseEvent,
    TdHTMLAttributes,
    ThHTMLAttributes,
    forwardRef,
    useLayoutEffect,
    useRef,
} from "react"

const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
    ({ className, ...props }, ref) => {
        const box = useRef<HTMLDivElement>(null)
        // Narrow screens show rows as cards; each cell labels itself with its column header.
        useLayoutEffect(() => {
            const heads = box.current?.querySelectorAll("thead th") ?? []
            box.current?.querySelectorAll("tbody tr").forEach((tr) =>
                Array.from(tr.children).forEach((td, i) => {
                    const label = heads[i]?.textContent?.trim()
                    if (label) td.setAttribute("data-label", label)
                }),
            )
        })
        return (
            <div
                ref={box}
                className="zool-table relative w-full overflow-auto rounded-lg border bg-card"
            >
                <table
                    ref={ref}
                    className={cn("w-full caption-bottom text-sm", className)}
                    {...props}
                />
            </div>
        )
    },
)
Table.displayName = "Table"

const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
    ),
)
TableHeader.displayName = "TableHeader"

const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
    ),
)
TableBody.displayName = "TableBody"

const TableFooter = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <tfoot
            ref={ref}
            className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
            {...props}
        />
    ),
)
TableFooter.displayName = "TableFooter"

const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
    ({ className, onClick, ...props }, ref) => (
        <tr
            ref={ref}
            className={cn("border-b", className)}
            onClick={(e) => {
                onClick?.(e)
                toggleRow(e)
            }}
            {...props}
        />
    ),
)
TableRow.displayName = "TableRow"

// Card rows (narrow screens) expand on tap; controls inside the row, and portaled dialogs/menus, keep their own clicks.
function toggleRow(e: MouseEvent<HTMLTableRowElement>) {
    const row = e.currentTarget
    const target = e.target as HTMLElement
    if (row.parentElement?.tagName !== "TBODY" || !row.contains(target)) return
    if (target.closest("button, a, input, label, select, textarea, [role=checkbox]")) return
    row.toggleAttribute("data-open")
}

const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
    ({ className, ...props }, ref) => (
        <th
            ref={ref}
            className={cn(
                "h-10 px-3 text-left align-middle text-xs font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
                className,
            )}
            {...props}
        />
    ),
)
TableHead.displayName = "TableHead"

const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
    ({ className, ...props }, ref) => (
        <td
            ref={ref}
            className={cn(
                "px-3 py-2.5 align-middle tabular-nums [&:has([role=checkbox])]:pr-0",
                className,
            )}
            {...props}
        />
    ),
)
TableCell.displayName = "TableCell"

const TableCaption = forwardRef<HTMLTableCaptionElement, HTMLAttributes<HTMLTableCaptionElement>>(
    ({ className, ...props }, ref) => (
        <caption
            ref={ref}
            className={cn("mt-4 text-sm text-muted-foreground", className)}
            {...props}
        />
    ),
)
TableCaption.displayName = "TableCaption"

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }

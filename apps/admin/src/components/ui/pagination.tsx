import { ButtonProps, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { ComponentProps, forwardRef, useEffect, useState } from "react"

import { useTranslation } from "react-i18next"

const Pagination = ({ className, ...props }: ComponentProps<"nav">) => (
    <nav
        role="navigation"
        aria-label="pagination"
        className={cn("mx-auto flex w-full justify-center", className)}
        {...props}
    />
)
Pagination.displayName = "Pagination"

const PaginationContent = forwardRef<HTMLUListElement, ComponentProps<"ul">>(
    ({ className, ...props }, ref) => (
        <ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />
    ),
)
PaginationContent.displayName = "PaginationContent"

const PaginationItem = forwardRef<HTMLLIElement, ComponentProps<"li">>(
    ({ className, ...props }, ref) => <li ref={ref} className={cn("", className)} {...props} />,
)
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
    isActive?: boolean
} & Pick<ButtonProps, "size"> &
    ComponentProps<"button">

const PaginationLink = ({ className, isActive, size = "icon", ...props }: PaginationLinkProps) => (
    <button type="button"
        aria-current={isActive ? "page" : undefined}
        className={cn(
            buttonVariants({
                variant: isActive ? "outline" : "ghost",
                size,
            }),
            className,
        )}
        {...props}
    />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({ className, ...props }: ComponentProps<typeof PaginationLink>) => (
    <PaginationLink
        aria-label="Go to previous page"
        size="default"
        className={cn("gap-1 pl-2.5", className)}
        {...props}
    >
        <ChevronLeft className="h-4 w-4" />
        <span>Previous</span>
    </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({ className, ...props }: ComponentProps<typeof PaginationLink>) => (
    <PaginationLink
        aria-label="Go to next page"
        size="default"
        className={cn("gap-1 pr-2.5", className)}
        {...props}
    >
        <span>Next</span>
        <ChevronRight className="h-4 w-4" />
    </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({ className, ...props }: ComponentProps<"span">) => (
    <span
        aria-hidden
        className={cn("flex h-9 w-9 items-center justify-center", className)}
        {...props}
    >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">More pages</span>
    </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
}

// Keep only the count across requests. Rows and actions always belong to the current page.
export function TablePagination({ page, pageSize, total, onPageChange }: {
    page: number
    pageSize: number
    total?: number
    onPageChange: (page: number) => void
}) {
    const { t } = useTranslation()
    const [lastTotal, setLastTotal] = useState(total)
    useEffect(() => { if (total !== undefined) setLastTotal(total) }, [total])
    const count = total ?? lastTotal
    const last = count === undefined ? page : Math.ceil(count / pageSize)
    const start = Math.max(2, Math.min(page - 1, last - 3))
    const end = Math.min(last - 1, start + 2)
    const pages = []
    if (last > 0) pages.push(1)
    if (start > 2) pages.push(0)
    for (let n = start; n <= end; n++) pages.push(n)
    if (end < last - 1) pages.push(0)
    if (last > 1) pages.push(last)

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <span className="text-sm text-muted-foreground">{t("Total")}: {count ?? "—"}</span>
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious disabled={page <= 1} onClick={() => onPageChange(page - 1)} />
                    </PaginationItem>
                    {pages.map((n, i) => (
                        <PaginationItem key={n || `gap-${i}`}>
                            {n ? <PaginationLink isActive={n === page} onClick={() => onPageChange(n)}>{n}</PaginationLink>
                                : <PaginationEllipsis />}
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationNext disabled={page >= last} onClick={() => onPageChange(page + 1)} />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}

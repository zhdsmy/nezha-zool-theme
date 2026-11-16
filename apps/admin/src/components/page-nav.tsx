import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { cn } from "@/lib/utils"
import { ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"

export const pages = [
    { href: "/dashboard", label: "Server" },
    { href: "/dashboard/service", label: "Service" },
    { href: "/dashboard/cron", label: "Task" },
    { href: "/dashboard/notification", label: "Notification", also: "/dashboard/alert-rule" },
    { href: "/dashboard/ddns", label: "DDNS" },
    { href: "/dashboard/nat", label: "NATT" },
    { href: "/dashboard/server-group", label: "Group", also: "/dashboard/notification-group" },
    { href: "/dashboard/transfer", label: "Transfer.Title" },
]

export const useDesktopNav = () => useMediaQuery("(min-width: 890px)")
export const currentPage = (path: string) => pages.find((p) => p.href === path || p.also === path)

export const usePath = () => useLocation().pathname.replace(/\/$/, "") || "/dashboard"

export function PageMenu({ children }: { children: (open: boolean) => ReactNode }) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const path = usePath()
    const [open, setOpen] = useState(false)
    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>{children(open)}</DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={6} className="w-52 p-1.5">
                {pages.map((item) => {
                    const active = path === item.href || path === item.also
                    return (
                        // Navigate in onSelect: on iOS the menu unmounts on pointerup,
                        // before the click reaches a nested <Link>.
                        <DropdownMenuItem
                            key={item.href}
                            onSelect={() => navigate(item.href)}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                                "cursor-pointer h-10 px-3 text-sm",
                                active && "bg-accent text-accent-foreground font-medium",
                            )}
                        >
                            {t(item.label)}
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

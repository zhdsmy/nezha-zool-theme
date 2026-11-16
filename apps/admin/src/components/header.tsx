import { ModeToggle } from "@/components/mode-toggle"
import { NavigationMenu, NavigationMenuItem } from "@/components/ui/navigation-menu"
import { useAuth } from "@/hooks/useAuth"
import { useMainStore } from "@/hooks/useMainStore"
import { cn } from "@/lib/utils"
import { ChevronDown, LogOut, Settings, User2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { PageMenu, currentPage, pages, useDesktopNav, usePath } from "./page-nav"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { NzNavigationMenuLink } from "./xui/navigation-menu"

export default function Header() {
    const { t } = useTranslation()
    const { logout } = useAuth()
    const profile = useMainStore((store) => store.profile)
    // Members also need Settings to reach API Token and OAuth revocation.
    // The settings page itself keeps administrator-only configuration protected.

    const isDesktop = useDesktopNav()
    const path = usePath()
    const page = currentPage(path)
    // pages outside the main menu (settings tabs, profile) show their own name
    const label = page
        ? t(page.label)
        : path.startsWith("/dashboard/settings")
          ? t("Settings")
          : path === "/dashboard/profile"
            ? t("Profile")
            : t("nezha")

    const [dropdownOpen, setDropdownOpen] = useState(false)

    const navigate = useNavigate()

    const userMenu = profile && (
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
                <Avatar className="ml-1 h-8 w-8 cursor-pointer border">
                    <AvatarImage
                        src={"https://api.dicebear.com/7.x/notionists/svg?seed=" + profile.username}
                        alt={profile.username}
                    />
                    <AvatarFallback>{profile.username}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="break-all">{profile.username}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onSelect={() => navigate("/dashboard/profile")}
                        className="cursor-pointer"
                    >
                        <User2 />
                        {t("Profile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={() => navigate("/dashboard/settings")}
                        className="cursor-pointer"
                    >
                        <Settings />
                        {t("Settings")}
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={logout} className="cursor-pointer">
                    <LogOut />
                    {t("Logout")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )

    const tools = (
        <div className="ml-auto flex items-center gap-1">
            <a
                href={"/"}
                className="flex items-center text-nowrap gap-1 px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                {t("BackToHome")}
            </a>
            <ModeToggle />
            {userMenu}
        </div>
    )

    return isDesktop ? (
        <header className="border-b bg-card">
            <NavigationMenu className="mx-auto block max-w-[96rem] px-4 sm:px-6">
                <div className="flex h-14 items-center">
                    <Link
                        to={profile ? "/dashboard" : "#"}
                        className="inline-flex items-center gap-2 text-base font-semibold"
                    >
                        <img className="h-7" src="/dashboard/logo.svg" alt="" />
                        {t("nezha")}
                    </Link>
                    {tools}
                </div>
                {profile && (
                    <div className="-ml-4 flex list-none">
                        {pages.map((item) => (
                            <NavigationMenuItem key={item.href}>
                                <NzNavigationMenuLink
                                    asChild
                                    active={path === item.href || path === item.also}
                                >
                                    <Link to={item.href}>{t(item.label)}</Link>
                                </NzNavigationMenuLink>
                            </NavigationMenuItem>
                        ))}
                    </div>
                )}
            </NavigationMenu>
        </header>
    ) : (
        <header className="flex items-center border-b bg-card px-4 h-14">
            {profile ? (
                <PageMenu>
                    {(open) => (
                        <button
                            type="button"
                            aria-label={t("NavigateTo")}
                            className="-ml-1.5 my-3 inline-flex min-w-0 items-center gap-1.5 rounded-lg px-1.5 text-base font-semibold hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-ring"
                        >
                            <img className="h-7 shrink-0" src="/dashboard/logo.svg" alt="" />
                            <span className="truncate">{label}</span>
                            <ChevronDown
                                className={cn(
                                    "size-4 shrink-0 text-muted-foreground transition-transform",
                                    open && "rotate-180",
                                )}
                            />
                        </button>
                    )}
                </PageMenu>
            ) : (
                <Link className="mx-2 my-2 inline-flex items-center" to="#">
                    <img className="h-7 mr-1" src="/dashboard/logo.svg" /> {t("nezha")}
                </Link>
            )}
            {tools}
        </header>
    )
}

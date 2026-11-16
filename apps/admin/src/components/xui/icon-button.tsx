import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    BanIcon,
    Check,
    CircleArrowUp,
    Clipboard,
    CogIcon,
    Download,
    Edit2,
    Expand,
    FolderClosed,
    Menu,
    Minus,
    MoreHorizontal,
    Play,
    Plus,
    Terminal,
    Trash2,
    Upload,
    UserPen,
} from "lucide-react"
import { forwardRef } from "react"

export interface IconButtonProps extends ButtonProps {
    icon:
        | "clipboard"
        | "check"
        | "edit"
        | "trash"
        | "plus"
        | "terminal"
        | "update"
        | "folder-closed"
        | "play"
        | "download"
        | "upload"
        | "menu"
        | "ban"
        | "expand"
        | "cog"
        | "minus"
        | "user-pen"
        | "more"
}

// ZOOL: icon buttons are neutral outlines. Only "add" stays accent-filled;
// destructive ones turn red on hover/focus instead of being red at rest.
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ variant, className, ...props }, ref) => {
        const filled = props.icon === "plus" && (!variant || variant === "default")
        return (
            <Button
                {...props}
                variant={filled ? "default" : variant === "ghost" ? "ghost" : "outline"}
                className={cn(
                    "rounded-lg",
                    !filled && variant !== "ghost" && "bg-card",
                    variant === "destructive" &&
                        "hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive focus-visible:text-destructive",
                    className,
                )}
                ref={ref}
                size="icon"
            >
                {(() => {
                    switch (props.icon) {
                        case "clipboard": {
                            return <Clipboard />
                        }
                        case "check": {
                            return <Check />
                        }
                        case "edit": {
                            return <Edit2 />
                        }
                        case "trash": {
                            return <Trash2 />
                        }
                        case "plus": {
                            return <Plus />
                        }
                        case "terminal": {
                            return <Terminal />
                        }
                        case "update": {
                            return <CircleArrowUp />
                        }
                        case "folder-closed": {
                            return <FolderClosed />
                        }
                        case "play": {
                            return <Play />
                        }
                        case "download": {
                            return <Download />
                        }
                        case "upload": {
                            return <Upload />
                        }
                        case "menu": {
                            return <Menu />
                        }
                        case "ban": {
                            return <BanIcon />
                        }
                        case "expand": {
                            return <Expand />
                        }
                        case "cog": {
                            return <CogIcon />
                        }
                        case "minus": {
                            return <Minus />
                        }
                        case "user-pen": {
                            return <UserPen />
                        }
                        case "more": {
                            return <MoreHorizontal />
                        }
                    }
                })()}
            </Button>
        )
    },
)

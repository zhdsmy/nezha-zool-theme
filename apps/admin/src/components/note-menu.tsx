import { useTranslation } from "react-i18next"
import { ButtonProps } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useClipboard } from "@/hooks/useClipboard"
import { forwardRef } from "react"

import { IconButton } from "./xui/icon-button"

interface NoteMenuProps extends ButtonProps {
    note: { private?: string; public?: string }
}

export const NoteMenu = forwardRef<HTMLButtonElement, NoteMenuProps>((props, ref) => {
    const { t } = useTranslation()
    const { copied, copyText } = useClipboard()
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <IconButton
                    {...props}
                    ref={ref}
                    variant="outline"
                    size="icon"
                    icon={copied ? "check" : "clipboard"}
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem
                    onClick={() => {
                        copyText(props.note.private, "EmptyNote")
                    }}
                >
                    {t("Private")}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => {
                        copyText(props.note.public, "EmptyNote")
                    }}
                >
                    {t("Public")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
})

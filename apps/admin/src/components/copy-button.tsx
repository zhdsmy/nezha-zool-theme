import { ButtonProps } from "@/components/ui/button"
import { useClipboard } from "@/hooks/useClipboard"
import { forwardRef } from "react"

import { IconButton } from "./xui/icon-button"

interface CopyButtonProps extends ButtonProps {
    text?: string
}

export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>((props, ref) => {
    const { copied, copyText } = useClipboard()
    return (
        <IconButton
            {...props}
            ref={ref}
            variant="outline"
            size="icon"
            icon={copied ? "check" : "clipboard"}
            onClick={() => copyText(props.text)}
        />
    )
})

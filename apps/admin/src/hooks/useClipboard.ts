import { useSubmitLock } from "@/hooks/useSubmitLock"
import { copyToClipboard } from "@/lib/utils"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export function useClipboard() {
    const { t } = useTranslation()
    const { runSubmit } = useSubmitLock()
    const [copied, setCopied] = useState(false)
    useEffect(() => {
        if (!copied) return
        const timeout = setTimeout(() => setCopied(false), 2000)
        return () => clearTimeout(timeout)
    }, [copied])

    const copyText = runSubmit(async (text?: string, emptyKey: string = "EmptyText") => {
        if (!text) {
            toast(t("Warning"), { description: t(emptyKey) })
            return
        }
        if (copied) return
        try {
            await copyToClipboard(text)
            setCopied(true)
        } catch {
            toast(t("ClipboardWriteFailed"))
        }
    })
    return { copied, copyText }
}

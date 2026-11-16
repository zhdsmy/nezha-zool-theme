import { Check, Minus } from "lucide-react"

export const Flag = ({ on }: { on: boolean }) =>
    on ? (
        <Check className="size-4 text-good" aria-label="true" />
    ) : (
        <Minus className="size-4 text-muted-foreground/60" aria-label="false" />
    )

/** Column `cell` for boolean values, instead of raw "true"/"false". */
export const flagCell = ({ getValue }: { getValue: () => unknown }) => <Flag on={!!getValue()} />

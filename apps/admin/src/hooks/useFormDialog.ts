import { useState } from "react"
import { type DefaultValues, type FieldValues, type Resolver, useForm } from "react-hook-form"

export function useFormDialog<T extends FieldValues, Output = T>(
    editing: boolean,
    options: { defaultValues: DefaultValues<T>; resolver: Resolver<T, unknown, Output> },
) {
    const form = useForm<T, unknown, Output>(options)
    const [open, setOpen] = useState(false)
    function onOpenChange(next: boolean) {
        if (next && editing) form.reset(options.defaultValues)
        setOpen(next)
    }
    return { form, open, onOpenChange }
}

import { useFormDialog } from "@/hooks/useFormDialog"
import { useSubmitLock } from "@/hooks/useSubmitLock"
import { createServerGroup, updateServerGroup } from "@/api/server-group"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormErrors,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { IconButton } from "@/components/xui/icon-button"
import { MultiSelect } from "@/components/xui/multi-select"
import { serverOptions } from "@/lib/server-options"
import { useServer } from "@/hooks/useServer"
import { ModelServerGroupResponseItem } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { KeyedMutator } from "swr"
import { z } from "zod"

interface ServerGroupCardProps {
    data?: ModelServerGroupResponseItem
    mutate: KeyedMutator<ModelServerGroupResponseItem[]>
}

const serverGroupFormSchema = z.object({
    name: z.string().min(1),
    servers: z.array(z.number()),
})

export const ServerGroupCard: React.FC<ServerGroupCardProps> = ({ data, mutate }) => {
    const { t } = useTranslation()
    const { form, open, onOpenChange } = useFormDialog<z.infer<typeof serverGroupFormSchema>>(!!data, {
        resolver: zodResolver(serverGroupFormSchema),
        defaultValues: data
            ? {
                  name: data.group.name,
                  servers: data.servers ?? [],
              }
            : {
                  name: "",
                  servers: [],
              },
    })

    const { submitting, runSubmit } = useSubmitLock()
    const onSubmit = runSubmit(async (values: z.infer<typeof serverGroupFormSchema>) => {
        try {
            if (data?.group.id) {
                await updateServerGroup(data.group.id, values)
            } else {
                await createServerGroup(values)
            }
        } catch (e) {
            console.error(e)
            toast(t("Error"), {
                description: e instanceof Error && e.message ? e.message : t("Results.UnExpectedError"),
            })
            return
        }
        onOpenChange(false)
        await mutate()
        form.reset()
    })

    const { servers } = useServer()
    const serverList = serverOptions(servers)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {data ? <IconButton variant="outline" icon="edit" /> : <IconButton icon="plus" />}
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <ScrollArea className="max-h-[calc(100dvh-1.5rem)] p-1 sm:max-h-[calc(100dvh-5rem)] sm:p-3">
                    <div className="items-center mx-1">
                        <DialogHeader>
                            <DialogTitle>
                                {data ? t("EditServerGroup") : t("CreateServerGroup")}
                            </DialogTitle>
                            <DialogDescription />
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 my-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("Name")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("Placeholders.GroupName")} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="servers"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("Server")}</FormLabel>
                                            <FormControl>
                                                <MultiSelect
                                                    options={serverList}
                                                    onValueChange={(e) => {
                                                        const arr = e.map(Number)
                                                        field.onChange(arr)
                                                    }}
                                                    defaultValue={field.value?.map(String)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormErrors />
                                <DialogFooter className="justify-end">
                                    <DialogClose asChild>
                                        <Button type="button" className="my-2" variant="secondary">
                                            {t("Close")}
                                        </Button>
                                    </DialogClose>
                                    <Button disabled={submitting} type="submit" className="my-2">
                                        {t("Confirm")}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

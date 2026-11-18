import { AlertRuleCard } from "@/components/alert-rule"
import { CronCard } from "@/components/cron"
import { DDNSCard } from "@/components/ddns"
import { NotificationGroupCard } from "@/components/notification-group"
import { ServerCard } from "@/components/server"
import { ServerGroupCard } from "@/components/server-group"
import { ServiceCard } from "@/components/service"
import i18n from "@/lib/i18n"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { SWRConfig } from "swr"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

vi.mock("@/hooks/useServer", () => ({ useServer: () => ({ servers: [], serverGroups: [] }) }))
vi.mock("@/hooks/useNotfication", () => ({
    useNotification: () => ({ notifiers: [], notifierGroup: [] }),
}))
const writes: { url: string; body: Record<string, unknown> }[] = []
beforeEach(async () => {
    await i18n.changeLanguage("en-US")
    writes.length = 0
    vi.stubGlobal(
        "fetch",
        vi.fn(async (url, init) => {
            if (init?.method === "PATCH")
                writes.push({ url: String(url), body: JSON.parse(init.body) })
            return new Response(
                JSON.stringify({ success: true, data: { config: { custom_code: "" } } }),
            )
        }),
    )
})
afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
})
const base = { id: 1, name: "Original", created_at: "", updated_at: "" }
const service = {
    ...base,
    type: 1,
    target: "https://example.invalid",
    cover: 0,
    display_index: 0,
    duration: 30,
    notification_group_id: 0,
    min_latency: 0,
    max_latency: 0,
    skip_servers: {},
    fail_trigger_tasks: null,
    recover_trigger_tasks: null,
}
const cases = [
    {
        name: "service",
        Card: ServiceCard,
        data: service,
        fields: ["fail_trigger_tasks", "recover_trigger_tasks"],
    },
    {
        name: "alert",
        Card: AlertRuleCard,
        data: {
            ...base,
            notification_group_id: 0,
            trigger_mode: 0,
            rules: null,
            fail_trigger_tasks: null,
            recover_trigger_tasks: null,
        },
        fields: ["rules", "fail_trigger_tasks", "recover_trigger_tasks"],
    },
    {
        name: "notification group",
        Card: NotificationGroupCard,
        data: { group: base, notifications: null },
        fields: ["notifications"],
    },
    { name: "cron", Card: CronCard, data: { ...base, servers: null }, fields: ["servers"] },
    { name: "ddns", Card: DDNSCard, data: { ...base, domains: null }, fields: ["domains"] },
    {
        name: "server group",
        Card: ServerGroupCard,
        data: { group: base, servers: null },
        fields: ["servers"],
    },
    {
        name: "server",
        Card: ServerCard,
        data: { ...base, display_index: 0, ddns_profiles: null },
        fields: [],
    },
]
test.each(cases)(
    "ADM-05: $name submits a name-only edit with null arrays",
    async ({ Card, data, fields }) => {
        render(
            <SWRConfig value={{ provider: () => new Map() }}>
                <Card data={data as never} providers={[]} mutate={vi.fn()} />
            </SWRConfig>,
        )
        fireEvent.click(screen.getByRole("button"))
        const dialog = await screen.findByRole("dialog")
        fireEvent.change(dialog.querySelector('input[name="name"]')!, {
            target: { value: "Renamed" },
        })
        await act(async () => {
            fireEvent.submit(dialog.querySelector("form")!)
        })
        await waitFor(() => expect(writes).toHaveLength(1))
        expect(writes[0].body.name).toBe("Renamed")
        for (const field of fields) expect(writes[0].body[field]).toEqual([])
    },
)

test("ADM-05: validation errors in a hidden field remain visible", async () => {
    render(
        <ServiceCard
            data={
                { ...service, fail_trigger_tasks: ["invalid"], recover_trigger_tasks: [] } as never
            }
            mutate={vi.fn()}
        />,
    )
    fireEvent.click(screen.getByRole("button"))
    await act(async () => {
        fireEvent.submit(screen.getByRole("dialog").querySelector("form")!)
    })
    expect(writes).toHaveLength(0)
    expect(screen.getByRole("alert").textContent).toBeTruthy()
})

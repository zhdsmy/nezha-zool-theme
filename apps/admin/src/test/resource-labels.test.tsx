import NotificationPage from "@/routes/notification"
import ServerPage from "@/routes/server"
import { serviceTypes } from "@/types"
import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, expect, test, vi } from "vitest"

const { rows, groups } = vi.hoisted(() => ({
    rows: [{ id: 1, name: "Example", url: "", display_index: 0, host: { version: "1" } }],
    groups: [] as { group: { id: number; name: string }; servers: number[]; notifications: number[] }[],
}))
vi.mock("swr", async (original) => ({
    ...await original<typeof import("swr")>(), default: () => ({ data: rows, mutate: vi.fn() }),
}))
vi.mock("@/hooks/useServer", () => ({ useServer: () => ({ serverGroups: groups }) }))
vi.mock("@/hooks/useNotfication", () => ({ useNotification: () => ({ notifierGroup: groups }) }))
vi.mock("@/components/header-button-group", () => ({ HeaderButtonGroup: () => null }))
vi.mock("@/components/action-button-group", () => ({ ActionButtonGroup: () => null }))
afterEach(() => { cleanup(); groups.length = 0 })

test("the service type shared by the table and editor includes TLS", () => {
    expect(serviceTypes[4]).toBe("TLS")
})

test.each([ServerPage, NotificationPage])("group names update when membership arrives after the rows", (Page) => {
    const view = () => <MemoryRouter><Page /></MemoryRouter>
    const { rerender } = render(view())
    expect(screen.getByText("Example")).toBeTruthy()
    groups.push(...["North", "West", "Other"].map((name, i) => ({
        group: { id: i + 10, name }, servers: [i === 2 ? 2 : 1], notifications: [i === 2 ? 2 : 1],
    })))
    rerender(view())
    expect(screen.getByText("North, West")).toBeTruthy()
    expect(screen.queryByText("Other")).toBeNull()
})

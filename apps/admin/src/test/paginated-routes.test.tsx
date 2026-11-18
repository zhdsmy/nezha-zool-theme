import { swrFetcher } from "@/api/api"
import "@/lib/i18n"
import OnlineUserPage from "@/routes/online-user"
import WAFPage from "@/routes/waf"
import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { SWRConfig } from "swr"
import { expect, test, vi } from "vitest"

vi.mock("@/api/api", async original => ({ ...await original<typeof import("@/api/api")>(), swrFetcher: vi.fn() }))
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ profile: { role: 0 } }) }))

test.each([WAFPage, OnlineUserPage])("%s allows returning from a slow or failed second page", async Page => {
    let rejectPage!: (err: Error) => void
    const pending = new Promise((_, reject) => { rejectPage = reject })
    vi.mocked(swrFetcher).mockImplementation(async url => String(url).includes("offset=10")
        ? pending : { value: [{ ip: "192.0.2.1" }], pagination: { total: 21 } })
    render(<MemoryRouter><SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
        <Page />
    </SWRConfig></MemoryRouter>)
    await screen.findByText("192.0.2.1")
    const nav = within(screen.getByRole("navigation", { name: /pagination/i }))
    fireEvent.click(nav.getByRole("button", { name: /next/i }))
    expect(screen.queryByText("192.0.2.1")).toBeNull()
    expect(nav.getByRole<HTMLButtonElement>("button", { name: "3" }).disabled).toBe(false)
    await act(async () => rejectPage(new Error("page unavailable")))
    await screen.findByRole("alert")
    fireEvent.click(nav.getByRole("button", { name: /previous/i }))
    expect(await screen.findByText("192.0.2.1")).toBeTruthy()
})

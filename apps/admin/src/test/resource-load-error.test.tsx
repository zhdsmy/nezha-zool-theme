import ApiTokensPage from "@/routes/api-tokens"
import { listApiTokens } from "@/api/api-tokens"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { SWRConfig } from "swr"
import { afterEach, expect, test, vi } from "vitest"

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ profile: { role: 0 } }) }))
vi.mock("@/api/api-tokens", async (original) => ({
    ...await original<typeof import("@/api/api-tokens")>(), listApiTokens: vi.fn(),
}))
afterEach(() => { cleanup(); vi.resetAllMocks() })

const row = { id: 1, name: "existing", scopes: [], server_ids: [], created_at: "" }

function openPage(fallback = {}) {
    render(<SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false, fallback }}>
        <MemoryRouter><ApiTokensPage /></MemoryRouter>
    </SWRConfig>)
}

test("initial failure can be retried in place without showing empty results", async () => {
    vi.mocked(listApiTokens).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce([row])
    openPage()
    expect((await screen.findByRole("alert")).textContent).toContain("offline")
    expect(screen.queryByText("No results.", { exact: false })).toBeNull()
    expect(screen.queryByRole("table")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))
    expect(await screen.findByText(row.name)).toBeTruthy()
    expect(screen.queryByRole("alert")).toBeNull()
})

test("a failed revalidation keeps the cached rows visible", async () => {
    vi.mocked(listApiTokens).mockRejectedValue(new Error("offline"))
    openPage({ "/api/v1/api-tokens": [row] })
    await waitFor(() => expect(listApiTokens).toHaveBeenCalledOnce())
    expect(await screen.findByText(row.name)).toBeTruthy()
    expect(screen.queryByRole("alert")).toBeNull()
})

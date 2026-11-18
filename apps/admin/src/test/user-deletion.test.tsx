import "@/lib/i18n"
import UserPage from "@/routes/user"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, expect, test, vi } from "vitest"

const identity = vi.hoisted(() => ({ id: 1 as unknown }))
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ profile: identity }) }))
vi.mock("@/components/settings-tab", () => ({ SettingsTab: () => null }))
vi.mock("swr", () => ({
    default: () => ({ data: [{ id: 1, username: "self" }, { id: 2, username: "other" }] }),
}))
afterEach(() => { cleanup(); identity.id = 1 })
const page = () => <MemoryRouter><UserPage /></MemoryRouter>

test("select all and row delete exclude the signed-in user", () => {
    const { container } = render(page())
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all" }))
    const checks = screen.getAllByRole("checkbox", { name: "Select row" })
    expect(checks.map(c => c.getAttribute("aria-checked"))).toEqual(["false", "true"])
    expect(container.querySelectorAll('td[data-col=actions] button:disabled')).toHaveLength(1)
})

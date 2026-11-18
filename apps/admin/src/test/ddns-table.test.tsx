import "@/lib/i18n"
import DDNSPage from "@/routes/ddns"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"

vi.mock("@/api/ddns", () => ({ getDDNSProviders: async () => [], deleteDDNSProfiles: vi.fn() }))
const data = [{ id: 1, name: "Example", domains: ["a.example", "b.example"] }]
vi.mock("swr", () => ({ default: () => ({ data }) }))
afterEach(cleanup)
test("DDNS domain names remain distinguishable in one table cell", async () => {
    render(<DDNSPage />)
    expect(await screen.findByText("a.example, b.example")).toBeTruthy()
})

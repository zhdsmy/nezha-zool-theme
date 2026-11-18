/// <reference types="node" />
import "@/lib/i18n"
import { readFileSync } from "node:fs"
import DDNSPage from "@/routes/ddns"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"

vi.mock("@/api/ddns", () => ({ getDDNSProviders: async () => [], deleteDDNSProfiles: vi.fn() }))
const data = [{ id: 1, name: "Example", domains: ["a.example", "b.example"] }]
vi.mock("swr", () => ({ default: () => ({ data }) }))
afterEach(cleanup)
test("DDNS domain names remain distinguishable in one table cell", async () => {
    render(<DDNSPage />)
    expect(await screen.findByText("a.example, b.example")).toBeTruthy()
})

test("wide-screen rules give the DDNS name cell more space", async () => {
    render(<DDNSPage />)
    await waitFor(() => expect(screen.getByText("Example").matches('td[data-col="name"] > .whitespace-normal')).toBe(true))
    const styles = readFileSync("src/index.css", "utf8")
    expect(styles).toMatch(/@media \(min-width: 1280px\)\s*\{\s*\.zool-table td\[data-col="name"\] > \.whitespace-normal\s*\{\s*max-width: 24rem/)
})

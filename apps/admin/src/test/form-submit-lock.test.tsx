import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

const toastCalls: Array<{ title: string; description?: string }> = []
vi.mock("sonner", () => ({
    toast: (title: string, opts?: { description?: string }) => {
        toastCalls.push({ title, description: opts?.description })
    },
}))

const updateDDNSProfile = vi.fn()
const createDDNSProfile = vi.fn()
vi.mock("@/api/ddns", () => ({
    updateDDNSProfile: (...args: unknown[]) => updateDDNSProfile(...args),
    createDDNSProfile: (...args: unknown[]) => createDDNSProfile(...args),
}))

beforeEach(() => {
    toastCalls.length = 0
    updateDDNSProfile.mockReset()
    createDDNSProfile.mockReset()
})

afterEach(() => {
    cleanup()
    document.body.innerHTML = ""
})

test("form dialog disables confirm button while submitting, sends only one request on rapid double submit, and surfaces server error before recovering", async () => {
    const i18n = (await import("@/lib/i18n")).default
    await i18n.changeLanguage("zh-CN")
    const { DDNSCard } = await import("@/components/ddns")

    let rejectFirst!: (reason?: unknown) => void
    updateDDNSProfile.mockImplementationOnce(
        () =>
            new Promise((_resolve, reject) => {
                rejectFirst = reject
            }),
    )

    const mutate = vi.fn().mockResolvedValue(undefined)
    render(
        <DDNSCard
            providers={["cloudflare", "webhook"]}
            data={{
                id: 7,
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-01T00:00:00Z",
                name: "Cloudflare DDNS",
                provider: "cloudflare",
                access_id: "",
                access_secret: "cf-secret",
                domains: ["edge.example.com"],
                max_retries: 3,
                enable_ipv4: true,
                enable_ipv6: false,
                webhook_url: "",
                webhook_method: 1,
                webhook_request_type: 1,
                webhook_request_body: "",
                webhook_headers: "",
            }}
            mutate={mutate as never}
        />,
    )

    fireEvent.click(screen.getByRole("button"))
    const dialog = await screen.findByRole("dialog")
    const form = dialog.querySelector("form")!
    const confirmBtn = screen.getByRole("button", { name: /确认/ }) as HTMLButtonElement

    // Rapid double submission in the same user gesture window
    await act(async () => {
        fireEvent.submit(form)
        fireEvent.submit(form)
    })

    await waitFor(() => expect(updateDDNSProfile).toHaveBeenCalledTimes(1))
    expect(confirmBtn.disabled).toBe(true)

    // Clicking disabled button while in-flight must not trigger another call
    fireEvent.click(confirmBtn)
    expect(updateDDNSProfile).toHaveBeenCalledTimes(1)

    // Reject with backend error message and verify error recovery + surfaced message
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    await act(async () => {
        rejectFirst(new Error("cloudflare zone token invalid"))
    })
    consoleError.mockRestore()

    await waitFor(() => expect(confirmBtn.disabled).toBe(false))
    expect(toastCalls).toEqual([
        {
            title: "错误",
            description: "cloudflare zone token invalid",
        },
    ])
    expect(screen.queryByRole("dialog")).toBeTruthy()

    // Subsequent retry succeeds and closes dialog
    updateDDNSProfile.mockResolvedValueOnce(undefined)
    await act(async () => {
        fireEvent.submit(form)
    })
    await waitFor(() => expect(updateDDNSProfile).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
})

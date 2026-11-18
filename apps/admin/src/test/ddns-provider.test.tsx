import { DDNSCard } from "@/components/ddns"
import "@/lib/i18n"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"

const update = vi.hoisted(() => vi.fn())
vi.mock("@/api/ddns", () => ({ updateDDNSProfile: update }))
afterEach(() => { cleanup(); update.mockClear() })

test.each(["webhook", "dummy"])("only the webhook provider validates its webhook URL (%s)", async provider => {
    const data = { id: 7, name: "DDNS", provider, webhook_url: "old invalid value" }
    render(<DDNSCard data={data as never} providers={[provider]} mutate={vi.fn()} />)
    fireEvent.click(screen.getByRole("button"))
    const dialog = await screen.findByRole("dialog")
    expect(!!dialog.querySelector('input[name=webhook_url]')).toBe(provider === "webhook")
    await act(async () => { fireEvent.submit(dialog.querySelector("form")!) })
    if (provider === "webhook") expect(update).not.toHaveBeenCalled()
    else expect(update).toHaveBeenCalledWith(7, expect.objectContaining({ webhook_url: data.webhook_url }))
})

import { DDNSCard } from "@/components/ddns"
import "@/lib/i18n"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"

afterEach(cleanup)
test("reopening an editor reads refreshed data and drops the canceled draft", async () => {
    const view = (name: string) => <DDNSCard data={{ id: 1, name } as never} providers={[]} mutate={vi.fn()} />
    const { rerender } = render(view("Initial"))
    fireEvent.click(screen.getByRole("button"))
    const name = await screen.findByDisplayValue("Initial")
    fireEvent.change(name, { target: { value: "Draft" } })
    rerender(view("Refreshed"))
    expect(screen.getByDisplayValue("Draft")).toBeTruthy()
    fireEvent.keyDown(name, { key: "Escape" })
    fireEvent.click(screen.getByRole("button"))
    expect(await screen.findByDisplayValue("Refreshed")).toBeTruthy()
})

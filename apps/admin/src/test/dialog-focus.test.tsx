import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { render, screen, waitFor } from "@testing-library/react"
import { expect, test, vi } from "vitest"

test("tab focus scrolls the field above the measured sticky footer", async () => {
    render(<Dialog open><DialogContent aria-describedby={undefined}>
        <DialogTitle>Edit</DialogTitle>
        <div data-radix-scroll-area-viewport="">
            <input aria-label="First" /><input aria-label="Last" />
            <DialogFooter><button>Save</button></DialogFooter>
        </div>
    </DialogContent></Dialog>)
    const field = screen.getByLabelText("Last")
    const viewport = field.parentElement!
    const footer = screen.getByText("Save").parentElement!
    for (const [el, top, height] of [[viewport, 20, 300], [footer, 240, 80], [field, 220, 40]] as const) {
        vi.spyOn(el, "getBoundingClientRect").mockReturnValue(new DOMRect(0, top, 100, height))
    }
    field.focus()
    await waitFor(() => expect(viewport.scrollTop).toBe(24))
})

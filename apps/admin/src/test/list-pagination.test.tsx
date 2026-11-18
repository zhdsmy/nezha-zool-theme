import i18n from "@/lib/i18n"
import { TablePagination } from "@/components/ui/pagination"
import { fireEvent, render, screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"

test("a missing page response keeps the known destinations without reusing rows", () => {
    const onPageChange = vi.fn()
    const props = { pageSize: 10, onPageChange }
    const { rerender } = render(<TablePagination {...props} page={1} total={32} />)
    rerender(<TablePagination {...props} page={2} />)
    fireEvent.click(screen.getByRole("button", { name: "4" }))
    expect(onPageChange).toHaveBeenCalledWith(4)
    fireEvent.click(screen.getByRole("button", { name: /previous/i }))
    expect(onPageChange).toHaveBeenLastCalledWith(1)
    rerender(<TablePagination {...props} page={1} total={0} />)
    expect(screen.queryByRole("button", { name: "4" })).toBeNull()
    expect(screen.getByRole<HTMLButtonElement>("button", { name: /next/i }).disabled).toBe(true)
})

test("pagination exposes localized names for its icon-only controls", async () => {
    await i18n.changeLanguage("ja-JP")
    try {
        render(<TablePagination page={2} pageSize={10} total={30} onPageChange={() => {}} />)
        expect(screen.getByRole("navigation", { name: "ページ送り" })).toBeTruthy()
        expect(screen.getByRole("button", { name: "前のページ" })).toBeTruthy()
        expect(screen.getByRole("button", { name: "次のページ" })).toBeTruthy()
    } finally {
        await i18n.changeLanguage("en-US")
    }
})

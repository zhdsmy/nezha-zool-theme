import { IconButton } from "@/components/xui/icon-button"
import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"

test("mobile icon actions reserve an 11-unit touch target even in compact table cells", () => {
    render(<IconButton icon="edit" />)
    const { classList } = screen.getByRole("button")
    expect(classList.contains("max-sm:min-h-11")).toBe(true)
    expect(classList.contains("max-sm:min-w-11")).toBe(true)
})

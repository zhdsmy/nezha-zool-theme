import { CopyButton } from "@/components/copy-button"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import copy from "copy-to-clipboard"
import { toast } from "sonner"
import { afterEach, expect, test, vi } from "vitest"

vi.mock("copy-to-clipboard", () => ({ default: vi.fn() }))
vi.mock("sonner", () => ({ toast: vi.fn() }))
vi.mock("react-i18next", async (original) => ({
    ...await original<typeof import("react-i18next")>(), useTranslation: () => ({ t: (key: string) => key }),
}))
afterEach(cleanup)

test("a denied copy shows failure, retries immediately and confirms only after writing", async () => {
    let complete!: (value: boolean) => void
    vi.mocked(copy).mockResolvedValueOnce(false).mockImplementationOnce(() => new Promise(resolve => { complete = resolve }))
    const { container } = render(<CopyButton text="example" />)
    const button = screen.getByRole("button")
    fireEvent.click(button)
    await waitFor(() => expect(toast).toHaveBeenCalledWith("ClipboardWriteFailed"))
    fireEvent.click(button)
    expect(copy).toHaveBeenCalledTimes(2)
    expect(container.querySelector(".lucide-check")).toBeNull()
    await act(async () => complete(true))
    expect(container.querySelector(".lucide-check")).toBeTruthy()
})

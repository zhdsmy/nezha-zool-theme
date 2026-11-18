import { DDNSCard } from "@/components/ddns"
import { ProfileCard } from "@/components/profile"
import { UserCard } from "@/components/user"
import "@/lib/i18n"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"

afterEach(cleanup)
test.each([
    [<ProfileCard key="profile" className="" />, ["original_password", "new_password"]],
    [<UserCard key="user" mutate={vi.fn()} />, ["password"]],
    [<DDNSCard key="ddns" providers={[]} mutate={vi.fn()} />, ["access_secret"]],
] as const)("credential editors mask their secret fields", async (editor, names) => {
    render(editor)
    fireEvent.click(screen.getByRole("button"))
    const dialog = await screen.findByRole("dialog")
    for (const name of names) expect(dialog.querySelector(`input[name="${name}"]`)).toHaveProperty("type", "password")
})

test.each([
    [<DDNSCard key="ddns" providers={[]} mutate={vi.fn()} />, { access_id: "section-ddns-id new-password", access_secret: "section-ddns-secret new-password" }],
    [<UserCard key="user" mutate={vi.fn()} />, { username: "off", password: "new-password" }],
    [<ProfileCard key="profile" className="" />, { original_password: "current-password", new_password: "new-password" }],
] as const)("editors distinguish login verification from new credentials", async (editor, hints) => {
    render(editor)
    fireEvent.click(screen.getByRole("button"))
    const dialog = await screen.findByRole("dialog")
    for (const [name, hint] of Object.entries(hints)) {
        expect(dialog.querySelector(`input[name="${name}"]`)?.getAttribute("autocomplete")).toBe(hint)
    }
})

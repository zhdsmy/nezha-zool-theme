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

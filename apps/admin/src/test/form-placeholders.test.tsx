import { CronCard } from "@/components/cron"
import i18n from "@/lib/i18n"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { expect, test } from "vitest"

test("the task editor uses Japanese for text, search and empty multi-select prompts", async () => {
    await i18n.changeLanguage("ja-JP")
    try {
        render(<CronCard mutate={async () => undefined} />)
        fireEvent.click(screen.getByRole("button"))
        const form = within(await screen.findByRole("dialog"))
        expect(form.getByPlaceholderText("マイタスク")).toBeTruthy()
        expect(form.getByText(i18n.t("Search"))).toBeTruthy()
        expect(form.getByText(i18n.t("SelectOptions"))).toBeTruthy()
    } finally {
        await i18n.changeLanguage("en-US")
    }
})

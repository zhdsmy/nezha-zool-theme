import { ServerConfigCard } from "@/components/server-config"
import i18n from "@/lib/i18n"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { expect, test, vi } from "vitest"

vi.mock("@/api/server", () => ({ getServerConfig: async () => "{}" }))

test("agent config renders all fourteen field labels in the interface language", async () => {
    await i18n.changeLanguage("zh-CN")
    try {
        render(<ServerConfigCard sid={1} />)
        fireEvent.click(screen.getByRole("button"))
        const dialog = within(await screen.findByRole("dialog"))
        expect(await dialog.findByLabelText("IP 上报周期（秒）")).toBeTruthy()
        const labels = i18n.getResourceBundle("zh-CN", "translation").AgentConfig
        expect(Object.keys(labels)).toHaveLength(14)
        for (const value of Object.values<string>(labels)) expect(dialog.getByText(value)).toBeTruthy()
    } finally {
        await i18n.changeLanguage("en-US")
    }
})

import i18n from "@/lib/i18n"
import { expect, test } from "vitest"

test("the Japanese DDNS editor has localized form and action labels", async () => {
    await i18n.changeLanguage("ja-JP")
    for (const key of ["EditDDNS", "Name", "Provider", "Confirm", "Close"]) {
        expect(i18n.getResource("ja-JP", "translation", key)).toMatch(/[\u3040-\u30ff\u3400-\u9fff]/)
    }
})

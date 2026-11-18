import { expect, test } from "vitest"

test("document language follows the saved locale, switches and fallback", async () => {
    localStorage.setItem("language", "ja-JP")
    const { default: i18n } = await import("@/lib/i18n")
    expect(document.documentElement.lang).toBe("ja-JP")
    await i18n.changeLanguage("zh-TW")
    expect(document.documentElement.lang).toBe("zh-TW")
    await i18n.changeLanguage("xx")
    expect(document.documentElement.lang).toBe("en-US")
})

import html from "../../index.html?raw"
import { afterEach, expect, test, vi } from "vitest"

afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

test.each([
    [null, true, "dark"], ["invalid", true, "dark"], ["system", false, "light"],
    ["light", true, "light"], ["dark", false, "dark"],
] as const)("the document head applies %s with system dark %s before React", (stored, matches, expected) => {
    if (stored) localStorage.setItem("vite-ui-theme", stored)
    vi.stubGlobal("matchMedia", () => ({ matches, addEventListener: vi.fn() }))
    const script = new DOMParser().parseFromString(html, "text/html").head.querySelector("script")!
    expect(script.type).toBe("")
    new Function(script.textContent!)()
    const root = document.documentElement
    expect(root.classList.contains(expected)).toBe(true)
    expect(root.style.colorScheme).toBe(expected)
    window.setZoolTheme("light")
    expect(root.classList.contains("dark")).toBe(false)
    expect(localStorage.getItem("vite-ui-theme")).toBe("light")
})

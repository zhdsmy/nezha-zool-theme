import { createContext, useContext, useState } from "react"

export type Theme = "dark" | "light" | "system"

declare global {
    interface Window {
        setZoolTheme(theme: Theme): void
    }
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        const preference = document.documentElement.dataset.theme
        return preference === "dark" || preference === "light" ? preference : "system"
    })
    const value = {
        theme,
        setTheme: (next: Theme) => {
            window.setZoolTheme(next)
            setTheme(next)
        },
    }

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

    return context
}

import { AuthProvider, useAuth } from "@/hooks/useAuth"
import { useMainStore } from "@/hooks/useMainStore"
import { useNotificationStore } from "@/hooks/useNotificationStore"
import { useServerStore } from "@/hooks/useServerStore"
import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import useSWR, { useSWRConfig } from "swr"
import { afterEach, expect, test, vi } from "vitest"

vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }))
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock("@/api/user", () => ({
    getProfile: vi.fn(async () => ({ id: 2, role: 1 })),
    login: vi.fn(async () => {}),
}))
afterEach(cleanup)

test.each(["login", "loginOauth2"] as const)(
    "ADM-01: %s isolates cache and stores after logout, including late requests",
    async (method) => {
        let auth: ReturnType<typeof useAuth>
        let cache: ReturnType<typeof useSWRConfig>["cache"]
        let finish: (value: string) => void = () => {}
        let denied = false
        const fetcher = vi.fn(() =>
            denied
                ? Promise.reject(new Error("403"))
                : new Promise<string>((resolve) => {
                      finish = resolve
                  }),
        )
        function Consumer() {
            auth = useAuth()
            cache = useSWRConfig().cache
            const { data, error } = useSWR("/api/v1/server", fetcher, { shouldRetryOnError: false })
            return <div>{data ?? (error ? "denied" : "empty")}</div>
        }
        render(
            <AuthProvider>
                <Consumer />
            </AuthProvider>,
        )
        await waitFor(() => expect(useMainStore.getState().profile?.id).toBe(2))
        const oldCache = cache!
        useServerStore.setState({ server: [{ id: 1, name: "private-server" }] })
        useNotificationStore.setState({ notifiers: [{ id: 1, name: "private-notifier" }] })
        denied = true
        act(() => auth!.logout())
        expect(useServerStore.getState().server).toBeUndefined()
        expect(useNotificationStore.getState().notifiers).toBeUndefined()
        expect(localStorage.getItem("serverStore")).not.toContain("private-server")
        await act(async () => {
            if (method === "login") await auth!.login("member", "mock")
            else await auth!.loginOauth2()
        })
        await act(async () => {
            finish("old private response")
        })
        await screen.findByText("denied")
        expect(cache!).not.toBe(oldCache)
        expect(screen.queryByText("old private response")).toBeNull()
    },
)

test.each(["login", "loginOauth2"] as const)(
    "ADM-01: %s clears the previous session even when the new profile returns 403",
    async (method) => {
        const { getProfile } = await import("@/api/user")
        let auth: ReturnType<typeof useAuth>
        let cache: ReturnType<typeof useSWRConfig>["cache"]
        function Consumer() {
            auth = useAuth()
            cache = useSWRConfig().cache
            return null
        }
        render(
            <AuthProvider>
                <Consumer />
            </AuthProvider>,
        )
        await waitFor(() => expect(useMainStore.getState().profile?.id).toBe(2))
        const oldCache = cache!
        useServerStore.setState({ server: [{ id: 1, name: "private-server" }] })
        vi.mocked(getProfile).mockRejectedValueOnce(new Error("403"))
        await act(async () => {
            if (method === "login") await auth!.login("member", "mock")
            else await auth!.loginOauth2()
        })
        expect(useMainStore.getState().profile).toBeUndefined()
        expect(useServerStore.getState().server).toBeUndefined()
        expect(cache!).not.toBe(oldCache)
    },
)

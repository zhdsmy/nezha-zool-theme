import { AuthProvider } from "@/hooks/useAuth"
import { useMainStore } from "@/hooks/useMainStore"
import { useServerStore } from "@/hooks/useServerStore"
import { rememberMCPOAuthReturn } from "@/lib/mcp-oauth-navigation"
import Login from "@/routes/login"
import ProtectedRoute from "@/routes/protect"
import Root from "@/routes/root"
import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import { RouterProvider, createBrowserRouter } from "react-router-dom"
const errorToast = vi.hoisted(() => vi.fn())
vi.mock("sonner", async (original) => ({ ...(await original<typeof import("sonner")>()), toast: errorToast }))
import { afterEach, expect, test, vi } from "vitest"

vi.mock("@/api/user", () => ({ getProfile: vi.fn(), login: vi.fn() }))
vi.mock("@/api/api", () => ({
    swrFetcher: vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return { config: { site_name: "Callback test" } }
    }),
}))

afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    sessionStorage.clear()
    useMainStore.setState({ profile: undefined })
})

test.each(["success", "failure"])(
    "R2-ADM-02: real Login and Root consume a slow OAuth callback once (%s)",
    async (outcome) => {
        vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
        const { getProfile } = await import("@/api/user")
        const requests: Array<{ resolve: (value: any) => void; reject: (error: Error) => void }> =
            []
        vi.mocked(getProfile)
            .mockReset()
            .mockImplementation(
                () =>
                    new Promise((resolve, reject) => {
                        requests.push({ resolve, reject })
                    }),
            )
        window.history.replaceState({}, "", "/dashboard/login?oauth2=true")
        const target = "/dashboard/mcp/authorize?client_id=test&state=keep%2Bstate"
        rememberMCPOAuthReturn(target)
        const router = createBrowserRouter([
            {
                path: "/dashboard",
                element: (
                    <AuthProvider>
                        <ProtectedRoute>
                            <Root />
                        </ProtectedRoute>
                    </AuthProvider>
                ),
                children: [
                    { path: "login", element: <Login /> },
                    { path: "mcp/authorize", element: <div>Authorization target</div> },
                ],
            },
        ])
        useServerStore.setState({ server: [{ id: 1, name: "old private server" }] })
        render(<RouterProvider router={router} />)
        await waitFor(() => expect(requests.length).toBeGreaterThanOrEqual(2))
        // Let the cache reset remount Root/Login while profile is still pending.
        await screen.findByRole("textbox", { name: /username|用户名/i })
        expect(window.location.search).toBe("")
        expect(requests).toHaveLength(2)
        expect(useServerStore.getState().server).toBeUndefined()
        await act(async () => {
            if (outcome === "success") requests[1].resolve({ id: 2, role: 1 })
            else requests[1].reject(new Error("MOCK_PROFILE_DENIED"))
            requests[0].resolve({ id: 1, role: 0 })
        })
        if (outcome === "success") {
            await screen.findByText("Authorization target")
            expect(window.location.pathname + window.location.search).toBe(target)
            expect(useMainStore.getState().profile?.id).toBe(2)
        } else {
            expect(errorToast).toHaveBeenCalledWith("MOCK_PROFILE_DENIED")
            expect(window.location.pathname).toBe("/dashboard/login")
            expect(useMainStore.getState().profile).toBeUndefined()
        }
        expect(requests).toHaveLength(2)
        router.dispose()
    },
)

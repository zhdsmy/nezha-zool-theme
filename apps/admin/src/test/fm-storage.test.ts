import { afterEach, expect, test, vi } from "vitest"

afterEach(() => vi.unstubAllGlobals())

test("R2-ADM-01: download cleanup preserves unrelated OPFS files and directories", async () => {
    function directory() {
        const entries = new Map<string, any>()
        return {
            kind: "directory",
            entries: () => entries.entries(),
            getDirectoryHandle: vi.fn(async (name: string) => {
                if (!entries.has(name)) entries.set(name, directory())
                return entries.get(name)
            }),
            getFileHandle: vi.fn(async (name: string) => {
                const handle = { close: vi.fn(), write: vi.fn(), flush: vi.fn(), truncate: vi.fn() }
                const file = {
                    kind: "file",
                    createSyncAccessHandle: async () => handle,
                    getFile: async () => new Blob(["A"]),
                    handle,
                }
                entries.set(name, file)
                return file
            }),
            removeEntry: vi.fn(async (name: string) => {
                entries.delete(name)
            }),
        }
    }
    const root = directory()
    await root.getFileHandle("other-app.txt")
    await root.getDirectoryHandle("other-app-data")
    vi.stubGlobal("navigator", { storage: { getDirectory: async () => root } })
    vi.stubGlobal("onmessage", null)
    vi.stubGlobal("postMessage", vi.fn())
    await import("../lib/fm")
    const send = async (data: unknown) => {
        await globalThis.onmessage!.call(window, new MessageEvent("message", { data }))
    }
    const header = new ArrayBuffer(12)
    new DataView(header).setBigUint64(4, 1n)
    await send({ operation: 1, arrayBuffer: header, fileName: "download.txt" })
    const downloads = await root.getDirectoryHandle("nezha-fm-downloads")
    await downloads.getFileHandle("another-tab")
    await send({ operation: 3 })
    expect([...root.entries()].map(([name]) => name)).toEqual([
        "other-app.txt",
        "other-app-data",
        "nezha-fm-downloads",
    ])
    expect([...downloads.entries()].map(([name]) => name)).toEqual(["another-tab"])
    expect(root.removeEntry).not.toHaveBeenCalled()
    await send({ operation: 3 })
    expect(postMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: 0 }))
})

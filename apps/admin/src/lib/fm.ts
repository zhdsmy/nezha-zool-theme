let draftName: string
let receivedLength = 0
let expectedLength = 0
let downloads: FileSystemDirectoryHandle | undefined
let draftHandle: FileSystemFileHandle
let accessHandle: FileSystemSyncAccessHandle | undefined

enum Operation {
    WriteHeader = 1,
    WriteChunks,
    DeleteFiles,
}

onmessage = async function (event) {
    try {
        const { operation, arrayBuffer, fileName } = event.data

        switch (operation) {
            case Operation.WriteHeader: {
                const dataView = new DataView(arrayBuffer)
                expectedLength = Number(dataView.getBigUint64(4, false))
                receivedLength = 0

                // Create a new temporary file
                accessHandle?.close()
                accessHandle = undefined
                const root = await navigator.storage.getDirectory()
                downloads = await root.getDirectoryHandle("nezha-fm-downloads", { create: true })
                draftName ??= crypto.randomUUID()
                draftHandle = await downloads.getFileHandle(draftName, { create: true })
                accessHandle = await draftHandle.createSyncAccessHandle()
                accessHandle.truncate(0)

                // Inform that file handle is created
                const dataChunk = arrayBuffer.slice(12)
                receivedLength += dataChunk.byteLength
                accessHandle.write(dataChunk, { at: 0 })
                const progress = "got handle"
                postMessage({ type: 1, progress: progress })
                break
            }
            case Operation.WriteChunks: {
                if (!accessHandle) {
                    throw new Error("accessHandle is undefined")
                }

                accessHandle.write(arrayBuffer, { at: receivedLength })
                receivedLength += arrayBuffer.byteLength

                if (receivedLength === expectedLength) {
                    accessHandle.flush()
                    accessHandle.close()
                    accessHandle = undefined

                    const fileBlob = await draftHandle.getFile()
                    const blob = new Blob([fileBlob], { type: "application/octet-stream" })

                    postMessage({ type: 2, blob: blob, fileName: fileName })
                }
                break
            }
            case Operation.DeleteFiles: {
                accessHandle?.close()
                accessHandle = undefined
                if (!downloads) break
                await downloads.removeEntry(draftName)
                downloads = undefined
                break
            }
        }
    } catch (error) {
        if (error instanceof Error) postMessage({ type: 0, error: error.message })
    }
}

export {}

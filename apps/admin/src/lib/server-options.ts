import type { ServerIdentifierType } from "@/types"

export function serverOptions(servers: ServerIdentifierType[] = []) {
    const counts = new Map<string, number>()
    for (const { name } of servers) counts.set(name, (counts.get(name) ?? 0) + 1)
    return servers.map(({ id, name }) => ({
        value: String(id),
        label: counts.get(name) === 1 ? name : `${name} #${id}`,
    }))
}

// metaCache.js - Cache court des métadonnées de groupe (participants/admins)
// But : éviter que antilink/antinsfw/antiword/antisticker/etc. refassent chacun
// le même appel réseau groupMetadata() pour un seul message reçu.

const cache = new Map() // remoteJid -> { data, time }
const TTL = 45_000 // 45s : largement suffisant, les rôles admin changent rarement à la seconde

export async function getGroupMetadata(client, remoteJid) {
    const cached = cache.get(remoteJid)
    if (cached && Date.now() - cached.time < TTL) return cached.data

    const data = await client.groupMetadata(remoteJid)
    cache.set(remoteJid, { data, time: Date.now() })
    return data
}

// À appeler après un kick/promote/demote pour forcer un refresh immédiat
export function invalidate(remoteJid) {
    cache.delete(remoteJid)
}

export default { getGroupMetadata, invalidate }

// antidelete.js - Cache des messages récents pour récupération
import { card } from './design.js'

const messageCache = new Map()
const MAX_CACHE_AGE_MS = 30 * 60 * 1000 // 30 minutes
const MAX_CACHE_SIZE   = 3000

// Nettoyage automatique toutes les 2 minutes
setInterval(() => {
    const now = Date.now()
    let cleared = 0
    for (const [key, val] of messageCache) {
        if (now - val.timestamp > MAX_CACHE_AGE_MS) {
            messageCache.delete(key)
            cleared++
        }
    }
    // Si encore trop gros, virer les plus vieux
    if (messageCache.size > MAX_CACHE_SIZE) {
        const sorted = [...messageCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)
        sorted.slice(0, messageCache.size - MAX_CACHE_SIZE).forEach(([k]) => messageCache.delete(k))
    }
}, 120000)

export function cacheMessage(message) {
    try {
        const id        = message.key?.id
        const remoteJid = message.key?.remoteJid
        if (!id || !remoteJid || message.key?.fromMe) return // pas besoin de cacher ses propres messages

        const msg = message.message || {}
        const text =
            msg.conversation ||
            msg.extendedTextMessage?.text ||
            msg.imageMessage?.caption ||
            msg.videoMessage?.caption ||
            null

        const hasImage = !!msg.imageMessage
        const hasVideo = !!msg.videoMessage
        const hasAudio = !!msg.audioMessage
        const hasSticker = !!msg.stickerMessage
        const hasDoc   = !!msg.documentMessage

        messageCache.set(`${remoteJid}:${id}`, {
            sender   : message.key.participant || remoteJid,
            remoteJid,
            text,
            hasMedia : hasImage || hasVideo || hasAudio || hasSticker || hasDoc,
            mediaType: hasImage ? 'image' : hasVideo ? 'vidéo' : hasAudio ? 'audio' : hasSticker ? 'sticker' : hasDoc ? 'document' : null,
            rawMessage: message, // message complet pour pouvoir retransmettre le média
            timestamp: Date.now()
        })
    } catch {}
}

export function getCachedMessage(remoteJid, id) {
    return messageCache.get(`${remoteJid}:${id}`) || null
}

export default { cacheMessage, getCachedMessage }

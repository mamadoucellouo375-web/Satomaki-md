// protections.js - Système de protections avancées (antinsfw, antiword, antibot, antighost, antibad)
import configmanager from './configmanager.js'
import { card } from './design.js'
import { getGroupMetadata } from './metaCache.js'
import { isBotAdmin } from './groupHelper.js'

// ─── Structure persistante ─────────────────────────────────────
function cfg(key, def = {}) {
    if (!configmanager.config[key]) configmanager.config[key] = def
    return configmanager.config[key]
}

export function isEnabled(feature, remoteJid) {
    return !!cfg(`${feature}Groups`)[remoteJid]
}

export function toggle(feature, remoteJid, on) {
    const store = cfg(`${feature}Groups`)
    if (on) store[remoteJid] = true
    else delete store[remoteJid]
    configmanager.save()
}

// ─── Anti-NSFW (liens/mots adultes) ──────────────────────────
const NSFW_PATTERNS = [
    /\bporn\b/i, /\bxxx\b/i, /\bsex\b/i, /\bnude\b/i, /\bonlyfans\b/i,
    /\bbdsm\b/i, /\berotic\b/i, /\bhentai\b/i, /\bescort\b/i, /\bstrip\b/i,
    /xvideos|xnxx|pornhub|redtube|youporn|xhamster|chaturbate/i
]

export async function nsfw(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid?.includes('@g.us')) return
    if (!isEnabled('antinsfw', remoteJid)) return
    if (message.key.fromMe) return

    const sender = message.key.participant || remoteJid
    const body   = message.message?.conversation || message.message?.extendedTextMessage?.text || ''

    let meta
    try {
        meta = await getGroupMetadata(client, remoteJid)
        const isAdmin = meta.participants.find(p => p.id === sender)?.admin
        if (isAdmin) return
    } catch { return }

    const isNsfw = NSFW_PATTERNS.some(r => r.test(body))
    if (!isNsfw) return

    if (!isBotAdmin(client, meta)) {
        console.log('[antinsfw] Contenu détecté mais le bot n\'est pas admin, suppression impossible.')
        return
    }

    try {
        await client.sendMessage(remoteJid, { delete: message.key })
        await client.sendMessage(remoteJid, {
            text: card('CONTENU NSFW BLOQUÉ', [
                `Membre : @${sender.split('@')[0]}`,
                'Contenu inapproprié supprimé.',
            ]),
            mentions: [sender]
        })
    } catch (e) {
        console.error('[antinsfw] Échec de la suppression:', e.message)
    }
}

// ─── Anti-Bad Words (mots interdits personnalisables) ─────────
function getBadWords(remoteJid) {
    if (!configmanager.config.badwords) configmanager.config.badwords = {}
    return configmanager.config.badwords[remoteJid] || []
}

export function setBadWords(remoteJid, words) {
    if (!configmanager.config.badwords) configmanager.config.badwords = {}
    configmanager.config.badwords[remoteJid] = words
    configmanager.save()
}

export async function badword(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid?.includes('@g.us')) return
    if (!isEnabled('antiword', remoteJid)) return
    if (message.key.fromMe) return

    const sender = message.key.participant || remoteJid
    const body   = (message.message?.conversation || message.message?.extendedTextMessage?.text || '').toLowerCase()

    let meta
    try {
        meta = await getGroupMetadata(client, remoteJid)
        const isAdmin = meta.participants.find(p => p.id === sender)?.admin
        if (isAdmin) return
    } catch { return }

    const badWords = getBadWords(remoteJid)
    const found    = badWords.find(w => body.includes(w.toLowerCase()))
    if (!found) return

    if (!isBotAdmin(client, meta)) {
        console.log('[antiword] Mot interdit détecté mais le bot n\'est pas admin, suppression impossible.')
        return
    }

    try {
        await client.sendMessage(remoteJid, { delete: message.key })
        await client.sendMessage(remoteJid, {
            text: card('MOT INTERDIT', [
                `Membre : @${sender.split('@')[0]}`,
                `Mot bloqué supprimé.`,
            ]),
            mentions: [sender]
        })
    } catch (e) {
        console.error('[antiword] Échec de la suppression:', e.message)
    }
}

// ─── Anti-Ghost (supprime les comptes désactivés/fantômes) ────
export async function detectGhost(client, message) {
    // Un "ghost" est un participant sans activité détectable — on se limite à bloquer les JID fantômes
    // en pratique c'est une heuristique : on détecte si un sender n'a pas de numéro de téléphone valide
    const sender = message.key.participant || message.key.remoteJid
    if (!sender?.includes('@s.whatsapp.net')) return
    const num = sender.split('@')[0]
    if (!num || num.length < 7) {
        console.warn(`Ghost JID détecté : ${sender}`)
    }
}

// ─── Anti-Bot (bloque les bots WhatsApp) ─────────────────────
const BOT_SIGNATURES = [
    /baileys/i, /whatsapp-bot/i, /md-bot/i, /bot-md/i,
    /📌 \.menu/i, /🤖.*préfixe/i, /préfixe.*🤖/i
]

export async function antibot(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid?.includes('@g.us')) return
    if (!isEnabled('antibot', remoteJid)) return
    if (message.key.fromMe) return

    const sender = message.key.participant || remoteJid
    const body   = message.message?.conversation || message.message?.extendedTextMessage?.text || ''

    const isBot = BOT_SIGNATURES.some(r => r.test(body))
    if (!isBot) return

    let meta
    try { meta = await getGroupMetadata(client, remoteJid) } catch (e) {
        console.error('[antibot] Impossible de lire les métadonnées:', e.message)
        return
    }
    if (!isBotAdmin(client, meta)) {
        console.log('[antibot] Bot détecté mais notre bot n\'est pas admin, expulsion impossible.')
        return
    }

    try {
        await client.sendMessage(remoteJid, {
            text: card('BOT DÉTECTÉ', [
                `Membre  : @${sender.split('@')[0]}`,
                'Les bots ne sont pas autorisés dans ce groupe.',
                '---',
                'Action : Expulsion',
            ]),
            mentions: [sender]
        })
        await client.groupParticipantsUpdate(remoteJid, [sender], 'remove')
    } catch (e) {
        console.error('[antibot] Échec de l\'expulsion:', e.message)
    }
}

// ─── Anti-Sticker spam ────────────────────────────────────────
const stickerTracker = new Map()

export async function antisticker(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid?.includes('@g.us')) return
    if (!isEnabled('antisticker', remoteJid)) return
    if (message.key.fromMe) return
    if (!message.message?.stickerMessage) return

    const sender = message.key.participant || remoteJid
    let meta
    try {
        meta = await getGroupMetadata(client, remoteJid)
        const isAdmin = meta.participants.find(p => p.id === sender)?.admin
        if (isAdmin) return
    } catch { return }

    const key       = `${remoteJid}:${sender}`
    const now       = Date.now()
    const recent    = (stickerTracker.get(key) || []).filter(t => now - t < 10000)
    recent.push(now)
    stickerTracker.set(key, recent)

    if (recent.length >= 4) {
        stickerTracker.delete(key)

        if (!isBotAdmin(client, meta)) {
            console.log('[antisticker] Spam détecté mais le bot n\'est pas admin, suppression impossible.')
            return
        }

        try {
            await client.sendMessage(remoteJid, { delete: message.key })
            await client.sendMessage(remoteJid, {
                text: card('SPAM STICKERS', [
                    `Membre : @${sender.split('@')[0]}`,
                    'Trop de stickers envoyés trop vite.',
                ]),
                mentions: [sender]
            })
        } catch (e) {
            console.error('[antisticker] Échec de la suppression:', e.message)
        }
    }
}

export default { nsfw, badword, antibot, antisticker, detectGhost, isEnabled, toggle, setBadWords, getBadWords }


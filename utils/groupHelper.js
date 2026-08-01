// groupHelper.js - Utilitaires partagés pour les commandes de groupe
import { card, error } from './design.js'
import { getGroupMetadata } from './metaCache.js'

// Extrait la partie numérique d'un identifiant WhatsApp, peu importe le format
// (243977006601:16@s.whatsapp.net -> 243977006601 ; 261701031215166@lid -> 261701031215166)
function numOf(jid) {
    if (!jid) return null
    return jid.split('@')[0].split(':')[0]
}

/**
 * Vérifie si le bot est admin du groupe. 
 * Retourne { isAdmin, isSuperAdmin, meta } ou envoie un message d'erreur et retourne null.
 */
export async function requireBotAdmin(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us')) {
        await client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
        return null
    }

    let meta
    try {
        meta = await getGroupMetadata(client, remoteJid)
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(`Impossible de lire les infos du groupe : ${e.message}`) }, { quoted: message })
        return null
    }

    // Rassembler tous les identifiants possibles du bot (JID classique ET/OU lid),
    // car WhatsApp peut renvoyer l'un ou l'autre selon le groupe/compte.
    const me = client.user || {}
    const botIds  = [me.id, me.lid, me.jid, me.phoneNumber].filter(Boolean)
    const botNums = new Set(botIds.map(numOf).filter(Boolean))

    const botP = meta.participants.find(p => {
        const candidates = [p.id, p.jid, p.lid, p.phoneNumber].filter(Boolean)
        return candidates.some(c => botIds.includes(c) || botNums.has(numOf(c)))
    })
    const isAdmin = !!botP?.admin

    if (!isAdmin) {
        await client.sendMessage(remoteJid, {
            text: card('BOT NON ADMIN', [
                'Le bot doit être *admin* du groupe pour effectuer cette action.',
                '---',
                'Donne les droits admin au bot, puis réessaie.',
            ])
        }, { quoted: message })
        return null
    }

    return { isAdmin, isSuperAdmin: botP?.admin === 'superadmin', meta, botId: botP.id }
}

/**
 * Récupère la cible depuis un message (mention ou reply).
 * Retourne le JID ou null après avoir envoyé un message d'erreur.
 */
export async function getTarget(client, message, label = 'un membre') {
    const remoteJid = message.key.remoteJid
    const target = message.message?.extendedTextMessage?.contextInfo?.participant
        || message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]

    if (!target) {
        await client.sendMessage(remoteJid, {
            text: error(`Mentionne ou réponds au message de ${label}.`)
        }, { quoted: message })
        return null
    }
    return target
}

/**
 * Vérifie si la cible est admin (tolère les formats JID et lid).
 */
export function targetIsAdmin(meta, targetId) {
    const targetNum = numOf(targetId)
    return !!meta.participants.find(p => {
        const candidates = [p.id, p.jid, p.lid, p.phoneNumber].filter(Boolean)
        return candidates.includes(targetId) || (targetNum && candidates.some(c => numOf(c) === targetNum))
    })?.admin
}

export default { requireBotAdmin, getTarget, targetIsAdmin }


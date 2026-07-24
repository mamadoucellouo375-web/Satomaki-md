// groupHelper.js - Utilitaires partagés pour les commandes de groupe
import { card, error } from './design.js'

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
        meta = await client.groupMetadata(remoteJid)
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(`Impossible de lire les infos du groupe : ${e.message}`) }, { quoted: message })
        return null
    }

    const botId  = client.user.id.split(':')[0] + '@s.whatsapp.net'
    const botP   = meta.participants.find(p => p.id === botId || p.id === client.user.id)
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

    return { isAdmin, isSuperAdmin: botP?.admin === 'superadmin', meta, botId }
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
 * Vérifie si la cible est admin.
 */
export function targetIsAdmin(meta, targetId) {
    return !!meta.participants.find(p => p.id === targetId)?.admin
}

export default { requireBotAdmin, getTarget, targetIsAdmin }

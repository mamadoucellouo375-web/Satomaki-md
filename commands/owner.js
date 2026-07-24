// owner.js - Superpouvoirs owner (bypass ou avec vérif admin selon la commande)
import { card, success, error, loading } from '../utils/design.js'
import configmanager from '../utils/configmanager.js'
import { requireBotAdmin } from '../utils/groupHelper.js'

function isRealOwner(client, message) {
    const botNum = client.user?.id?.split(':')[0]
    const cfg    = configmanager.config.users?.[botNum]
    const sender = message.key.participant || message.key.remoteJid
    return (
        message.key.fromMe ||
        sender === `${botNum}@s.whatsapp.net` ||
        cfg?.sudoList?.includes(sender)
    )
}

function getTarget(message) {
    return message.message?.extendedTextMessage?.contextInfo?.participant
        || message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
}

// ─── Rétrogradation forcée (bot doit être admin) ────────────────
export async function forcedemote(client, message) {
    const remoteJid = message.key.remoteJid
    if (!isRealOwner(client, message))
        return client.sendMessage(remoteJid, { text: error('Owner uniquement.') }, { quoted: message })

    const ctx = await requireBotAdmin(client, message)
    if (!ctx) return  // message envoyé par requireBotAdmin

    const target = getTarget(message)
    if (!target)
        return client.sendMessage(remoteJid, { text: error('Mentionne ou réponds à l\'admin à rétrograder.') }, { quoted: message })

    try {
        await client.groupParticipantsUpdate(remoteJid, [target], 'demote')
        await client.sendMessage(remoteJid, {
            text: card('RÉTROGRADATION FORCÉE', [
                `Cible  : @${target.split('@')[0]}`,
                'Statut : Admin retiré ✅',
            ]),
            mentions: [target]
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(`Échec : ${e.message}`) }, { quoted: message })
    }
}

// ─── Auto-promotion (bot doit être dans le groupe, pas forcément admin) ─
export async function selfpromote(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us'))
        return client.sendMessage(remoteJid, { text: error('Groupe uniquement.') }, { quoted: message })
    if (!isRealOwner(client, message))
        return client.sendMessage(remoteJid, { text: error('Owner uniquement.') }, { quoted: message })

    const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'
    try {
        await client.groupParticipantsUpdate(remoteJid, [botId], 'promote')
        await client.sendMessage(remoteJid, {
            text: card('AUTO-PROMOTION', [
                'Le bot est maintenant Admin 👑',
                "L'Empire prend sa place.",
            ])
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, {
            text: error(`Échec : ${e.message}\n\nNote : Un admin existant doit d'abord promouvoir le bot.`)
        }, { quoted: message })
    }
}

// ─── Expulsion forcée (bot doit être admin) ─────────────────────
export async function forcekick(client, message) {
    const remoteJid = message.key.remoteJid
    if (!isRealOwner(client, message))
        return client.sendMessage(remoteJid, { text: error('Owner uniquement.') }, { quoted: message })

    const ctx = await requireBotAdmin(client, message)
    if (!ctx) return

    const target = getTarget(message)
    if (!target)
        return client.sendMessage(remoteJid, { text: error('Mentionne ou réponds au membre à expulser.') }, { quoted: message })

    try {
        // Détrograder d'abord si admin
        const isTargetAdmin = !!ctx.meta.participants.find(p => p.id === target)?.admin
        if (isTargetAdmin) {
            try { await client.groupParticipantsUpdate(remoteJid, [target], 'demote') } catch {}
            await new Promise(r => setTimeout(r, 500))
        }
        await client.groupParticipantsUpdate(remoteJid, [target], 'remove')
        await client.sendMessage(remoteJid, {
            text: card('EXPULSION FORCÉE', [
                `Cible  : @${target.split('@')[0]}`,
                'Statut : Expulsé ✅',
                "Aucun obstacle à l'Empire.",
            ]),
            mentions: [target]
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(`Échec : ${e.message}`) }, { quoted: message })
    }
}

// ─── Takeover (bot prend tous les droits) ───────────────────────
export async function takeover(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us'))
        return client.sendMessage(remoteJid, { text: error('Groupe uniquement.') }, { quoted: message })
    if (!isRealOwner(client, message))
        return client.sendMessage(remoteJid, { text: error('Owner uniquement.') }, { quoted: message })

    const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'
    await client.sendMessage(remoteJid, { text: loading('Prise de contrôle du groupe') }, { quoted: message })

    try {
        const meta   = await client.groupMetadata(remoteJid)
        const admins = meta.participants.filter(p => p.admin && p.id !== botId)

        // 1. Se promouvoir en premier
        try { await client.groupParticipantsUpdate(remoteJid, [botId], 'promote') } catch {}
        await new Promise(r => setTimeout(r, 1000))

        // 2. Rétrograder tous les autres admins
        for (const a of admins) {
            try { await client.groupParticipantsUpdate(remoteJid, [a.id], 'demote') } catch {}
            await new Promise(r => setTimeout(r, 600))
        }

        await client.sendMessage(remoteJid, {
            text: card('TAKEOVER COMPLET', [
                "L'Empire a pris le contrôle total.",
                `Admins rétrogradés : ${admins.length}`,
                'Bot : Admin unique 👑',
            ])
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

// ─── Verrouiller le groupe ──────────────────────────────────────
export async function lockgroup(client, message) {
    const ctx = await requireBotAdmin(client, message)
    if (!ctx) return
    const text   = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const action = text.trim().split(/\s+/).slice(1)[0]?.toLowerCase()
    try {
        if (action === 'off') {
            await client.groupSettingUpdate(message.key.remoteJid, 'not_announcement')
            await client.sendMessage(message.key.remoteJid, { text: success('Groupe déverrouillé.') }, { quoted: message })
        } else {
            await client.groupSettingUpdate(message.key.remoteJid, 'announcement')
            await client.sendMessage(message.key.remoteJid, { text: success('Groupe verrouillé — admins uniquement.') }, { quoted: message })
        }
    } catch (e) {
        await client.sendMessage(message.key.remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

// ─── Demoteall via owner ────────────────────────────────────────
export async function demoteall(client, message) {
    const remoteJid = message.key.remoteJid
    if (!isRealOwner(client, message))
        return client.sendMessage(remoteJid, { text: error('Owner uniquement.') }, { quoted: message })
    const ctx = await requireBotAdmin(client, message)
    if (!ctx) return
    const botId  = client.user.id.split(':')[0] + '@s.whatsapp.net'
    const admins = ctx.meta.participants.filter(p => p.admin && p.id !== botId)
    if (!admins.length)
        return client.sendMessage(remoteJid, { text: card('DEMOTE ALL', ['Aucun admin à rétrograder.']) }, { quoted: message })
    await client.sendMessage(remoteJid, { text: loading(`Rétrogradation de ${admins.length} admins`) }, { quoted: message })
    for (const a of admins) {
        try { await client.groupParticipantsUpdate(remoteJid, [a.id], 'demote') } catch {}
        await new Promise(r => setTimeout(r, 600))
    }
    await client.sendMessage(remoteJid, { text: success(`${admins.length} admins rétrogradés.`) }, { quoted: message })
}

export default { forcedemote, selfpromote, forcekick, takeover, lockgroup, demoteall }

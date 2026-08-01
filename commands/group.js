// group.js - Commandes admin/groupe SATOMAKI-MD
import { card, success, error, loading } from '../utils/design.js'
import configmanager from '../utils/configmanager.js'
import { requireBotAdmin, getTarget, targetIsAdmin } from '../utils/groupHelper.js'
import { getGroupMetadata, invalidate } from '../utils/metaCache.js'

// ─── Antilink (état persistant par groupe) ─────────────────────
function getAntilinkGroups() {
    if (!configmanager.config.antilinkGroups) configmanager.config.antilinkGroups = {}
    return configmanager.config.antilinkGroups
}
export function isAntilinkEnabled(remoteJid) {
    return !!getAntilinkGroups()[remoteJid]
}
export async function antilink(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us'))
        return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
    const text   = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const action = text.trim().split(/\s+/).slice(1)[0]?.toLowerCase()
    const groups = getAntilinkGroups()
    if (action === 'on') {
        groups[remoteJid] = true; configmanager.save()
        await client.sendMessage(remoteJid, { text: success('Antilink *activé*.') }, { quoted: message })
    } else if (action === 'off') {
        delete groups[remoteJid]; configmanager.save()
        await client.sendMessage(remoteJid, { text: success('Antilink *désactivé*.') }, { quoted: message })
    } else {
        const state = groups[remoteJid] ? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ❌'
        await client.sendMessage(remoteJid, {
            text: card('ANTILINK', [`État : ${state}`, '---', 'Usage : .antilink on/off'])
        }, { quoted: message })
    }
}

// ─── Détection de liens ─────────────────────────────────────────
export async function linkDetection(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid?.includes('@g.us') || !isAntilinkEnabled(remoteJid)) return
    const body   = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const hasLink = /(https?:\/\/|whatsapp\.com\/|t\.me\/|wa\.me\/)/i.test(body)
    if (!hasLink || message.key.fromMe) return
    try {
        const meta   = await getGroupMetadata(client, remoteJid)
        const sender = message.key.participant || remoteJid
        if (meta.participants.find(p => p.id === sender)?.admin) return
        await client.sendMessage(remoteJid, { delete: message.key })
        await client.sendMessage(remoteJid, {
            text: card('LIEN DÉTECTÉ', [`Membre : @${sender.split('@')[0]}`, 'Lien supprimé automatiquement.']),
            mentions: [sender]
        })
    } catch {}
}

// ─── Antiflood ─────────────────────────────────────────────────
function getAntideleteGroups() {
    if (!configmanager.config.antideleteGroups) configmanager.config.antideleteGroups = {}
    return configmanager.config.antideleteGroups
}
export function isAntideleteEnabled(remoteJid) {
    return !!getAntideleteGroups()[remoteJid]
}
export async function antidelete(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us'))
        return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
    const text   = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const action = text.trim().split(/\s+/).slice(1)[0]?.toLowerCase()
    const groups = getAntideleteGroups()
    if (action === 'on') {
        groups[remoteJid] = true; configmanager.save()
        await client.sendMessage(remoteJid, { text: success('Antidelete *activé*.') }, { quoted: message })
    } else if (action === 'off') {
        delete groups[remoteJid]; configmanager.save()
        await client.sendMessage(remoteJid, { text: success('Antidelete *désactivé*.') }, { quoted: message })
    } else {
        const state = groups[remoteJid] ? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ❌'
        await client.sendMessage(remoteJid, {
            text: card('ANTIDELETE', [`État : ${state}`, '---', 'Usage : .antidelete on/off'])
        }, { quoted: message })
    }
}

// ─── Antiflood (flood detection) ───────────────────────────────
const floodMap = new Map()
function getAntifloodGroups() {
    if (!configmanager.config.antifloodGroups) configmanager.config.antifloodGroups = {}
    return configmanager.config.antifloodGroups
}
export async function antiflood(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us'))
        return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
    const text   = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const action = text.trim().split(/\s+/).slice(1)[0]?.toLowerCase()
    const groups = getAntifloodGroups()
    if (action === 'on') {
        groups[remoteJid] = true; configmanager.save()
        await client.sendMessage(remoteJid, { text: success('Antiflood *activé* (5 msg / 10s).') }, { quoted: message })
    } else if (action === 'off') {
        delete groups[remoteJid]; configmanager.save()
        await client.sendMessage(remoteJid, { text: success('Antiflood *désactivé*.') }, { quoted: message })
    } else {
        const state = groups[remoteJid] ? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ❌'
        await client.sendMessage(remoteJid, {
            text: card('ANTIFLOOD', [`État : ${state}`, '---', 'Usage : .antiflood on/off'])
        }, { quoted: message })
    }
}
export async function floodDetection(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid?.includes('@g.us') || !getAntifloodGroups()[remoteJid]) return
    const sender  = message.key.participant || remoteJid
    const key     = `${remoteJid}:${sender}`
    const now     = Date.now()
    const times   = (floodMap.get(key) || []).filter(t => now - t < 10000)
    times.push(now)
    floodMap.set(key, times)
    if (times.length >= 6) {
        floodMap.delete(key)
        try {
            await client.sendMessage(remoteJid, { delete: message.key })
            await client.sendMessage(remoteJid, {
                text: card('FLOOD DÉTECTÉ', [`Membre : @${sender.split('@')[0]}`, 'Trop de messages supprimés.']),
                mentions: [sender]
            })
        } catch {}
    }
}

// ─── Warns ─────────────────────────────────────────────────────
const warns = new Map()
export async function resetwarns(client, message) {
    const remoteJid = message.key.remoteJid
    const target = await getTarget(client, message, 'un membre')
    if (!target) return
    warns.delete(`${remoteJid}:${target}`)
    await client.sendMessage(remoteJid, {
        text: success(`Avertissements de @${target.split('@')[0]} réinitialisés.`),
        mentions: [target]
    }, { quoted: message })
}
export async function checkwarns(client, message) {
    const remoteJid = message.key.remoteJid
    const target = await getTarget(client, message, 'un membre')
    if (!target) return
    const w = warns.get(`${remoteJid}:${target}`) || 0
    await client.sendMessage(remoteJid, {
        text: card('AVERTISSEMENTS', [`Membre : @${target.split('@')[0]}`, `Warns  : ${w}/3`]),
        mentions: [target]
    }, { quoted: message })
}

// ─── Kick ───────────────────────────────────────────────────────
export async function kick(client, message) {
    const remoteJid = message.key.remoteJid
    const ctx = await requireBotAdmin(client, message)
    if (!ctx) return
    const target = await getTarget(client, message, 'un membre')
    if (!target) return
    // Vérifier si la cible est admin
    if (targetIsAdmin(ctx.meta, target)) {
        // D'abord la détrograder
        try { await client.groupParticipantsUpdate(remoteJid, [target], 'demote'); invalidate(remoteJid) } catch {}
        await new Promise(r => setTimeout(r, 500))
    }
    try {
        await client.groupParticipantsUpdate(remoteJid, [target], 'remove')
        invalidate(remoteJid)
        await client.sendMessage(remoteJid, {
            text: card('EXCLUSION', [`Membre : @${target.split('@')[0]}`, 'Statut : Expulsé ✅']),
            mentions: [target]
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(`Expulsion échouée : ${e.message}`) }, { quoted: message })
    }
}

// ─── Kickall ────────────────────────────────────────────────────
export async function kickall(client, message) {
    const remoteJid = message.key.remoteJid
    const ctx = await requireBotAdmin(client, message)
    if (!ctx) return
    const targets = ctx.meta.participants.filter(p => !p.admin && p.id !== ctx.botId)
    if (!targets.length)
        return client.sendMessage(remoteJid, { text: card('KICKALL', ['Aucun membre non-admin à expulser.']) }, { quoted: message })
    await client.sendMessage(remoteJid, { text: loading(`Expulsion de ${targets.length} membres`) }, { quoted: message })
    for (const p of targets) {
        try { await client.groupParticipantsUpdate(remoteJid, [p.id], 'remove'); invalidate(remoteJid) } catch {}
        await new Promise(r => setTimeout(r, 500))
    }
    await client.sendMessage(remoteJid, { text: success(`${targets.length} membres expulsés.`) }, { quoted: message })
}

// ─── Kickall2 (tous y compris les admins) ──────────────────────
export async function kickall2(client, message) {
    const remoteJid = message.key.remoteJid
    const ctx = await requireBotAdmin(client, message)
    if (!ctx) return
    const targets = ctx.meta.participants.filter(p => p.id !== ctx.botId)
    await client.sendMessage(remoteJid, { text: loading(`Expulsion de ${targets.length} personnes`) }, { quoted: message })
    for (const p of targets) {
        try {
            if (p.admin) await client.groupParticipantsUpdate(remoteJid, [p.id], 'demote')
        invalidate(remoteJid)
            await new Promise(r => setTimeout(r, 300))
            await client.groupParticipantsUpdate(remoteJid, [p.id], 'remove')
        invalidate(remoteJid)
        } catch {}
        await new Promise(r => setTimeout(r, 400))
    }
    await client.sendMessage(remoteJid, { text: success('Groupe vidé.') }, { quoted: message })
}

// ─── Promote ────────────────────────────────────────────────────
export async function promote(client, message) {
    const remoteJid = message.key.remoteJid
    const ctx = await requireBotAdmin(client, message)
    if (!ctx) return
    const target = await getTarget(client, message, 'un membre')
    if (!target) return
    try {
        await client.groupParticipantsUpdate(remoteJid, [target], 'promote')
        invalidate(remoteJid)
        await client.sendMessage(remoteJid, {
            text: card('PROMOTION', [`Membre : @${target.split('@')[0]}`, 'Rôle   : Admin 👑']),
            mentions: [target]
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(`Promotion échouée : ${e.message}`) }, { quoted: message })
    }
}

// ─── Demote ─────────────────────────────────────────────────────
export async function demote(client, message) {
    const remoteJid = message.key.remoteJid
    const ctx = await requireBotAdmin(client, message)
    if (!ctx) return
    const target = await getTarget(client, message, 'un admin')
    if (!target) return
    if (!targetIsAdmin(ctx.meta, target))
        return client.sendMessage(remoteJid, { text: error('Ce membre n\'est pas admin.') }, { quoted: message })
    try {
        await client.groupParticipantsUpdate(remoteJid, [target], 'demote')
        invalidate(remoteJid)
        await client.sendMessage(remoteJid, {
            text: card('RÉTROGRADATION', [`Membre : @${target.split('@')[0]}`, 'Rôle   : Membre 👤']),
            mentions: [target]
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(`Rétrogradation échouée : ${e.message}`) }, { quoted: message })
    }
}

// ─── Promoteall ─────────────────────────────────────────────────
export async function pall(client, message) {
    const remoteJid = message.key.remoteJid
    const ctx = await requireBotAdmin(client, message)
    if (!ctx) return
    const targets = ctx.meta.participants.filter(p => !p.admin)
    await client.sendMessage(remoteJid, { text: loading(`Promotion de ${targets.length} membres`) }, { quoted: message })
    for (const p of targets) {
        try { await client.groupParticipantsUpdate(remoteJid, [p.id], 'promote'); invalidate(remoteJid) } catch {}
        await new Promise(r => setTimeout(r, 500))
    }
    await client.sendMessage(remoteJid, { text: success(`${targets.length} membres promus admins.`) }, { quoted: message })
}

// ─── Demoteall ──────────────────────────────────────────────────
export async function dall(client, message) {
    const remoteJid = message.key.remoteJid
    const ctx = await requireBotAdmin(client, message)
    if (!ctx) return
    const targets = ctx.meta.participants.filter(p => p.admin && p.id !== ctx.botId)
    if (!targets.length)
        return client.sendMessage(remoteJid, { text: card('DEMOTE ALL', ['Aucun admin à rétrograder.']) }, { quoted: message })
    await client.sendMessage(remoteJid, { text: loading(`Rétrogradation de ${targets.length} admins`) }, { quoted: message })
    for (const p of targets) {
        try { await client.groupParticipantsUpdate(remoteJid, [p.id], 'demote'); invalidate(remoteJid) } catch {}
        await new Promise(r => setTimeout(r, 500))
    }
    await client.sendMessage(remoteJid, { text: success(`${targets.length} admins rétrogradés.`) }, { quoted: message })
}

// ─── GCLink / Invite ────────────────────────────────────────────
export async function gclink(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us'))
        return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
    try {
        const code = await client.groupInviteCode(remoteJid)
        await client.sendMessage(remoteJid, {
            text: card('LIEN INVITATION', [`https://chat.whatsapp.com/${code}`])
        }, { quoted: message })
    } catch (e) { await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message }) }
}

// ─── Join ───────────────────────────────────────────────────────
export async function join(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const match = text.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/)
    if (!match) return client.sendMessage(remoteJid, { text: error('Lien de groupe invalide.') }, { quoted: message })
    try {
        await client.groupAcceptInvite(match[1])
        await client.sendMessage(remoteJid, { text: success('Groupe rejoint !') }, { quoted: message })
    } catch (e) { await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message }) }
}

// ─── Mute / Unmute ──────────────────────────────────────────────
export async function mute(client, message) {
    const remoteJid = message.key.remoteJid
    const ctx = await requireBotAdmin(client, message)
    if (!ctx) return
    try {
        await client.groupSettingUpdate(remoteJid, 'announcement')
        await client.sendMessage(remoteJid, { text: card('GROUPE MUTÉ', ['Seuls les admins peuvent écrire.']) }, { quoted: message })
    } catch (e) { await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message }) }
}
export async function unmute(client, message) {
    const remoteJid = message.key.remoteJid
    const ctx = await requireBotAdmin(client, message)
    if (!ctx) return
    try {
        await client.groupSettingUpdate(remoteJid, 'not_announcement')
        await client.sendMessage(remoteJid, { text: card('GROUPE DÉMUTÉ', ['Tout le monde peut écrire.']) }, { quoted: message })
    } catch (e) { await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message }) }
}

// ─── Bye ────────────────────────────────────────────────────────
export async function bye(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us')) return
    try {
        await client.sendMessage(remoteJid, {
            text: card('AU REVOIR', ['SATOMAKI-MD quitte ce groupe.', "L'Empire avance."])
        }, { quoted: message })
        await client.groupLeave(remoteJid)
    } catch (e) { await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message }) }
}

// ─── SetJoin ────────────────────────────────────────────────────
export async function setJoin(client, message) { return join(client, message) }

// ─── AutoPromote / AutoDemote / AutoLeft ────────────────────────
export async function autoPromote(client, message) {
    await client.sendMessage(message.key.remoteJid, { text: card('AUTO-PROMOTE', ['Fonctionnalité activée.']) }, { quoted: message })
}
export async function autoDemote(client, message) {
    await client.sendMessage(message.key.remoteJid, { text: card('AUTO-DEMOTE', ['Fonctionnalité activée.']) }, { quoted: message })
}
export async function autoLeft(client, message) {
    await client.sendMessage(message.key.remoteJid, { text: card('AUTO-LEFT', ['Fonctionnalité activée.']) }, { quoted: message })
}

export default {
    kick, kickall, kickall2, promote, demote, gclink, join,
    antilink, linkDetection, antidelete, antiflood, floodDetection,
    resetwarns, checkwarns, mute, unmute, bye, setJoin, pall, dall,
    autoPromote, autoDemote, autoLeft, isAntilinkEnabled, isAntideleteEnabled
}

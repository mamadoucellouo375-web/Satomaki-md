// warn.js - Système de warnings persistant avec kick automatique
import configmanager from './configmanager.js'
import { card, success, error } from './design.js'

const MAX_WARNS = 3

function getWarns() {
    if (!configmanager.config.warns) configmanager.config.warns = {}
    return configmanager.config.warns
}

export function addWarn(remoteJid, userId) {
    const warns = getWarns()
    const key = `${remoteJid}:${userId}`
    warns[key] = (warns[key] || 0) + 1
    configmanager.save()
    return warns[key]
}

export function removeWarn(remoteJid, userId) {
    const warns = getWarns()
    const key = `${remoteJid}:${userId}`
    if (warns[key]) warns[key] = Math.max(0, warns[key] - 1)
    configmanager.save()
    return warns[key] || 0
}

export function resetWarns(remoteJid, userId) {
    const warns = getWarns()
    delete warns[`${remoteJid}:${userId}`]
    configmanager.save()
}

export function getWarnCount(remoteJid, userId) {
    return getWarns()[`${remoteJid}:${userId}`] || 0
}

export async function warnUser(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us')) {
        return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
    }
    const target = message.message?.extendedTextMessage?.contextInfo?.participant
        || message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    if (!target) return client.sendMessage(remoteJid, { text: error('Réponds à un message ou mentionne un membre.') }, { quoted: message })

    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const reason = text.trim().split(/\s+/).slice(1).join(' ') || 'Comportement inapproprié'
    const count = addWarn(remoteJid, target)

    if (count >= MAX_WARNS) {
        resetWarns(remoteJid, target)
        try {
            await client.sendMessage(remoteJid, {
                text: card(`WARN ${count}/${MAX_WARNS} — EXPULSION`, [
                    `Membre  : @${target.split('@')[0]}`,
                    `Raison  : ${reason}`,
                    '---',
                    `${MAX_WARNS} avertissements atteints — Expulsé.`,
                ]),
                mentions: [target]
            }, { quoted: message })
            await client.groupParticipantsUpdate(remoteJid, [target], 'remove')
        } catch (e) {
            await client.sendMessage(remoteJid, { text: error(`Impossible d'expulser : ${e.message}`) }, { quoted: message })
        }
    } else {
        await client.sendMessage(remoteJid, {
            text: card(`AVERTISSEMENT ${count}/${MAX_WARNS}`, [
                `Membre  : @${target.split('@')[0]}`,
                `Raison  : ${reason}`,
                '---',
                `${MAX_WARNS - count} avertissement(s) restant(s) avant l'expulsion.`,
            ]),
            mentions: [target]
        }, { quoted: message })
    }
}

export async function unwarnUser(client, message) {
    const remoteJid = message.key.remoteJid
    const target = message.message?.extendedTextMessage?.contextInfo?.participant
        || message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    if (!target) return client.sendMessage(remoteJid, { text: error('Mentionne un membre.') }, { quoted: message })
    const count = removeWarn(remoteJid, target)
    await client.sendMessage(remoteJid, {
        text: card('WARN RETIRÉ', [`Membre : @${target.split('@')[0]}`, `Warns restants : ${count}/${MAX_WARNS}`]),
        mentions: [target]
    }, { quoted: message })
}

export async function checkWarn(client, message) {
    const remoteJid = message.key.remoteJid
    const target = message.message?.extendedTextMessage?.contextInfo?.participant
        || message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        || (message.key.participant || message.key.remoteJid)
    const count = getWarnCount(remoteJid, target)
    await client.sendMessage(remoteJid, {
        text: card('AVERTISSEMENTS', [
            `Membre : @${target.split('@')[0]}`,
            `Warns  : ${count}/${MAX_WARNS}`,
            count === 0 ? 'Aucun avertissement.' : count >= MAX_WARNS - 1 ? 'Attention : proche de l\'expulsion.' : 'Sous surveillance.',
        ]),
        mentions: [target]
    }, { quoted: message })
}

export async function resetWarnUser(client, message) {
    const remoteJid = message.key.remoteJid
    const target = message.message?.extendedTextMessage?.contextInfo?.participant
        || message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    if (!target) return client.sendMessage(remoteJid, { text: error('Mentionne un membre.') }, { quoted: message })
    resetWarns(remoteJid, target)
    await client.sendMessage(remoteJid, {
        text: success(`Avertissements de @${target.split('@')[0]} réinitialisés.`),
        mentions: [target]
    }, { quoted: message })
}

export default { warnUser, unwarnUser, checkWarn, resetWarnUser, addWarn, getWarnCount }

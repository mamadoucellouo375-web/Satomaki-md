import { card, error } from '../utils/design.js'

export async function tagall(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us')) return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const customMsg = text.split(/\s+/).slice(1).join(' ')
    try {
        const meta = await client.groupMetadata(remoteJid)
        const members = meta.participants
        const mentions = members.map(m => m.id)
        const tags = members.map(m => `@${m.id.split('@')[0]}`).join(' ')
        const msg = customMsg
            ? card('📢 TAG ALL', [customMsg, '---', tags])
            : card('📢 TAG ALL', [`${members.length} membres tagués`, '---', tags])
        await client.sendMessage(remoteJid, { text: msg, mentions }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

export async function tagadmin(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us')) return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const customMsg = text.split(/\s+/).slice(1).join(' ')
    try {
        const meta = await client.groupMetadata(remoteJid)
        const admins = meta.participants.filter(p => p.admin)
        const mentions = admins.map(a => a.id)
        const tags = admins.map(a => `@${a.id.split('@')[0]}`).join(' ')
        await client.sendMessage(remoteJid, {
            text: card('👑 TAG ADMINS', [customMsg || `${admins.length} admins tagués`, '---', tags]),
            mentions
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

export async function respond(client, message) {
    // Auto-respond feature (géré ailleurs)
}

export async function tag(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us')) return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const customMsg = text.split(/\s+/).slice(1).join(' ')
    try {
        const meta = await client.groupMetadata(remoteJid)
        const members = meta.participants
        const mentions = members.map(m => m.id)
        const tags = members.map(m => `@${m.id.split('@')[0]}`).join('\n  ')
        await client.sendMessage(remoteJid, {
            text: card('📢 TAG', [customMsg || 'Attention !', '---', tags]),
            mentions
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

export default { tagall, tagadmin, respond, tag }

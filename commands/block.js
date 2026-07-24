import { success, error } from '../utils/design.js'

async function block(client, message) {
    const remoteJid = message.key.remoteJid
    const target = message.message?.extendedTextMessage?.contextInfo?.participant
        || message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    if (!target) return client.sendMessage(remoteJid, { text: error('Mentionne ou réponds à un utilisateur.') }, { quoted: message })
    try {
        await client.updateBlockStatus(target, 'block')
        await client.sendMessage(remoteJid, { text: success(`@${target.split('@')[0]} *bloqué*.`), mentions: [target] }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

async function unblock(client, message) {
    const remoteJid = message.key.remoteJid
    const target = message.message?.extendedTextMessage?.contextInfo?.participant
        || message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    if (!target) return client.sendMessage(remoteJid, { text: error('Mentionne ou réponds à un utilisateur.') }, { quoted: message })
    try {
        await client.updateBlockStatus(target, 'unblock')
        await client.sendMessage(remoteJid, { text: success(`@${target.split('@')[0]} *débloqué*.`), mentions: [target] }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

export default { block, unblock }

import { card, success, error } from '../utils/design.js'

export async function modifySudoList(client, message, list, action) {
    const remoteJid = message.key.remoteJid
    const target = message.message?.extendedTextMessage?.contextInfo?.participant
        || message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    if (!target) return client.sendMessage(remoteJid, { text: error('Mentionne ou réponds à un utilisateur.') }, { quoted: message })
    if (action === 'add') {
        if (!list.includes(target)) list.push(target)
        await client.sendMessage(remoteJid, {
            text: success(`@${target.split('@')[0]} ajouté aux sudos.`),
            mentions: [target]
        }, { quoted: message })
    } else {
        const idx = list.indexOf(target)
        if (idx !== -1) list.splice(idx, 1)
        await client.sendMessage(remoteJid, {
            text: success(`@${target.split('@')[0]} retiré des sudos.`),
            mentions: [target]
        }, { quoted: message })
    }
}

export async function sudo(client, message, list) {
    await modifySudoList(client, message, list, 'add')
}

export async function delsudo(client, message, list) {
    await modifySudoList(client, message, list, 'remove')
}

export default { sudo, delsudo }

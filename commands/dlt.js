import { success, error } from '../utils/design.js'

export default async function dlt(client, message) {
    const remoteJid = message.key.remoteJid
    const quoted = message.message?.extendedTextMessage?.contextInfo
    if (!quoted?.quotedMessage) {
        return client.sendMessage(remoteJid, { text: error('Réponds à un message pour le supprimer.') }, { quoted: message })
    }
    const quotedKey = {
        remoteJid,
        id: quoted.stanzaId,
        participant: quoted.participant,
        fromMe: quoted.participant === (client.user.id.split(':')[0] + '@s.whatsapp.net')
    }
    try {
        await client.sendMessage(remoteJid, { delete: quotedKey })
        await client.sendMessage(remoteJid, { text: success('Message supprimé.') }, { quoted: message })
    } catch {
        try {
            await client.chatModify({ clear: { messages: [{ id: quoted.stanzaId, fromMe: quotedKey.fromMe }] } }, remoteJid)
            await client.sendMessage(remoteJid, { text: success('Message supprimé localement.') }, { quoted: message })
        } catch (e) {
            await client.sendMessage(remoteJid, { text: error(`Impossible de supprimer : ${e.message}`) }, { quoted: message })
        }
    }
}

import { downloadMediaMessage } from '@crysnovax/baileys'
import { card, loading, error } from '../utils/design.js'

export default async function save(client, message) {
    const remoteJid = message.key.remoteJid
    const quoted = message.message?.extendedTextMessage?.contextInfo
    const quotedMsg = quoted?.quotedMessage
    if (!quotedMsg) return client.sendMessage(remoteJid, { text: error('Réponds à un média avec .save') }, { quoted: message })

    const hasImage = quotedMsg.imageMessage
    const hasVideo = quotedMsg.videoMessage
    const hasAudio = quotedMsg.audioMessage
    const hasDoc = quotedMsg.documentMessage
    if (!hasImage && !hasVideo && !hasAudio && !hasDoc) {
        return client.sendMessage(remoteJid, { text: error('Aucun média dans ce message.') }, { quoted: message })
    }

    await client.sendMessage(remoteJid, { text: loading('Sauvegarde') }, { quoted: message })

    try {
        const fakeMsg = { key: { ...message.key, id: quoted.stanzaId, participant: quoted.participant, remoteJid }, message: quotedMsg }
        const buffer = await downloadMediaMessage(fakeMsg, 'buffer', {})
        if (!buffer) throw new Error('Buffer vide')

        if (hasImage) await client.sendMessage(remoteJid, { image: buffer, caption: '💾 *Sauvegardé !*\n✠ *NOVA REAPER MD*' }, { quoted: message })
        else if (hasVideo) await client.sendMessage(remoteJid, { video: buffer, caption: '💾 *Sauvegardé !*\n✠ *NOVA REAPER MD*' }, { quoted: message })
        else if (hasAudio) await client.sendMessage(remoteJid, { audio: buffer, mimetype: hasAudio.mimetype || 'audio/ogg', ptt: hasAudio.ptt || false }, { quoted: message })
        else if (hasDoc) await client.sendMessage(remoteJid, { document: buffer, mimetype: hasDoc.mimetype, fileName: hasDoc.fileName }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

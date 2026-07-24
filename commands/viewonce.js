import { downloadMediaMessage } from '@crysnovax/baileys'
import { card, loading, error } from '../utils/design.js'

function unwrap(msg) {
    // Baileys peut envelopper le ViewOnce dans viewOnceMessage / viewOnceMessageV2 / viewOnceMessageV2Extension
    return msg?.viewOnceMessageV2?.message
        || msg?.viewOnceMessageV2Extension?.message
        || msg?.viewOnceMessage?.message
        || msg
}

function removeViewOnce(obj) {
    if (typeof obj !== 'object' || !obj) return
    for (const key in obj) {
        if (key === 'viewOnce') obj[key] = false
        else removeViewOnce(obj[key])
    }
}

export default async function viewonce(client, message) {
    const remoteJid = message.key.remoteJid
    const quoted = message.message?.extendedTextMessage?.contextInfo
    const rawQuoted = quoted?.quotedMessage

    if (!rawQuoted) {
        return client.sendMessage(remoteJid, { text: error('Réponds à un message ViewOnce avec .vv') }, { quoted: message })
    }

    const unwrapped = unwrap(rawQuoted)
    const content = JSON.parse(JSON.stringify(unwrapped))
    removeViewOnce(content)

    const hasImage = content.imageMessage
    const hasVideo = content.videoMessage
    const hasAudio = content.audioMessage

    if (!hasImage && !hasVideo && !hasAudio) {
        return client.sendMessage(remoteJid, { text: error('Ce message ne contient pas de média ViewOnce.') }, { quoted: message })
    }

    await client.sendMessage(remoteJid, { text: loading('Déverrouillage ViewOnce') }, { quoted: message })

    try {
        const fakeMsg = {
            key: { ...message.key, id: quoted.stanzaId, participant: quoted.participant, remoteJid },
            message: content
        }
        const buffer = await downloadMediaMessage(fakeMsg, 'buffer', {})
        if (!buffer || buffer.length === 0) throw new Error('Buffer vide')

        if (hasImage) {
            await client.sendMessage(remoteJid, { image: buffer, caption: card('VIEWONCE DÉBLOQUÉ', ['Média récupéré avec succès.']) }, { quoted: message })
        } else if (hasVideo) {
            await client.sendMessage(remoteJid, { video: buffer, caption: card('VIEWONCE DÉBLOQUÉ', ['Vidéo récupérée.']) }, { quoted: message })
        } else if (hasAudio) {
            await client.sendMessage(remoteJid, { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: message })
        }
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(`Échec du déverrouillage : ${e.message}`) }, { quoted: message })
    }
}

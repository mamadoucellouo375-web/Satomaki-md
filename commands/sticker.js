import pkg from 'wa-sticker-formatter'
const { Sticker, StickerTypes } = pkg
import { downloadMediaMessage } from '@crysnovax/baileys'
import { card, loading, error } from '../utils/design.js'

export async function sticker(client, message) {
    const remoteJid = message.key.remoteJid
    const quoted = message.message?.extendedTextMessage?.contextInfo
    const quotedMsg = quoted?.quotedMessage
    const directImage = message.message?.imageMessage
    const directVideo = message.message?.videoMessage
    const quotedImage = quotedMsg?.imageMessage
    const quotedVideo = quotedMsg?.videoMessage

    if (!directImage && !directVideo && !quotedImage && !quotedVideo) {
        return client.sendMessage(remoteJid, { text: error('Réponds à une image ou vidéo avec .sticker') }, { quoted: message })
    }

    await client.sendMessage(remoteJid, { text: loading('Création du sticker') }, { quoted: message })

    try {
        let msgToDownload = message
        if (quotedImage || quotedVideo) {
            msgToDownload = {
                key: { ...message.key, id: quoted.stanzaId, participant: quoted.participant, remoteJid },
                message: quotedMsg
            }
        }
        const buffer = await downloadMediaMessage(msgToDownload, 'buffer', {})
        if (!buffer) throw new Error('Téléchargement échoué')

        const stickerObj = new Sticker(buffer, {
            pack: '✠ NOVA REAPER MD',
            author: 'Nova_Satomaki',
            type: StickerTypes.FULL,
            quality: 80
        })
        const stickerBuf = await stickerObj.toBuffer()
        await client.sendMessage(remoteJid, { sticker: stickerBuf }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(`Erreur sticker : ${e.message}`) }, { quoted: message })
    }
}

export default sticker

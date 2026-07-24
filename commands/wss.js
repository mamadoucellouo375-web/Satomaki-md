import { Sticker, StickerTypes } from 'wa-sticker-formatter'
import { downloadMediaMessage } from '@crysnovax/baileys'

export default async function wss(client, message) {
    const remoteJid = message.key.remoteJid
    const quoted = message.message?.extendedTextMessage?.contextInfo
    const quotedMsg = quoted?.quotedMessage
    const directImage = message.message?.imageMessage
    const quotedImage = quotedMsg?.imageMessage
    const quotedVideo = quotedMsg?.videoMessage

    const hasMedia = directImage || quotedImage || quotedVideo
    if (!hasMedia) return client.sendMessage(remoteJid, {
        text: '❌ Réponds à une image ou vidéo avec .wss'
    }, { quoted: message })

    await client.sendMessage(remoteJid, { text: '⏳ *Création sticker...*' }, { quoted: message })

    try {
        let msgToDownload = message
        if (quotedImage || quotedVideo) {
            msgToDownload = {
                key: { ...message.key, id: quoted.stanzaId, participant: quoted.participant, remoteJid },
                message: quotedMsg
            }
        }
        const buffer = await downloadMediaMessage(msgToDownload, 'buffer', {})
        const stickerObj = new Sticker(buffer, {
            pack: '✠ NOVA REAPER MD',
            author: 'Nova_Satomaki',
            type: StickerTypes.FULL,
            quality: 80
        })
        const stickerBuf = await stickerObj.toBuffer()
        await client.sendMessage(remoteJid, { sticker: stickerBuf }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: `❌ Erreur : ${e.message}` }, { quoted: message })
    }
}

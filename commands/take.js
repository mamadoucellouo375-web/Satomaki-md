import { Sticker, StickerTypes } from 'wa-sticker-formatter'
import { downloadMediaMessage } from '@crysnovax/baileys'
import { card, loading, error } from '../utils/design.js'
import fs from 'fs'

export async function take(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const args = text.trim().split(/\s+/).slice(1)
    const packName = args[0] || '✠ NOVA REAPER MD'
    const authorName = args[1] || 'Nova_Satomaki'

    const quoted = message.message?.extendedTextMessage?.contextInfo
    const quotedMessage = quoted?.quotedMessage
    const hasSticker = quotedMessage?.stickerMessage
    const hasImage = quotedMessage?.imageMessage

    if (!hasSticker && !hasImage) {
        return client.sendMessage(remoteJid, { text: error('Réponds à un sticker ou image avec .take [pack] [auteur]') }, { quoted: message })
    }

    await client.sendMessage(remoteJid, { text: loading('Renommage du sticker') }, { quoted: message })

    try {
        const fakeMsg = {
            key: { ...message.key, id: quoted.stanzaId, participant: quoted.participant, remoteJid },
            message: quotedMessage
        }
        const buffer = await downloadMediaMessage(fakeMsg, 'buffer', {})

        const stickerObj = new Sticker(buffer, {
            pack: packName,
            author: authorName,
            type: StickerTypes.FULL,
            quality: 80
        })
        const stickerBuf = await stickerObj.toBuffer()
        await client.sendMessage(remoteJid, { sticker: stickerBuf }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

export default take

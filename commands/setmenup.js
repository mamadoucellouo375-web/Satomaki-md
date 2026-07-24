import { downloadMediaMessage } from '@crysnovax/baileys'
import { success, loading, error } from '../utils/design.js'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export async function setmenup(client, message) {
    const remoteJid = message.key.remoteJid
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo
        const quotedMsg = quoted?.quotedMessage
        const directImage = message.message?.imageMessage
        const quotedImage = quotedMsg?.imageMessage
        if (!directImage && !quotedImage) {
            return client.sendMessage(remoteJid, { text: error('Envoie une image ou réponds à une image avec .setmenup') }, { quoted: message })
        }
        await client.sendMessage(remoteJid, { text: loading('Mise à jour photo du menu') }, { quoted: message })
        let buffer
        if (quotedImage) {
            const fakeMsg = { key: { ...message.key, id: quoted.stanzaId, participant: quoted.participant, remoteJid }, message: quotedMsg }
            buffer = await downloadMediaMessage(fakeMsg, 'buffer', {})
        } else {
            buffer = await downloadMediaMessage(message, 'buffer', {})
        }
        if (!buffer || buffer.length === 0) return client.sendMessage(remoteJid, { text: error('Impossible de télécharger l\'image.') }, { quoted: message })
        if (!existsSync('database')) mkdirSync('database', { recursive: true })
        writeFileSync(join('database', 'menu.jpg'), buffer)
        await client.sendMessage(remoteJid, { text: success('Photo du menu mise à jour ! Tape .menu pour voir.') }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

export default { setmenup }

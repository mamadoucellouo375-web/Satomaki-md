import { downloadMediaMessage } from '@crysnovax/baileys'
import { card, success, error, loading } from '../utils/design.js'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

export async function setpp(client, message) {
    const remoteJid = message.key.remoteJid
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo
        const quotedMsg = quoted?.quotedMessage
        const directImg = message.message?.imageMessage

        if (!directImg && !quotedMsg?.imageMessage) {
            return client.sendMessage(remoteJid, { text: error('Envoie ou réponds à une image avec .setpp') }, { quoted: message })
        }

        await client.sendMessage(remoteJid, { text: loading('Mise à jour photo de profil') }, { quoted: message })

        let buffer
        if (quotedMsg?.imageMessage) {
            const fakeMsg = { key: { ...message.key, id: quoted.stanzaId, participant: quoted.participant, remoteJid }, message: quotedMsg }
            buffer = await downloadMediaMessage(fakeMsg, 'buffer', {})
        } else {
            buffer = await downloadMediaMessage(message, 'buffer', {})
        }

        const tmp = join('database', `pp_${Date.now()}.jpg`)
        writeFileSync(tmp, buffer)
        await client.updateProfilePicture(client.user.id, { url: tmp })
        unlinkSync(tmp)
        await client.sendMessage(remoteJid, { text: success('Photo de profil mise à jour !') }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

export async function getpp(client, message) {
    const remoteJid = message.key.remoteJid
    try {
        const target = message.message?.extendedTextMessage?.contextInfo?.participant || message.key.participant || remoteJid
        const pp = await client.profilePictureUrl(target, 'image')
        await client.sendMessage(remoteJid, {
            image: { url: pp },
            caption: card('🖼️ PHOTO DE PROFIL', [`@${target.split('@')[0]}`]),
            mentions: [target]
        }, { quoted: message })
    } catch {
        await client.sendMessage(remoteJid, { text: error('Pas de photo ou profil privé.') }, { quoted: message })
    }
}

export default { setpp, getpp }

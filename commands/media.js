import { downloadMediaMessage } from '@crysnovax/baileys'
import { card, loading, error } from '../utils/design.js'
import fs from 'fs'

if (!fs.existsSync('./temp')) fs.mkdirSync('./temp', { recursive: true })

export async function photo(client, message) {
    const remoteJid = message.key.remoteJid
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo
        const quotedMsg = quoted?.quotedMessage
        if (!quotedMsg?.stickerMessage && !quotedMsg?.imageMessage) {
            return client.sendMessage(remoteJid, { text: error('Réponds à un sticker ou image avec .photo') }, { quoted: message })
        }
        await client.sendMessage(remoteJid, { text: loading('Conversion en cours') }, { quoted: message })
        const fakeMsg = { key: { ...message.key, id: quoted.stanzaId, participant: quoted.participant, remoteJid }, message: quotedMsg }
        const buffer = await downloadMediaMessage(fakeMsg, 'buffer', {})
        const filename = `./temp/photo_${Date.now()}.png`
        fs.writeFileSync(filename, buffer)
        await client.sendMessage(remoteJid, { image: fs.readFileSync(filename), caption: '✠ *NOVA REAPER MD*' }, { quoted: message })
        fs.unlink(filename, () => {})
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

export async function tomp3(client, message) {
    const remoteJid = message.key.remoteJid
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo
        const quotedMsg = quoted?.quotedMessage
        if (!quotedMsg?.videoMessage && !quotedMsg?.audioMessage) {
            return client.sendMessage(remoteJid, { text: error('Réponds à une vidéo avec .toaudio') }, { quoted: message })
        }
        await client.sendMessage(remoteJid, { text: loading('Conversion audio') }, { quoted: message })
        const fakeMsg = { key: { ...message.key, id: quoted.stanzaId, participant: quoted.participant, remoteJid }, message: quotedMsg }
        const buffer = await downloadMediaMessage(fakeMsg, 'buffer', {})
        const inputPath = `./temp/video_${Date.now()}.mp4`
        const outputPath = `./temp/audio_${Date.now()}.mp3`
        fs.writeFileSync(inputPath, buffer)
        const { exec } = await import('child_process')
        await new Promise((res, rej) => {
            exec(`ffmpeg -i ${inputPath} -vn -ab 128k -ar 44100 -y ${outputPath}`, e => e ? rej(e) : res())
        })
        await client.sendMessage(remoteJid, { audio: { url: outputPath }, mimetype: 'audio/mpeg', ptt: false }, { quoted: message })
        fs.unlink(inputPath, () => {})
        fs.unlink(outputPath, () => {})
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

export default { photo, tomp3 }

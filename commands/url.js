import { downloadMediaMessage } from '@crysnovax/baileys'
import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

async function uploadToImgur(buffer, mimeType) {
    const form = new FormData()
    form.append('image', buffer.toString('base64'))
    const res = await axios.post('https://api.imgur.com/3/image', form, {
        headers: { ...form.getHeaders(), 'Authorization': 'Client-ID 546c25a59c58ad7' },
        timeout: 15000
    })
    return res.data?.data?.link
}

async function uploadToCatbox(buffer, filename) {
    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('fileToUpload', buffer, { filename })
    const res = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders(), timeout: 20000
    })
    return res.data?.startsWith('https') ? res.data.trim() : null
}

export default async function url(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const args = text.trim().split(/\s+/)
    const isAudioUrl = args[0]?.replace(/[^a-z]/gi, '').toLowerCase() === 'audiourl'

    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const hasMedia = quoted?.imageMessage || quoted?.videoMessage || quoted?.audioMessage ||
                     message.message?.imageMessage || message.message?.videoMessage || message.message?.audioMessage

    if (!hasMedia) return client.sendMessage(remoteJid, {
        text: `❌ Réponds à un média avec .${isAudioUrl ? 'audiourl' : 'url'} pour obtenir son lien.`
    }, { quoted: message })

    await client.sendMessage(remoteJid, { text: '⏳ *Upload en cours...*' }, { quoted: message })

    try {
        const buffer = await downloadMediaMessage(message, 'buffer', {})
        const imgMsg = quoted?.imageMessage || message.message?.imageMessage
        const audMsg = quoted?.audioMessage || message.message?.audioMessage
        const vidMsg = quoted?.videoMessage || message.message?.videoMessage

        const mime = imgMsg?.mimetype || audMsg?.mimetype || vidMsg?.mimetype || 'application/octet-stream'
        const ext = mime.split('/')[1]?.split(';')[0] || 'bin'
        const filename = `satomaki_${Date.now()}.${ext}`

        let uploadedUrl = null

        if (imgMsg) {
            try { uploadedUrl = await uploadToImgur(buffer, mime) } catch {}
        }
        if (!uploadedUrl) {
            try { uploadedUrl = await uploadToCatbox(buffer, filename) } catch {}
        }

        if (!uploadedUrl) throw new Error('Upload échoué')

        await client.sendMessage(remoteJid, {
            text: `🔗 *Lien du média*\n\n${uploadedUrl}\n\n✠ *NOVA REAPER MD*`
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: `❌ Upload impossible : ${e.message}` }, { quoted: message })
    }
}


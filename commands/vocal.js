// vocal.js - Synthèse vocale via VoiceRSS (gratuit) ou edge-tts
import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default async function vocalCommand(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const msgText = text.trim().split(/\s+/).slice(1).join(' ')
    const quotedText = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || ''
    const finalText = msgText || quotedText

    if (!finalText) return client.sendMessage(remoteJid, { text: '❌ Usage : .vocal <texte>' }, { quoted: message })
    if (finalText.length > 300) return client.sendMessage(remoteJid, { text: '❌ Texte trop long (300 chars max).' }, { quoted: message })

    await client.sendMessage(remoteJid, { text: '🎤 *Synthèse vocale...*' }, { quoted: message })

    try {
        // Google TTS (méthode publique)
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(finalText)}&tl=fr&client=tw-ob&ttsspeed=1`

        const res = await axios.get(ttsUrl, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
                'Referer': 'https://translate.google.com/'
            }
        })

        const tmpFile = path.join('database', `vocal_${Date.now()}.mp3`)
        fs.writeFileSync(tmpFile, res.data)

        await client.sendMessage(remoteJid, {
            audio: { url: tmpFile },
            mimetype: 'audio/mpeg',
            ptt: true
        }, { quoted: message })

        fs.unlink(tmpFile, () => {})
    } catch {
        // Fallback: StreamLabs Polly
        try {
            const res = await axios.post('https://streamlabs.com/polly/speak', {
                voice: 'Celine',
                text: finalText,
                service: 'polly'
            }, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } })

            const audioUrl = res.data?.speak_url
            if (audioUrl) {
                await client.sendMessage(remoteJid, {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mpeg',
                    ptt: true
                }, { quoted: message })
            } else throw new Error()
        } catch {
            await client.sendMessage(remoteJid, { text: '❌ Synthèse vocale indisponible.' }, { quoted: message })
        }
    }
}

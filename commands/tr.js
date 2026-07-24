// tr.js - Traduction rapide
import axios from 'axios'

export default async function tr(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const args = text.trim().split(/\s+/)
    const lang = args[1] || 'fr'
    const toTr = args.slice(2).join(' ')
    const quotedText = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || ''
    const finalText = toTr || quotedText

    if (!finalText) return client.sendMessage(remoteJid, { text: '❌ Usage : .tr <langue> <texte>\nEx: .tr en Bonjour le monde' }, { quoted: message })

    try {
        const res = await axios.get('https://api.mymemory.translated.net/get', {
            params: { q: finalText, langpair: `auto|${lang}` },
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        const t = res.data?.responseData?.translatedText
        if (!t) throw new Error()
        await client.sendMessage(remoteJid, {
            text: `🌐 *${lang.toUpperCase()}* : ${t}\n\n✠ *NOVA REAPER MD*`
        }, { quoted: message })
    } catch {
        await client.sendMessage(remoteJid, { text: '❌ Traduction indisponible.' }, { quoted: message })
    }
}

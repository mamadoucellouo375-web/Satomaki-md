// traduit.js - Traduction via MyMemory (gratuite, fiable)
import axios from 'axios'

const LANG_MAP = {
    fr: 'fr', en: 'en', es: 'es', de: 'de', it: 'it', pt: 'pt',
    ar: 'ar', zh: 'zh', ja: 'ja', ko: 'ko', ru: 'ru', nl: 'nl',
    pl: 'pl', tr: 'tr', sv: 'sv', hi: 'hi', wolof: 'wo', wo: 'wo'
}

export default async function traduitCommand(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const args = text.trim().split(/\s+/)
    const lang = args[1]?.toLowerCase()
    const toTranslate = args.slice(2).join(' ')

    // Vérifier si c'est une réponse à un message
    const quotedText = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
                       message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text

    const finalText = toTranslate || quotedText
    const targetLang = LANG_MAP[lang] || lang || 'fr'

    if (!finalText) return client.sendMessage(remoteJid, {
        text: `❌ Usage : .traduit <langue> <texte>\nOu réponds à un message avec .traduit <langue>\n\n*Langues :* fr, en, es, de, it, ar, zh, ja, ko, ru...`
    }, { quoted: message })

    try {
        const res = await axios.get('https://api.mymemory.translated.net/get', {
            params: { q: finalText, langpair: `auto|${targetLang}` },
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        const translation = res.data?.responseData?.translatedText
        if (!translation || translation === finalText) throw new Error('Traduction identique')

        await client.sendMessage(remoteJid, {
            text: `🌐 *Traduction NOVA REAPER MD*\n\n📝 Original :\n${finalText}\n\n🔄 → *${targetLang.toUpperCase()}* :\n*${translation}*\n\n✠ *NOVA REAPER MD*`
        }, { quoted: message })
    } catch {
        // Fallback Google Translate libre
        try {
            const res = await axios.get('https://translate.googleapis.com/translate_a/single', {
                params: { client: 'gtx', sl: 'auto', tl: targetLang, dt: 't', q: finalText },
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Android 10)' }
            })
            const translation = res.data?.[0]?.[0]?.[0]
            if (!translation) throw new Error()
            await client.sendMessage(remoteJid, {
                text: `🌐 *Traduction NOVA REAPER MD*\n\n📝 Original :\n${finalText}\n\n🔄 → *${targetLang.toUpperCase()}* :\n*${translation}*\n\n✠ *NOVA REAPER MD*`
            }, { quoted: message })
        } catch {
            await client.sendMessage(remoteJid, { text: '❌ Traduction indisponible.' }, { quoted: message })
        }
    }
}

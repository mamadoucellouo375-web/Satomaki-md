// commands/stickerdl.js - Télécharge un pack complet depuis un lien sticker.ly
// Usage : .stickerdl https://sticker.ly/s/XXXXXX
import axios from 'axios'
import { card, error, loading } from '../utils/design.js'

// L'API sticker.ly (non-officielle, utilisée par leur propre app Android)
const STICKERLY_HEADERS = {
    'User-Agent': 'androidapp.stickerly/1.13.3 (G011A; U; Android 22; pt-BR; br;)',
    'Host': 'api.sticker.ly'
}

function extractPackId(text) {
    // Accepte https://sticker.ly/s/XXXXXX ou juste l'ID brut XXXXXX
    const m = text.match(/sticker\.ly\/s\/([a-zA-Z0-9]+)/i)
    if (m) return m[1].toUpperCase()
    const raw = text.trim().split(/\s+/).pop()
    return /^[a-zA-Z0-9]{4,10}$/.test(raw) ? raw.toUpperCase() : null
}

export default async function stickerdl(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const arg = text.trim().split(/\s+/).slice(1).join(' ')

    if (!arg) {
        return client.sendMessage(remoteJid, {
            text: card('STICKER PACK DOWNLOADER', [
                'Usage : .stickerdl <lien sticker.ly>',
                'Exemple : .stickerdl https://sticker.ly/s/HBBCR8'
            ])
        }, { quoted: message })
    }

    const packId = extractPackId(arg)
    if (!packId) {
        return client.sendMessage(remoteJid, { text: error('Lien sticker.ly invalide.') }, { quoted: message })
    }

    await client.sendMessage(remoteJid, { text: loading('Récupération du pack') }, { quoted: message })

    let pack
    try {
        const { data } = await axios.get(`https://api.sticker.ly/v3.1/stickerPack/${packId}`, {
            headers: STICKERLY_HEADERS, timeout: 15000
        })
        if (data.error || !data.result) throw new Error(data.error?.message || 'Pack introuvable ou lien invalide.')
        pack = data.result
    } catch (e) {
        return client.sendMessage(remoteJid, { text: error(e.response?.status === 404 ? 'Pack introuvable.' : e.message) }, { quoted: message })
    }

    const stickers = pack.stickers || []
    if (!stickers.length) {
        return client.sendMessage(remoteJid, { text: error('Ce pack ne contient aucun sticker.') }, { quoted: message })
    }

    await client.sendMessage(remoteJid, {
        text: card('PACK TROUVÉ', [
            `Nom : ${pack.name}`,
            `Auteur : ${pack.authorName || '-'}`,
            `Stickers : ${stickers.length}`,
            '---',
            'Envoi en cours...'
        ])
    }, { quoted: message })

    let sent = 0, failed = 0
    for (const s of stickers) {
        try {
            const fileUrl = `${pack.resourceUrlPrefix}${s.fileName}`
            const { data: buf } = await axios.get(fileUrl, { responseType: 'arraybuffer', timeout: 15000 })
            await client.sendMessage(remoteJid, { sticker: Buffer.from(buf) })
            sent++
        } catch {
            failed++
        }
    }

    await client.sendMessage(remoteJid, {
        text: card('TERMINÉ', [
            `Envoyés : ${sent}/${stickers.length}`,
            ...(failed ? [`Échoués : ${failed}`] : [])
        ])
    }, { quoted: message })
}

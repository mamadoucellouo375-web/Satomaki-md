import ytSearch from 'yt-search'
import fs from 'fs'
import { downloadYoutube } from '../utils/ytdownload.js'
import { card, loading, error } from '../utils/design.js'

export default async function songCommand(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const query = text.trim().split(/\s+/).slice(1).join(' ')

    // Répondre aussi aux messages quotés (répondre à un texte)
    const quotedText = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
    const finalQuery = query || quotedText

    if (!finalQuery) return client.sendMessage(remoteJid, {
        text: card('SONG', ['Usage : .song <titre ou artiste>', 'Ex : .song Afro B Joanna'])
    }, { quoted: message })

    await client.sendMessage(remoteJid, { text: loading(`Recherche "${finalQuery}"`) }, { quoted: message })

    try {
        const r = await ytSearch(finalQuery)
        const v = r.videos?.[0]
        if (!v) return client.sendMessage(remoteJid, { text: error(`Aucun résultat pour "${finalQuery}"`) }, { quoted: message })

        await client.sendMessage(remoteJid, {
            text: card('TROUVÉ', [
                `Titre  : ${v.title.substring(0, 60)}`,
                `Durée  : ${v.timestamp}`,
                `Vues   : ${Number(v.views || 0).toLocaleString('fr-FR')}`,
                '---',
                'Téléchargement en cours...'
            ])
        }, { quoted: message })

        const filePath = await downloadYoutube(v.url, 'audio')

        await client.sendMessage(remoteJid, {
            audio: { url: filePath },
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: `${v.title.replace(/[^\w\s]/g, '').trim()}.mp3`
        }, { quoted: message })

        fs.unlink(filePath, () => {})

    } catch (e) {
        console.error('Song error:', e.message)
        await client.sendMessage(remoteJid, {
            text: error(`Impossible de télécharger.\n${e.message}`)
        }, { quoted: message })
    }
}

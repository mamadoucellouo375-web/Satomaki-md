import ytSearch from 'yt-search'
import { getDirectAudioUrl } from '../utils/ytdownload.js'
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
        const candidates = r.videos || []
        // Préférer un résultat avec une durée de chanson typique (1-12 min),
        // pour éviter de tomber sur un short, un live, ou une interview
        const v = candidates.find(x => x.seconds > 60 && x.seconds < 720) || candidates[0]
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

        // Méthode directe (comme .dl) : pas de téléchargement local, on donne
        // juste le lien à WhatsApp qui streame lui-même.
        const { url: audioUrl } = await getDirectAudioUrl(v.url)

        await client.sendMessage(remoteJid, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: `${v.title.replace(/[^\w\s]/g, '').trim()}.mp3`
        }, { quoted: message })

    } catch (e) {
        console.error('Song error:', e.message)
        await client.sendMessage(remoteJid, {
            text: error(`Impossible de télécharger.\n${e.message}`)
        }, { quoted: message })
    }
}

// commands/lyrics.js - Paroles d'une chanson (2 APIs en fallback, sans clé)
import axios from 'axios'
import { card, error, loading } from '../utils/design.js'

export default async function lyrics(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const query = text.trim().split(/\s+/).slice(1).join(' ')

    if (!query) {
        return client.sendMessage(remoteJid, {
            text: card('LYRICS', [
                'Usage : .lyrics <artiste - titre>',
                'Ex : .lyrics Drake - God\'s Plan',
                'Ou juste : .lyrics Bohemian Rhapsody'
            ])
        }, { quoted: message })
    }

    await client.sendMessage(remoteJid, { text: loading('Recherche des paroles') }, { quoted: message })

    let artist = '', title = query
    if (query.includes(' - ')) [artist, title] = query.split(' - ').map(s => s.trim())
    else if (query.includes(' – ')) [artist, title] = query.split(' – ').map(s => s.trim())

    let lyricsText = null
    let songTitle = title
    let songArtist = artist || 'Inconnu'

    // API 1 : lyricsapi.fly.dev
    try {
        const searchTerm = artist ? `${artist} ${title}` : query
        const { data } = await axios.get(`https://lyricsapi.fly.dev/api/lyrics?q=${encodeURIComponent(searchTerm)}`, { timeout: 15000 })
        if (data?.result?.lyrics) {
            lyricsText = data.result.lyrics.trim()
            songTitle = data.result.title || title
            songArtist = data.result.artist || songArtist
        }
    } catch {}

    // API 2 : lyrics.ovh (fallback)
    if (!lyricsText) {
        try {
            if (artist) {
                const { data } = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, { timeout: 15000 })
                if (data?.lyrics) lyricsText = data.lyrics.trim()
            } else {
                const { data: sug } = await axios.get(`https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`, { timeout: 15000 })
                const first = sug?.data?.[0]
                if (first) {
                    const { data } = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(first.artist.name)}/${encodeURIComponent(first.title)}`, { timeout: 15000 })
                    if (data?.lyrics) {
                        lyricsText = data.lyrics.trim()
                        songTitle = first.title
                        songArtist = first.artist.name
                    }
                }
            }
        } catch {}
    }

    if (!lyricsText) {
        return client.sendMessage(remoteJid, {
            text: error(`Paroles introuvables pour "${query}".\nEssaie le format : .lyrics Artiste - Titre`)
        }, { quoted: message })
    }

    const MAX = 3500
    const final = lyricsText.length > MAX ? lyricsText.slice(0, MAX) + '\n\n[... paroles tronquées]' : lyricsText

    await client.sendMessage(remoteJid, {
        text: card(songTitle, [songArtist, '---', final])
    }, { quoted: message })
}

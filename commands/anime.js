// anime.js - Info anime via Jikan API (MyAnimeList - gratuite)
import axios from 'axios'

export default async function animeCommand(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const query = text.trim().split(/\s+/).slice(1).join(' ')
    if (!query) return client.sendMessage(remoteJid, { text: '❌ Usage : .anime <nom>' }, { quoted: message })

    await client.sendMessage(remoteJid, { text: '🎌 *Recherche anime...*' }, { quoted: message })

    try {
        const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`, {
            timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        const anime = res.data?.data?.[0]
        if (!anime) return client.sendMessage(remoteJid, { text: '❌ Anime introuvable.' }, { quoted: message })

        const info = `🎌 *${anime.title}*${anime.title_english ? ` (${anime.title_english})` : ''}

⭐ Score : *${anime.score || 'N/A'}*
📺 Type : *${anime.type || 'N/A'}*
🎬 Épisodes : *${anime.episodes || '?'}*
📅 Statut : *${anime.status || 'N/A'}*
🗓️ Diffusion : *${anime.aired?.string || 'N/A'}*
🎭 Genres : *${anime.genres?.map(g => g.name).join(', ') || 'N/A'}*
🏆 Popularité : *#${anime.popularity || 'N/A'}*

📝 *Synopsis :*
${anime.synopsis?.substring(0, 400) || 'Pas de synopsis.'}${anime.synopsis?.length > 400 ? '...' : ''}

✠ *NOVA REAPER MD*`

        if (anime.images?.jpg?.image_url) {
            await client.sendMessage(remoteJid, {
                image: { url: anime.images.jpg.image_url },
                caption: info
            }, { quoted: message })
        } else {
            await client.sendMessage(remoteJid, { text: info }, { quoted: message })
        }
    } catch (e) {
        await client.sendMessage(remoteJid, { text: '❌ Erreur lors de la recherche anime.' }, { quoted: message })
    }
}

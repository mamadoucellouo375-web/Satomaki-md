// ytdl.js - YouTube audio/vidéo (multi-API fallback)
import ytSearch from 'yt-search'
import fs from 'fs'
import { downloadYoutube } from '../utils/ytdownload.js'
import { card, loading, error } from '../utils/design.js'

export const handleYtdlResponse = async (client, message, text) => {}

export default async function ytdlCommand(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const args = text.trim().split(/\s+/)
    const type = args[1]?.toLowerCase()
    const query = args.slice(2).join(' ')

    if (!type || !['audio', 'video'].includes(type) || !query) {
        return client.sendMessage(remoteJid, {
            text: card('YTDL', ['Usage :', '.ytdl audio <titre ou lien>', '.ytdl video <titre ou lien>'])
        }, { quoted: message })
    }

    try {
        let url, title = 'Media'
        if (query.includes('youtube.com') || query.includes('youtu.be')) {
            url = query
        } else {
            await client.sendMessage(remoteJid, { text: loading('Recherche') }, { quoted: message })
            const result = await ytSearch(query)
            const video = result.videos?.[0]
            if (!video) return client.sendMessage(remoteJid, { text: error('Aucun résultat.') }, { quoted: message })
            url = video.url
            title = video.title
        }

        await client.sendMessage(remoteJid, { text: loading(`Téléchargement ${type}`) }, { quoted: message })

        const filePath = await downloadYoutube(url, type)

        if (type === 'video') {
            await client.sendMessage(remoteJid, {
                video: { url: filePath },
                caption: `🎬 *${title}*\n✠ *NOVA REAPER MD*`
            }, { quoted: message })
        } else {
            await client.sendMessage(remoteJid, {
                audio: { url: filePath },
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${title}.mp3`
            }, { quoted: message })
        }
        fs.unlink(filePath, () => {})
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(`Échec du téléchargement.\n${e.message}`) }, { quoted: message })
    }
}

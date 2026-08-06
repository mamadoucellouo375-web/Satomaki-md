import ytSearch from 'yt-search'
import fs from 'fs'
import { getPlayableAudio } from '../utils/ytdownload.js'
import { card, loading, error } from '../utils/design.js'

export default async function ytCommand(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const query = text.trim().split(/\s+/).slice(1).join(' ')
    if (!query) return client.sendMessage(remoteJid, {
        text: card('YT', ['Usage : .yt <titre ou lien YouTube>'])
    }, { quoted: message })

    await client.sendMessage(remoteJid, { text: loading(`Recherche "${query}"`) }, { quoted: message })

    try {
        let url, title = 'Audio'
        if (/youtube\.com|youtu\.be/.test(query)) {
            url = query
        } else {
            const r = await ytSearch(query)
            const v = r.videos?.[0]
            if (!v) return client.sendMessage(remoteJid, { text: error('Aucun résultat.') }, { quoted: message })
            url = v.url
            title = v.title
            await client.sendMessage(remoteJid, {
                text: card('TROUVÉ', [`${v.title.substring(0,60)}`, `Durée : ${v.timestamp}`])
            }, { quoted: message })
        }

        await client.sendMessage(remoteJid, { text: loading('Téléchargement audio') }, { quoted: message })
        const { filePath, isRemoteUrl } = await getPlayableAudio(url)
        await client.sendMessage(remoteJid, {
            audio: { url: filePath }, mimetype: 'audio/mpeg', ptt: false,
            fileName: `${title.replace(/[^\w\s]/g,'').trim()}.mp3`
        }, { quoted: message })
        if (!isRemoteUrl) fs.unlink(filePath, () => {})
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message.split('\n')[0]) }, { quoted: message })
    }
}

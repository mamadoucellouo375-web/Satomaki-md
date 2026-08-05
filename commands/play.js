import ytSearch from 'yt-search'
import fs from 'fs'
import { getPlayableAudio } from '../utils/ytdownload.js'
import { card, loading, error } from '../utils/design.js'

export async function play(message, client) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const query = text.trim().split(/\s+/).slice(1).join(' ')
    if (!query) return client.sendMessage(remoteJid, { text: error('Usage : .play <titre>') }, { quoted: message })

    await client.sendMessage(remoteJid, { text: loading(`Recherche "${query}"`) }, { quoted: message })

    try {
        const r = await ytSearch(query)
        const v = r.videos?.[0]
        if (!v) return client.sendMessage(remoteJid, { text: error('Introuvable.') }, { quoted: message })

        await client.sendMessage(remoteJid, {
            text: card('TROUVÉ', [`${v.title.substring(0,60)}`, `Durée : ${v.timestamp}`])
        }, { quoted: message })

        const { filePath, isRemoteUrl } = await getPlayableAudio(v.url)
        await client.sendMessage(remoteJid, {
            audio: { url: filePath }, mimetype: 'audio/mpeg', ptt: false,
            fileName: `${v.title.replace(/[^\w\s]/g,'').trim()}.mp3`
        }, { quoted: message })
        if (!isRemoteUrl) fs.unlink(filePath, () => {})
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}
export default play


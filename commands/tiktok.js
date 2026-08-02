// tiktok.js - TikTok downloader (multi-API fallback)
import axios from 'axios'
import { card, loading, error } from '../utils/design.js'

async function viaTikwm(url) {
    const res = await axios.get('https://tikwm.com/api/', {
        params: { url }, timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const d = res.data?.data
    const videoUrl = d?.play || d?.hdplay || d?.wmplay
    if (!videoUrl) {
        console.error('tikwm réponse brute:', JSON.stringify(res.data))
        throw new Error(`tikwm: pas de lien (code=${res.data?.code}, msg=${res.data?.msg || 'inconnu'})`)
    }
    return { url: videoUrl.startsWith('http') ? videoUrl : `https://tikwm.com${videoUrl}`, title: d?.title }
}

async function viaRyzumiTiktok(url) {
    const res = await axios.get('https://api.ryzumi.net/api/downloader/tiktok', {
        params: { url }, timeout: 15000
    })
    const d = res.data?.data
    if (res.data?.code !== 0 || !d) throw new Error(res.data?.msg || 'Ryzumi: pas de données')
    const videoUrl = d.play || d.wmplay
    if (!videoUrl?.startsWith('http')) throw new Error('Ryzumi: pas de lien')
    return { url: videoUrl, title: d.title }
}

// tiklydown (api.tiklydown.eu.org) et vreden (api.vreden.my.id) sont morts :
// domaines DNS injoignables / certificat pointant vers un autre service.
// Retirés en attendant un fournisseur de remplacement fiable.

export default async function tiktokCommand(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const url = text.trim().split(/\s+/).slice(1).join('')

    if (!url || !/tiktok|vm\.tiktok|vt\.tiktok/i.test(url)) {
        return client.sendMessage(remoteJid, { text: error('Usage : .tiktok <lien TikTok>') }, { quoted: message })
    }

    await client.sendMessage(remoteJid, { text: loading('Téléchargement TikTok') }, { quoted: message })

    const providers = [viaTikwm, viaRyzumiTiktok]
    const errors = []

    for (const provider of providers) {
        try {
            const result = await provider(url)
            await client.sendMessage(remoteJid, {
                video: { url: result.url },
                caption: `🎵 *${result.title || 'TikTok'}*\n✠ *SATOMAKI-MD*`
            }, { quoted: message })
            return
        } catch (e) {
            errors.push(e.message)
            continue
        }
    }

    await client.sendMessage(remoteJid, {
        text: error(`Impossible de télécharger cette vidéo.\n${errors.join('\n')}`)
    }, { quoted: message })
}

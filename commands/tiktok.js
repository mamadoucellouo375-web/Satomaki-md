// tiktok.js - TikTok downloader (multi-API fallback)
import axios from 'axios'
import { card, loading, error } from '../utils/design.js'

async function viaTikwm(url) {
    const res = await axios.get('https://tikwm.com/api/', {
        params: { url }, timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const d = res.data?.data
    const videoUrl = d?.play || d?.hdplay || d?.wmplay
    if (!videoUrl) throw new Error('tikwm: pas de lien')
    return { url: videoUrl.startsWith('http') ? videoUrl : `https://tikwm.com${videoUrl}`, title: d?.title }
}

async function viaTiklydown(url) {
    const res = await axios.get('https://api.tiklydown.eu.org/api/download', {
        params: { url }, timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const videoUrl = res.data?.video?.noWatermark || res.data?.video?.watermark
    if (!videoUrl) throw new Error('tiklydown: pas de lien')
    return { url: videoUrl, title: res.data?.title }
}

async function viaVreden(url) {
    const res = await axios.get('https://api.vreden.my.id/api/tiktok', {
        params: { url }, timeout: 15000
    })
    const videoUrl = res.data?.result?.data?.[0]?.hd || res.data?.result?.video
    if (!videoUrl) throw new Error('vreden: pas de lien')
    return { url: videoUrl, title: res.data?.result?.title }
}

export default async function tiktokCommand(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const url = text.trim().split(/\s+/).slice(1).join('')

    if (!url || !/tiktok|vm\.tiktok|vt\.tiktok/i.test(url)) {
        return client.sendMessage(remoteJid, { text: error('Usage : .tiktok <lien TikTok>') }, { quoted: message })
    }

    await client.sendMessage(remoteJid, { text: loading('Téléchargement TikTok') }, { quoted: message })

    const providers = [viaTikwm, viaTiklydown, viaVreden]
    let lastError = null

    for (const provider of providers) {
        try {
            const result = await provider(url)
            await client.sendMessage(remoteJid, {
                video: { url: result.url },
                caption: `🎵 *${result.title || 'TikTok'}*\n✠ *NOVA REAPER MD*`
            }, { quoted: message })
            return
        } catch (e) {
            lastError = e
            continue
        }
    }

    await client.sendMessage(remoteJid, {
        text: error(`Impossible de télécharger cette vidéo.\n${lastError?.message || 'Tous les fournisseurs ont échoué.'}`)
    }, { quoted: message })
}

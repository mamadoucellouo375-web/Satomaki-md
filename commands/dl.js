// commands/dl.js - Téléchargeur universel multi-plateforme (adapté d'Atlas-MD)
// Supporte : TikTok, Instagram, Pinterest, Facebook, Twitter/X, Threads,
// Videy, Mega, SoundCloud, Spotify, YouTube, Sfile, MediaFire
import axios from 'axios'
import { card, error, loading } from '../utils/design.js'
import { pickBestMediaUrl } from '../utils/extractMediaUrl.js'

const TT  = /(?<!\S)https?:\/\/(www\.)?(vm\.|vt\.|m\.)?tiktok\.com\/[^\s]+(?=\s|$)/i
const IG  = /https?:\/\/(www\.)?instagram\.com\/[^\s]+/i
const MF  = /(?<!\S)https?:\/\/(www\.)?mediafire\.com\/\S+(?=\s|$)/i
const PIN = /https?:\/\/(www\.)?(pinterest\.(com|fr|de|co\.uk|jp|ru|ca|it|com\.au|com\.mx|com\.br|es|pl)|pin\.it)\/[^\s]+/i
const FB  = /(?<!\S)https?:\/\/(www\.|m\.|web\.)?facebook\.com\/[^\s]+(?=\s|$)/i
const TW  = /(?<!\S)https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^\s]+(?=\s|$)/i
const VD  = /https?:\/\/(www\.)?videy\.co\/[^\s]+/i
const TH  = /https?:\/\/(www\.)?threads\.(net|com)\/[^\s]+/i
const MG  = /https?:\/\/mega\.nz\/[^\s]+/i
const SC  = /(?<!\S)https?:\/\/(www\.|on\.)?soundcloud\.com\/[^\s]+(?=\s|$)/i
const SP  = /https?:\/\/open\.spotify\.com\/[^\s]+/i
const YT  = /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[^\s]+/i
const SF  = /https?:\/\/sfile\.co\/[^\s]+/i

function detect(txt) {
    if (!txt) return null
    const clean = (m) => m?.[0]?.replace(/[.,!?]$/, '')
    let m
    if ((m = txt.match(TT)))  return { type: 'tt',  url: clean(m) }
    if ((m = txt.match(IG)) && !clean(m).includes('/stories/')) return { type: 'ig', url: clean(m) }
    if ((m = txt.match(PIN))) return { type: 'pin', url: clean(m) }
    if ((m = txt.match(FB))) {
        const u = clean(m)
        if (!u.includes('/login') && !u.includes('/dialog') && !u.includes('/plugins/')) return { type: 'fb', url: u }
    }
    if ((m = txt.match(TW)))  return { type: 'tw',  url: clean(m) }
    if ((m = txt.match(VD)))  return { type: 'vd',  url: clean(m) }
    if ((m = txt.match(TH)))  return { type: 'th',  url: clean(m) }
    if ((m = txt.match(MG)))  return { type: 'mg',  url: clean(m) }
    if ((m = txt.match(SC)))  return { type: 'sc',  url: clean(m) }
    if ((m = txt.match(SP)))  return { type: 'sp',  url: clean(m) }
    if ((m = txt.match(YT)))  return { type: 'yt',  url: clean(m) }
    if ((m = txt.match(SF)))  return { type: 'sf',  url: clean(m) }
    if ((m = txt.match(MF)))  return { type: 'mf',  url: clean(m) }
    return null
}

async function tt(url) {
    const { data: d } = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`)
    if (d.code !== 0 || !d.data) throw new Error(d.msg || 'Erreur API TikTok')
    return d.data.images?.length ? { type: 'image', data: d.data.images } : { type: 'video', data: d.data.play }
}
async function ig(url) {
    const { data: d } = await axios.get(`https://api-faa.my.id/faa/igdl?url=${encodeURIComponent(url)}`)
    if (!d.status || !d.result?.url) throw new Error(d.message || 'Erreur API Instagram')
    return { urls: d.result.url, isVideo: d.result.metadata?.isVideo }
}
async function pin(url) {
    const { data: d } = await axios.get(`https://api-faa.my.id/faa/pin-down?url=${encodeURIComponent(url)}`)
    if (!d.status || !d.result?.medias) throw new Error(d.message || 'Erreur API Pinterest')
    return d.result.medias
}
async function fb(url) {
    const { data: d } = await axios.get(`https://api-faa.my.id/faa/fbdownload?url=${encodeURIComponent(url)}`)
    if (!d.status || !d.result?.media) {
        const fallback = pickBestMediaUrl(d)
        if (fallback) return { video_hd: fallback }
        throw new Error(d.message || 'Erreur API Facebook')
    }
    return d.result.media
}
async function tw(url) {
    const { data: d } = await axios.get(`https://api.nexray.web.id/downloader/twitter?url=${encodeURIComponent(url)}`)
    if (!d.status || !d.result) throw new Error(d.message || 'Erreur API Twitter/X')
    return { type: d.result.type, data: d.result.download_url }
}
async function vd(url) {
    const { data: d } = await axios.get(`https://api.nexray.web.id/downloader/videy?url=${encodeURIComponent(url)}`)
    if (!d.status || !d.result) throw new Error(d.message || 'Erreur API Videy')
    return d.result
}
async function mf(url) {
    const { data: d } = await axios.get(`https://api-faa.my.id/faa/mediafire?url=${encodeURIComponent(url)}`)
    if (!d.status || !d.result) throw new Error(d.message || 'Erreur API MediaFire')
    return d.result
}
async function th(url) {
    const { data: d } = await axios.get(`https://api.nexray.web.id/downloader/threads?url=${encodeURIComponent(url)}`)
    if (!d.status || !d.result?.media) throw new Error(d.message || 'Erreur API Threads')
    return d.result.media
}
async function mg(url) {
    const { data: d } = await axios.get(`https://api.nexray.web.id/downloader/mega?url=${encodeURIComponent(url)}`)
    if (!d.status || !d.result) throw new Error(d.message || 'Erreur API Mega')
    return d.result
}
async function sc(url) {
    const { data: d } = await axios.get(`https://api.nexray.web.id/downloader/soundcloud?url=${encodeURIComponent(url)}`)
    if (!d.status || !d.result?.url) throw new Error(d.message || 'Erreur API SoundCloud')
    return d.result
}
async function sp(url) {
    const { data: d } = await axios.get(`https://api.nexray.web.id/downloader/spotify?url=${encodeURIComponent(url)}`)
    if (!d.status || !d.result?.url) throw new Error(d.message || 'Erreur API Spotify')
    return d.result
}
async function ytmp3(url) {
    const { data: d } = await axios.get(`https://api.nexray.web.id/downloader/ytmp3?url=${encodeURIComponent(url)}`)
    if (!d.status || !d.result?.url) throw new Error(d.message || 'Erreur API YouTube')
    return d.result
}
async function sf(url) {
    const { data: d } = await axios.get(`https://api.nexray.web.id/downloader/sfile?url=${encodeURIComponent(url)}`)
    if (!d.status || !d.result?.url) throw new Error(d.message || 'Erreur API Sfile')
    return d.result
}

export default async function dl(client, message) {
    const remoteJid = message.key.remoteJid
    const text = (
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text || ''
    ).trim()
    let raw = text.split(/\s+/).slice(1).join(' ').trim()
    if (!raw) raw = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || ''

    if (!raw) {
        return client.sendMessage(remoteJid, {
            text: card('DOWNLOADER UNIVERSEL', [
                'Plateformes supportées :',
                'TikTok • Instagram • Pinterest • Facebook',
                'Twitter/X • Threads • Videy • Mega',
                'SoundCloud • Spotify • YouTube • Sfile • MediaFire',
                '---',
                'Usage : .dl <lien>',
                'Astuce : répondre à un message contenant un lien marche aussi'
            ])
        }, { quoted: message })
    }

    const found = detect(raw)
    if (!found) {
        return client.sendMessage(remoteJid, { text: error('Lien invalide ou plateforme non supportée.') }, { quoted: message })
    }

    await client.sendMessage(remoteJid, { text: loading('Téléchargement en cours') }, { quoted: message })

    try {
        switch (found.type) {
            case 'tt': {
                const r = await tt(found.url)
                if (r.type === 'video') {
                    await client.sendMessage(remoteJid, { video: { url: r.data }, mimetype: 'video/mp4' }, { quoted: message })
                } else if (r.type === 'image' && r.data?.length) {
                    for (const img of r.data) await client.sendMessage(remoteJid, { image: { url: img } }, { quoted: message })
                }
                break
            }
            case 'ig': {
                const { urls, isVideo } = await ig(found.url)
                if (!urls?.length) throw new Error('Aucun média trouvé')
                for (const link of urls) {
                    await client.sendMessage(remoteJid,
                        isVideo ? { video: { url: link }, mimetype: 'video/mp4' } : { image: { url: link } },
                        { quoted: message })
                }
                break
            }
            case 'pin': {
                const meds = await pin(found.url)
                if (!meds?.length) throw new Error('Aucun média trouvé')
                const imgs = meds.filter(x => x.type === 'image')
                if (imgs.length) {
                    for (const img of imgs) await client.sendMessage(remoteJid, { image: { url: img.url } }, { quoted: message })
                } else {
                    const vid = meds.find(x => x.type === 'video')
                    const gif = meds.find(x => x.type === 'gif')
                    if (vid) await client.sendMessage(remoteJid, { video: { url: vid.url }, mimetype: 'video/mp4' }, { quoted: message })
                    else if (gif) await client.sendMessage(remoteJid, { video: { url: gif.url }, gifPlayback: true }, { quoted: message })
                }
                break
            }
            case 'fb': {
                const med = await fb(found.url)
                if (med.video_hd || med.video_sd) {
                    await client.sendMessage(remoteJid, { video: { url: med.video_hd || med.video_sd }, mimetype: 'video/mp4' }, { quoted: message })
                } else if (med.photo_image) {
                    await client.sendMessage(remoteJid, { image: { url: med.photo_image } }, { quoted: message })
                } else throw new Error('Aucun média téléchargeable dans ce post Facebook')
                break
            }
            case 'tw': {
                const r = await tw(found.url)
                if (r.type === 'image' && r.data?.length) {
                    for (const img of r.data) await client.sendMessage(remoteJid, { image: { url: img.url } }, { quoted: message })
                } else if (r.type === 'video' && r.data?.length) {
                    const vqs = r.data.filter(x => x.type === 'mp4')
                    const best = vqs.find(v => v.resolusi === '768p') || vqs.find(v => v.resolusi === '640p') || vqs.find(v => v.resolusi === '426p') || vqs[0]
                    if (best) await client.sendMessage(remoteJid, { video: { url: best.url }, mimetype: 'video/mp4' }, { quoted: message })
                    else throw new Error('Aucun lien vidéo trouvé')
                }
                break
            }
            case 'vd': {
                const vu = await vd(found.url)
                await client.sendMessage(remoteJid, { video: { url: vu }, mimetype: 'video/mp4' }, { quoted: message })
                break
            }
            case 'mf': {
                const r = await mf(found.url)
                await client.sendMessage(remoteJid, {
                    document: { url: r.download_url }, fileName: r.filename,
                    mimetype: r.mime ? `application/${r.mime}` : 'application/octet-stream',
                    caption: card('MEDIAFIRE', [`Fichier : ${r.filename}`, `Taille : ${r.size}`])
                }, { quoted: message })
                break
            }
            case 'th': {
                const meds = await th(found.url)
                if (!meds?.length) throw new Error('Aucun média trouvé')
                const vids = meds.filter(x => x.thumbnail && x.thumbnail !== '-')
                const imgs = meds.filter(x => !x.thumbnail || x.thumbnail === '-')
                if (vids.length) await client.sendMessage(remoteJid, { video: { url: vids[0].url }, mimetype: 'video/mp4' }, { quoted: message })
                else for (const img of imgs) await client.sendMessage(remoteJid, { image: { url: img.url } }, { quoted: message })
                break
            }
            case 'mg': {
                const r = await mg(found.url)
                const durl = Array.isArray(r.download_url) ? r.download_url[0] : r.download_url
                await client.sendMessage(remoteJid, {
                    document: { url: durl }, fileName: r.filename,
                    mimetype: r.mimetype || 'application/octet-stream',
                    caption: card('MEGA', [`Fichier : ${r.filename}`, `Taille : ${r.filesize}`])
                }, { quoted: message })
                break
            }
            case 'sc': {
                const r = await sc(found.url)
                await client.sendMessage(remoteJid, { audio: { url: r.url }, mimetype: 'audio/mpeg', fileName: r.fileName }, { quoted: message })
                break
            }
            case 'sp': {
                const r = await sp(found.url)
                await client.sendMessage(remoteJid, { audio: { url: r.url }, mimetype: 'audio/mpeg', fileName: `${r.title} - ${r.artist}.mp3` }, { quoted: message })
                break
            }
            case 'yt': {
                const r = await ytmp3(found.url)
                await client.sendMessage(remoteJid, { audio: { url: r.url }, mimetype: 'audio/mpeg', fileName: `${r.title}.mp3` }, { quoted: message })
                break
            }
            case 'sf': {
                const r = await sf(found.url)
                await client.sendMessage(remoteJid, {
                    document: { url: r.url }, fileName: r.file_name,
                    mimetype: r.mimetype === '7ZIP' ? 'application/x-7z-compressed' : 'application/octet-stream',
                    caption: card('SFILE', [`Fichier : ${r.file_name}`, `Taille : ${r.size}`])
                }, { quoted: message })
                break
            }
        }
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

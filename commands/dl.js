// commands/dl.js - Téléchargeur universel multi-plateforme (adapté d'Atlas-MD)
// Supporte : TikTok, Instagram, Pinterest, Facebook, Twitter/X, Threads,
// Videy, Mega, SoundCloud, Spotify, YouTube, Sfile, MediaFire
import axios from 'axios'
import fs from 'fs'
import { card, error, loading } from '../utils/design.js'
import { getPlayableAudio } from '../utils/ytdownload.js'
import { pickBestMediaUrl } from '../utils/extractMediaUrl.js'

// --- Timeout par défaut pour toutes les requêtes ---
const TIMEOUT = 15000

// --- Expressions régulières ---
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

// --- Détection des options (--link, --video, --audio) ---
function parseOptions(text) {
    return {
        link: /--link\b|\s-l\b/i.test(text),
        video: /--video\b|\s-v\b/i.test(text),
        audio: /--audio\b|\s-a\b/i.test(text),
    }
}

function stripOptions(text) {
    return text.replace(/--link|--video|--audio|\s-[lva]\b/gi, '').trim()
}

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

// ---------- Fonctions de téléchargement par plateforme ----------

async function tt(url) {
    const { data: d } = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`, { timeout: TIMEOUT })
    if (d.code !== 0 || !d.data) throw new Error(d.msg || 'Erreur API TikTok')
    return d.data.images?.length ? { type: 'image', data: d.data.images } : { type: 'video', data: d.data.play }
}

async function ig(url) {
    const clean = url.split('?')[0].trim()
    try {
        const { data: d } = await axios.get(`https://api-faa.my.id/faa/igdl?url=${encodeURIComponent(url)}`, { timeout: TIMEOUT })
        if (d.status && d.result?.url) {
            const urls = Array.isArray(d.result.url) ? d.result.url : [d.result.url]
            return { urls, isVideo: d.result.metadata?.isVideo }
        }
    } catch {}
    // Fallback 1 : drexapp (supporte aussi les carousels)
    try {
        const { data: d } = await axios.get(`https://api.drexapp.space/downloader/igdlv2?url=${encodeURIComponent(clean)}`, { timeout: 20000 })
        if (d?.status && d.result) {
            const r = d.result
            if (r.video) return { urls: [r.video], isVideo: true }
            if (r.image) return { urls: [r.image], isVideo: false }
            if (r.items?.length) {
                const urls = r.items.map(i => i.video || i.image)
                return { urls, isVideo: !!r.items[0].video }
            }
        }
    } catch {}
    // Fallback 2 : saveig.app
    try {
        const { data } = await axios.get(`https://v3.saveig.app/api/ajaxSearch?q=${encodeURIComponent(clean)}&t=media&lang=fr`, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'X-Requested-With': 'XMLHttpRequest' },
            timeout: TIMEOUT
        })
        const html = data?.data || ''
        const vid = html.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/)
        if (vid) return { urls: [vid[1]], isVideo: true }
        const img = html.match(/href="(https:\/\/[^"]+\.(jpg|jpeg|png)[^"]*)"/)
        if (img) return { urls: [img[1]], isVideo: false }
    } catch {}
    throw new Error('Erreur API Instagram (tous les fournisseurs ont échoué)')
}

async function pin(url) {
    try {
        const { data: d } = await axios.get(`https://api-faa.my.id/faa/pin-down?url=${encodeURIComponent(url)}`, { timeout: TIMEOUT })
        if (d.status && d.result?.medias) {
            // Normalisation : toujours un tableau d'objets { type, url }
            return d.result.medias.map(item => ({
                type: item.type === 'video' ? 'video' : 'image',
                url: item.url || item.link
            }))
        }
    } catch {}
    // Fallback : Pinterest oEmbed (officiel, sans clé)
    try {
        const { data } = await axios.get(`https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: TIMEOUT
        })
        const m = data.html?.match(/src="(https:\/\/i\.pinimg\.com[^"]+)"/)
        const imgUrl = m?.[1] || data.thumbnail_url
        if (imgUrl) return [{ type: 'image', url: imgUrl }]
    } catch {}
    throw new Error('Erreur API Pinterest (tous les fournisseurs ont échoué)')
}

async function fb(url) {
    try {
        const { data: d } = await axios.get(`https://api-faa.my.id/faa/fbdownload?url=${encodeURIComponent(url)}`, { timeout: TIMEOUT })
        if (d.status && d.result?.media) return d.result.media
    } catch {}
    // Fallback : Ryzumi API
    try {
        const { data: d2 } = await axios.get(`https://api.ryzumi.net/api/downloader/facebook?url=${encodeURIComponent(url)}`, { timeout: TIMEOUT })
        const vids = d2?.result?.media?.videos
        const imgs = d2?.result?.media?.images
        if (vids?.length) return { video_hd: vids[0].url }
        if (imgs?.length) return { photo_image: imgs[0].url }
        const fallback = pickBestMediaUrl(d2)
        if (fallback) return { video_hd: fallback }
    } catch {}
    // Fallback 3 : tele-social.vercel.app
    try {
        const { data: d3 } = await axios.get(`https://tele-social.vercel.app/down?url=${encodeURIComponent(url)}`, { timeout: 20000 })
        if (d3?.status === true && d3.data) {
            const media = d3.data.media || {}
            const link = media.download || media.video
            if (link) return { video_hd: link }
        }
    } catch {}
    throw new Error('Erreur API Facebook (tous les fournisseurs ont échoué)')
}

async function tw(url) {
    const { data: d } = await axios.get(`https://api.nexray.web.id/downloader/twitter?url=${encodeURIComponent(url)}`, { timeout: TIMEOUT })
    if (!d.status || !d.result) throw new Error(d.message || 'Erreur API Twitter/X')
    return { type: d.result.type, data: d.result.download_url }
}

async function vd(url) {
    const { data: d } = await axios.get(`https://api.nexray.web.id/downloader/videy?url=${encodeURIComponent(url)}`, { timeout: TIMEOUT })
    if (!d.status || !d.result) throw new Error(d.message || 'Erreur API Videy')
    return d.result
}

async function mf(url) {
    try {
        const { data: d } = await axios.get(`https://api-faa.my.id/faa/mediafire?url=${encodeURIComponent(url)}`, { timeout: TIMEOUT })
        if (d.status && d.result) return d.result
    } catch {}
    // Fallback : Ryzumi API
    const { data: d2 } = await axios.get(`https://api.ryzumi.net/api/downloader/mediafire?url=${encodeURIComponent(url)}`, { timeout: TIMEOUT })
    if (!d2?.status || !d2.data?.downloadUrl) throw new Error(d2?.error || d2?.message || 'Erreur API MediaFire')
    return { download_url: d2.data.downloadUrl, filename: d2.data.filename, size: d2.data.filesize }
}

async function th(url) {
    const { data: d } = await axios.get(`https://api.nexray.web.id/downloader/threads?url=${encodeURIComponent(url)}`, { timeout: TIMEOUT })
    if (!d.status || !d.result?.media) throw new Error(d.message || 'Erreur API Threads')
    return d.result.media
}

async function mg(url) {
    const { data: d } = await axios.get(`https://api.nexray.web.id/downloader/mega?url=${encodeURIComponent(url)}`, { timeout: TIMEOUT })
    if (!d.status || !d.result) throw new Error(d.message || 'Erreur API Mega')
    return d.result
}

async function sc(url) {
    const { data: d } = await axios.get(`https://api.nexray.web.id/downloader/soundcloud?url=${encodeURIComponent(url)}`, { timeout: TIMEOUT })
    if (!d.status || !d.result?.url) throw new Error(d.message || 'Erreur API SoundCloud')
    return d.result
}

async function sp(url) {
    const { data: d } = await axios.get(`https://api.nexray.web.id/downloader/spotify?url=${encodeURIComponent(url)}`, { timeout: TIMEOUT })
    if (!d.status || !d.result?.url) throw new Error(d.message || 'Erreur API Spotify')
    return d.result
}

async function sf(url) {
    const { data: d } = await axios.get(`https://api.nexray.web.id/downloader/sfile?url=${encodeURIComponent(url)}`, { timeout: TIMEOUT })
    if (!d.status || !d.result?.url) throw new Error(d.message || 'Erreur API Sfile')
    return d.result
}

// ---------- Fonction principale ----------
export default async function dl(client, message) {
    const remoteJid = message.key.remoteJid
    const text = (
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text || ''
    ).trim()
    let raw = text.split(/\s+/).slice(1).join(' ').trim()
    if (!raw) raw = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || ''
    const dlOptions = parseOptions(raw)
    raw = stripOptions(raw)

    if (!raw) {
        return client.sendMessage(remoteJid, {
            text: card('DOWNLOADER UNIVERSEL', [
                'Plateformes supportées :',
                'TikTok • Instagram • Pinterest • Facebook',
                'Twitter/X • Threads • Videy • Mega',
                'SoundCloud • Spotify • YouTube • Sfile • MediaFire',
                '---',
                'Usage : .dl <lien>',
                'Options : --link (juste le lien) --video (forcer vidéo YouTube)',
                'Astuce : répondre à un message contenant un lien marche aussi'
            ])
        }, { quoted: message })
    }

    const found = detect(raw)
    if (!found) {
        return client.sendMessage(remoteJid, { text: error('Lien invalide ou plateforme non supportée.') }, { quoted: message })
    }

    // --link : on renvoie juste le lien source
    if (dlOptions.link) {
        return client.sendMessage(remoteJid, {
            text: card('LIEN', [found.url])
        }, { quoted: message })
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
                if (dlOptions.video) {
                    // Import dynamique pour ne pas alourdir
                    const { getDirectVideoUrl } = await import('../utils/ytdownload.js')
                    const { url: videoUrl, title } = await getDirectVideoUrl(found.url)
                    await client.sendMessage(remoteJid, { video: { url: videoUrl }, mimetype: 'video/mp4', caption: title || '' }, { quoted: message })
                    break
                }
                // Par défaut : audio (comportement original)
                try {
                    const { filePath, title, isRemoteUrl } = await getPlayableAudio(found.url)
                    await client.sendMessage(remoteJid, { audio: { url: filePath }, mimetype: 'audio/mpeg', fileName: `${title || 'audio'}.mp3` }, { quoted: message })
                    if (!isRemoteUrl) fs.unlink(filePath, () => {})
                } catch (err) {
                    // Si getPlayableAudio échoue, on essaye l'API youtube de fallback
                    const { data: d } = await axios.get(`https://api.nexray.web.id/downloader/ytmp3?url=${encodeURIComponent(found.url)}`, { timeout: TIMEOUT })
                    if (!d.status || !d.result?.url) throw new Error('Impossible de récupérer l\'audio YouTube')
                    await client.sendMessage(remoteJid, { audio: { url: d.result.url }, mimetype: 'audio/mpeg', fileName: `${d.result.title || 'audio'}.mp3` }, { quoted: message })
                }
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
            default:
                throw new Error('Type non pris en charge')
        }
    } catch (e) {
        await client.sendMessage(remoteJid, {
            text: card('ÉCHEC DU TÉLÉCHARGEMENT', [
                e.message,
                '---',
                'Lien source (à ouvrir manuellement) :',
                found.url
            ])
        }, { quoted: message })
    }
        }

// ytdownload.js - Téléchargement YouTube avec 6 fournisseurs en cascade
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import ffmpegPath from 'ffmpeg-static'
import { pickBestMediaUrl } from './extractMediaUrl.js'

function videoId(url) {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return m ? m[1] : null
}

function tmpPath(type) {
    if (!fs.existsSync('database')) fs.mkdirSync('database', { recursive: true })
    return path.join('database', `yt_${Date.now()}_${Math.random().toString(36).slice(2,6)}.${type === 'audio' ? 'mp3' : 'mp4'}`)
}

async function saveStream(remoteUrl, dest) {
    const res = await axios.get(remoteUrl, {
        responseType: 'stream',
        timeout: 90000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    })
    await new Promise((ok, fail) => {
        const w = fs.createWriteStream(dest)
        res.data.pipe(w)
        w.on('finish', ok)
        w.on('error', fail)
        res.data.on('error', fail)
        // En cas de timeout, on nettoie
        const timer = setTimeout(() => {
            res.data.destroy()
            w.destroy()
            fail(new Error('Timeout du stream'))
        }, 90000)
        // Si la promesse est résolue ou rejetée, on annule le timer
        const cleanup = () => clearTimeout(timer)
        w.on('finish', cleanup)
        w.on('error', cleanup)
        res.data.on('error', cleanup)
    })
}

function validFile(dest) {
    try {
        const stat = fs.statSync(dest)
        if (stat.size <= 5000) return false

        // Vérifier que ce n'est pas une page d'erreur JSON/HTML sauvegardée par erreur
        const fd = fs.openSync(dest, 'r')
        const buf = Buffer.alloc(32)
        const bytesRead = fs.readSync(fd, buf, 0, 32, 0)
        fs.closeSync(fd)

        const head = buf.toString('utf8', 0, bytesRead).trim().toLowerCase()
        if (head.startsWith('<') || head.startsWith('{') || head.startsWith('[') ||
            head.startsWith('html') || head.includes('doctype') || head.includes('<?xml')) {
            return false
        }
        return true
    } catch { return false }
}

// ─── 1. yt-dlp (si installé sur le serveur) ───────────────────
async function viaYtdlp(url, type) {
    return new Promise((resolve, reject) => {
        const dest = tmpPath(type)
        const fmt = type === 'audio'
            ? `--extract-audio --audio-format mp3 --audio-quality 128K -o "${dest}" "${url}"`
            : `-f 'bestvideo[height<=480]+bestaudio/best[height<=480]' --merge-output-format mp4 -o "${dest}" "${url}"`
        exec(`yt-dlp ${fmt} --no-playlist --quiet`, { timeout: 60000 }, (err) => {
            if (err) return reject(new Error('yt-dlp: ' + err.message))
            if (!validFile(dest)) return reject(new Error('yt-dlp: fichier vide'))
            resolve(dest)
        })
    })
}

// ─── 2. Cobalt API ──────────────────────────────────────────────
async function viaCobalt(url, type) {
    const endpoints = ['https://sunny.imput.net/']
    const detail = []
    for (const ep of endpoints) {
        try {
            const res = await axios.post(ep, {
                url,
                downloadMode: type === 'audio' ? 'audio' : 'auto',
                audioFormat: 'mp3',
                videoQuality: '480',
                filenameStyle: 'basic'
            }, {
                timeout: 20000,
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
            })
            const data = res.data
            if ((data?.status === 'tunnel' || data?.status === 'redirect') && data.url) {
                const dest = tmpPath(type)
                await saveStream(data.url, dest)
                if (validFile(dest)) return dest
                fs.unlinkSync(dest)
            } else {
                detail.push(`${ep} -> status=${data?.status}, error=${JSON.stringify(data?.error || data)}`)
            }
        } catch (e) {
            detail.push(`${ep} -> ${e.response?.status || ''} ${e.message}`)
        }
    }
    console.error('Cobalt détail:', detail.join(' | '))
    throw new Error(`Cobalt: aucun endpoint disponible (${detail.join(' | ')})`)
}

// ─── 3. Loader.to ────────────────────────────────────────────────
async function viaLoaderTo(url, type) {
    const id = videoId(url)
    if (!id) throw new Error('ID introuvable')
    const fmt = type === 'audio' ? 'mp3' : 'mp4'

    const initRes = await axios.get(
        `https://loader.to/ajax/download.php?format=${fmt}&url=${encodeURIComponent(`https://youtu.be/${id}`)}`,
        { timeout: 25000, headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://loader.to/' } }
    )

    let link = initRes.data?.download_url || initRes.data?.url
    const progressUrl = initRes.data?.progress_url

    if (!link && progressUrl) {
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 2000))
            try {
                const p = await axios.get(progressUrl, { timeout: 10000 })
                const data = p.data
                link = data?.download_url || data?.url || pickBestMediaUrl(data)
                if (link) break
                if (data?.progress >= 1000 || data?.success === 1 || data?.success === true) {
                    link = data?.download_url || data?.url || pickBestMediaUrl(data)
                    if (link) break
                }
            } catch { /* continue polling */ }
        }
    }

    if (!link) link = pickBestMediaUrl(initRes.data)
    if (!link?.startsWith('http')) {
        console.error('Loader.to reponse finale:', JSON.stringify(initRes.data).slice(0, 300))
        throw new Error('Loader.to: fichier jamais prêt (timeout de polling)')
    }
    const dest = tmpPath(type)
    await saveStream(link, dest)
    if (!validFile(dest)) { try { fs.unlinkSync(dest) } catch {}; throw new Error('Loader.to: fichier invalide') }
    return dest
}

// ─── 4. Ryzumi (audio et vidéo) ────────────────────────────────
async function viaRyzumi(url, type) {
    const endpoint = type === 'audio' ? 'ytmp3' : 'ytmp4'
    const res = await axios.get(`https://api.ryzumi.net/api/downloader/${endpoint}`, {
        params: { url }, timeout: 30000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const d = res.data
    const link = d?.videoUrl || d?.url
    if (!link?.startsWith('http')) throw new Error('Ryzumi: pas de lien')
    const dest = tmpPath(type)
    await saveStream(link, dest)
    if (!validFile(dest)) { try { fs.unlinkSync(dest) } catch {}; throw new Error('Ryzumi: fichier invalide') }
    return dest
}

// ─── 5. Ryzumi V2 (vidéo uniquement, qualité 480p) ─────────────
async function viaRyzumiV2(url) {
    const res = await axios.get(`https://api.ryzumi.net/api/downloader/v2/ytmp4`, {
        params: { url, quality: '480' }, timeout: 30000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const d = res.data
    const link = d?.videoUrl || d?.url
    if (!link?.startsWith('http')) throw new Error('Ryzumi V2: pas de lien')
    const dest = tmpPath('video')
    await saveStream(link, dest)
    if (!validFile(dest)) { try { fs.unlinkSync(dest) } catch {}; throw new Error('Ryzumi V2: fichier invalide') }
    return dest
}

// ─── 6. Nexray (audio uniquement) ──────────────────────────────
async function viaNexray(url) {
    const res = await axios.get(`https://api.nexray.web.id/downloader/ytmp3?url=${encodeURIComponent(url)}`, { timeout: 20000 })
    const d = res.data
    if (!d?.status || !d.result?.url) throw new Error(d?.message || 'Nexray: pas de lien')
    const dest = tmpPath('audio')
    await saveStream(d.result.url, dest)
    if (!validFile(dest)) { try { fs.unlinkSync(dest) } catch {}; throw new Error('Nexray: fichier invalide') }
    return dest
}

// ─── Fonction de conversion MP3 avec ffmpeg ─────────────────────
async function ensureRealMp3(filePath) {
    const converted = filePath.replace(/\.mp3$/, '_conv.mp3')
    const bin = ffmpegPath || 'ffmpeg'
    await new Promise((resolve, reject) => {
        exec(`"${bin}" -y -i "${filePath}" -vn -acodec libmp3lame -ab 128k -ar 44100 "${converted}"`,
            { timeout: 60000 },
            (err) => err ? reject(err) : resolve()
        )
    })
    if (!validFile(converted)) throw new Error('ffmpeg: conversion invalide')
    try { fs.unlinkSync(filePath) } catch {}
    return converted
}

// ─── Méthodes directes (liens distants, sans téléchargement local) ─────
export async function getDirectAudioUrl(url) {
    const id = videoId(url)
    const cleanUrl = id ? `https://www.youtube.com/watch?v=${id}` : url
    const errors = []

    try {
        const res = await axios.get(`https://api.nexray.web.id/downloader/ytmp3?url=${encodeURIComponent(cleanUrl)}`, { timeout: 20000 })
        const d = res.data
        if (d?.status && d.result?.url) return { url: d.result.url, title: d.result.title }
        errors.push(`Nexray: ${d?.message || 'pas de lien'}`)
    } catch (e) { errors.push(`Nexray: ${e.message}`) }

    try {
        const res = await axios.get('https://api.ryzumi.net/api/downloader/ytmp3', {
            params: { url: cleanUrl }, timeout: 20000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        const d = res.data
        const link = d?.videoUrl || d?.url
        if (link?.startsWith('http')) return { url: link, title: d?.title }
        errors.push('Ryzumi: pas de lien')
    } catch (e) { errors.push(`Ryzumi: ${e.message}`) }

    try {
        const res = await axios.get(`https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(cleanUrl)}&format=mp3`, { timeout: 30000 })
        if (res.data?.success && res.data?.downloadURL) return { url: res.data.downloadURL, title: res.data.title }
        errors.push('EliteProTech: pas de lien')
    } catch (e) { errors.push(`EliteProTech: ${e.message}`) }

    try {
        const res = await axios.get(`https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(cleanUrl)}`, { timeout: 30000 })
        if (res.data?.success && res.data?.data?.download_url) return { url: res.data.data.download_url, title: res.data.data.title }
        errors.push('Yupra: pas de lien')
    } catch (e) { errors.push(`Yupra: ${e.message}`) }

    throw new Error(`Tous les fournisseurs ont échoué:\n${errors.join('\n')}`)
}

export async function getDirectVideoUrl(url) {
    const id = videoId(url)
    const cleanUrl = id ? `https://www.youtube.com/watch?v=${id}` : url
    const errors = []

    try {
        const res = await axios.get(`https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(cleanUrl)}&format=mp4`, { timeout: 30000 })
        if (res.data?.success && res.data?.downloadURL) return { url: res.data.downloadURL, title: res.data.title }
        errors.push('EliteProTech: pas de lien')
    } catch (e) { errors.push(`EliteProTech: ${e.message}`) }

    try {
        const res = await axios.get(`https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(cleanUrl)}`, { timeout: 30000 })
        if (res.data?.success && res.data?.data?.download_url) return { url: res.data.data.download_url, title: res.data.data.title }
        errors.push('Yupra: pas de lien')
    } catch (e) { errors.push(`Yupra: ${e.message}`) }

    try {
        const res = await axios.get(`https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(cleanUrl)}`, { timeout: 30000 })
        if (res.data?.result?.mp4) return { url: res.data.result.mp4, title: res.data.result.title }
        errors.push('Okatsu: pas de lien')
    } catch (e) { errors.push(`Okatsu: ${e.message}`) }

    throw new Error(`Tous les fournisseurs vidéo ont échoué:\n${errors.join('\n')}`)
}

// ─── RapidAPI (vrai MP3, service payant/freemium) ──────────────
const RAPIDAPI_KEYS = [
    '25222978fdvjklmshe6b4366767fb8e6p18086bjsnee54a88ff976',
    '5b1f7e8168msh62ce2d53951cc9ap1678a4jsn7af1076e73c6'
]

async function viaRapidApi(url) {
    const id = videoId(url)
    if (!id) throw new Error('RapidAPI: ID vidéo introuvable')

    for (const apiKey of RAPIDAPI_KEYS) {
        try {
            const res = await axios.get('https://youtube-mp36.p.rapidapi.com/dl', {
                params: { id },
                headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com' },
                timeout: 30000
            })
            const data = res.data

            if (data?.status === 'processing') {
                // On attend 3s et on réessaie avec la même clé (jusqu'à 3 tentatives)
                for (let i = 0; i < 3; i++) {
                    await new Promise(r => setTimeout(r, 3000))
                    const retry = await axios.get('https://youtube-mp36.p.rapidapi.com/dl', {
                        params: { id },
                        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com' },
                        timeout: 30000
                    })
                    if (retry.data?.status === 'ok' && retry.data?.link) {
                        const dest = tmpPath('audio')
                        const audioRes = await axios.get(retry.data.link, {
                            responseType: 'arraybuffer',
                            timeout: 60000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0',
                                'Referer': 'https://youtube-mp36.p.rapidapi.com/'
                            }
                        })
                        fs.writeFileSync(dest, Buffer.from(audioRes.data))
                        if (validFile(dest)) {
                            return { filePath: dest, title: retry.data.title }
                        } else {
                            try { fs.unlinkSync(dest) } catch {}
                            throw new Error('Fichier RapidAPI invalide')
                        }
                    }
                }
                throw new Error('RapidAPI: toujours en traitement après 3 tentatives')
            }

            if (data?.status !== 'ok' || !data?.link) throw new Error(data?.msg || 'Statut inattendu')

            const dest = tmpPath('audio')
            const audioRes = await axios.get(data.link, {
                responseType: 'arraybuffer',
                timeout: 60000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': 'https://youtube-mp36.p.rapidapi.com/'
                }
            })
            fs.writeFileSync(dest, Buffer.from(audioRes.data))
            if (validFile(dest)) {
                return { filePath: dest, title: data.title }
            } else {
                try { fs.unlinkSync(dest) } catch {}
                throw new Error('Fichier RapidAPI invalide')
            }
        } catch (e) {
            console.log(`[RapidAPI] Clé ${apiKey.slice(0,6)}... échouée:`, e.message)
            // Passer à la clé suivante
        }
    }
    throw new Error('RapidAPI: toutes les clés ont échoué (quota épuisé ou erreurs)')
}

// ─── Audio lisible (avec conversion si besoin) ──────────────────
export async function getPlayableAudio(url) {
    // 1. RapidAPI (vrai MP3)
    try {
        const { filePath, title } = await viaRapidApi(url)
        return { filePath, title, isRemoteUrl: false }
    } catch (e) {
        console.log('[YT] RapidAPI indisponible, repli sur les fournisseurs gratuits:', e.message)
    }

    // 2. Repli : fournisseurs gratuits + téléchargement local + ffmpeg
    const { url: remoteUrl, title } = await getDirectAudioUrl(url)

    const rawPath = tmpPath('audio')
    await saveStream(remoteUrl, rawPath)
    if (!validFile(rawPath)) {
        try { fs.unlinkSync(rawPath) } catch {}
        throw new Error('Fichier téléchargé invalide')
    }

    try {
        const converted = await ensureRealMp3(rawPath)
        return { filePath: converted, title }
    } catch (e) {
        console.log('[YT] ffmpeg indisponible, envoi du fichier brut:', e.message)
        return { filePath: rawPath, title }
    }
}

// ─── Téléchargement complet (audio ou vidéo) avec fallbacks ──
export async function downloadYoutube(url, type = 'audio') {
    const id = videoId(url)
    const cleanUrl = id ? `https://www.youtube.com/watch?v=${id}` : url

    const providers = [
        ['yt-dlp', () => viaYtdlp(cleanUrl, type)],
        ['Ryzumi', () => viaRyzumi(cleanUrl, type)],
    ]
    if (type === 'video') {
        providers.push(['Ryzumi V2', () => viaRyzumiV2(cleanUrl)])
    } else { // audio
        providers.push(['Nexray', () => viaNexray(cleanUrl)])
    }
    providers.push(['Cobalt', () => viaCobalt(cleanUrl, type)])
    providers.push(['Loader.to', () => viaLoaderTo(cleanUrl, type)])

    const attempts = providers.map(([name, fn]) =>
        fn()
            .then(result => { console.log(`[YT] OK via ${name}`); return result })
            .catch(e => { console.log(`[YT] ${name} échoué — ${e.message}`); throw new Error(`${name}: ${e.message}`) })
    )

    let filePath
    try {
        filePath = await Promise.any(attempts)
    } catch (agg) {
        const errors = (agg.errors || []).map(e => e.message)
        throw new Error(`Tous les fournisseurs ont échoué:\n${errors.join('\n')}`)
    }

    if (type === 'audio') {
        try {
            filePath = await ensureRealMp3(filePath)
            console.log('[YT] Conversion ffmpeg OK')
        } catch (e) {
            console.log('[YT] ffmpeg indisponible ou échoué, envoi du fichier brut:', e.message)
        }
    }

    return filePath
}

export default { downloadYoutube, videoId, getDirectAudioUrl, getDirectVideoUrl, getPlayableAudio }

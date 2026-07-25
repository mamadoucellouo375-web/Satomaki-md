// ytdownload.js - Téléchargement YouTube avec 6 fournisseurs en cascade
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'

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
        responseType: 'stream', timeout: 90000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    })
    await new Promise((ok, fail) => {
        const w = fs.createWriteStream(dest)
        res.data.pipe(w)
        w.on('finish', ok); w.on('error', fail); res.data.on('error', fail)
    })
}

function validFile(dest) {
    try { return fs.statSync(dest).size > 5000 } catch { return false }
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

// ─── 2. Cobalt API (nouvelle API v10 — l'ancien /api/json est mort depuis nov. 2024) ──
async function viaCobalt(url, type) {
    const endpoints = [
        'https://sunny.imput.net/',
    ]
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
            }
        } catch {}
    }
    throw new Error('Cobalt: aucun endpoint disponible')
}

// ─── 3. SaveTube ──────────────────────────────────────────────
async function viaSavetube(url, type) {
    const id = videoId(url)
    if (!id) throw new Error('ID introuvable')
    const cdnRes = await axios.get('https://media.savetube.me/api/random-cdn', { timeout: 10000 })
    const cdn = cdnRes.data?.cdn
    if (!cdn) throw new Error('Savetube CDN indisponible')
    const res = await axios.post(`https://${cdn}/download`, {
        url: `https://www.youtube.com/watch?v=${id}`,
        downloadType: type === 'audio' ? 'audio' : 'video',
        quality: type === 'audio' ? '128' : '480'
    }, { timeout: 25000 })
    const link = res.data?.data?.downloadUrl || res.data?.downloadUrl
    if (!link?.startsWith('http')) throw new Error('Savetube: pas de lien')
    const dest = tmpPath(type)
    await saveStream(link, dest)
    if (!validFile(dest)) { try { fs.unlinkSync(dest) } catch {}; throw new Error('Savetube: fichier invalide') }
    return dest
}

// ─── 4. YtMp3 API publique ────────────────────────────────────
async function viaYtmp3(url, type) {
    const id = videoId(url)
    if (!id) throw new Error('ID introuvable')
    const base = type === 'audio'
        ? `https://www.yt-download.org/api/button/mp3/${id}`
        : `https://www.yt-download.org/api/button/videos/${id}`
    const res = await axios.get(base, { timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0' } })
    // Parser la réponse HTML pour le lien de téléchargement
    const match = res.data?.match(/href="(https:\/\/[^"]+\.mp[34][^"]*)"/)
    const link = match?.[1]
    if (!link) throw new Error('YtMp3: lien introuvable dans la réponse')
    const dest = tmpPath(type)
    await saveStream(link, dest)
    if (!validFile(dest)) { try { fs.unlinkSync(dest) } catch {}; throw new Error('YtMp3: fichier invalide') }
    return dest
}

// ─── 5. y2down API ────────────────────────────────────────────
async function viaY2down(url, type) {
    const id = videoId(url)
    if (!id) throw new Error('ID introuvable')
    const res = await axios.get(`https://y2down.cc/api/json?type=${type === 'audio' ? 'mp3' : 'mp4'}&vid=${id}`, {
        timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://y2down.cc/' }
    })
    const link = res.data?.url || res.data?.dlink
    if (!link?.startsWith('http')) throw new Error('y2down: pas de lien')
    const dest = tmpPath(type)
    await saveStream(link, dest)
    if (!validFile(dest)) { try { fs.unlinkSync(dest) } catch {}; throw new Error('y2down: fichier invalide') }
    return dest
}

// ─── 6. Loader.to ─────────────────────────────────────────────
async function viaLoaderTo(url, type) {
    const id = videoId(url)
    if (!id) throw new Error('ID introuvable')
    const fmt = type === 'audio' ? 'mp3' : 'mp4'
    const res = await axios.get(
        `https://loader.to/ajax/download.php?format=${fmt}&url=${encodeURIComponent(`https://youtu.be/${id}`)}`,
        { timeout: 25000, headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://loader.to/' } }
    )
    const link = res.data?.download_url || res.data?.url
    if (!link?.startsWith('http')) throw new Error('Loader.to: pas de lien')
    const dest = tmpPath(type)
    await saveStream(link, dest)
    if (!validFile(dest)) { try { fs.unlinkSync(dest) } catch {}; throw new Error('Loader.to: fichier invalide') }
    return dest
}

// ─── Fonction principale avec cascade ─────────────────────────
export async function downloadYoutube(url, type = 'audio') {
    const providers = [
        ['yt-dlp',    () => viaYtdlp(url, type)],
        ['Cobalt',    () => viaCobalt(url, type)],
        ['SaveTube',  () => viaSavetube(url, type)],
        ['y2down',    () => viaY2down(url, type)],
        ['YtMp3',     () => viaYtmp3(url, type)],
        ['Loader.to', () => viaLoaderTo(url, type)],
    ]

    const errors = []
    for (const [name, fn] of providers) {
        try {
            const result = await fn()
            console.log(`[YT] OK via ${name}`)
            return result
        } catch (e) {
            errors.push(`${name}: ${e.message}`)
            console.log(`[YT] ${name} échoué — ${e.message}`)
        }
    }
    throw new Error(`Tous les fournisseurs ont échoué:\n${errors.join('\n')}`)
}

export default { downloadYoutube, videoId }

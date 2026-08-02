// ytdownload.js - Téléchargement YouTube avec 6 fournisseurs en cascade
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
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
    try {
        const stat = fs.statSync(dest)
        if (stat.size <= 5000) return false

        // Vérifier que ce n'est pas une page d'erreur JSON/HTML sauvegardée par erreur
        // (les APIs gratuites renvoient parfois une erreur au lieu du vrai fichier)
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

// ─── 2. Cobalt API (nouvelle API v10 — l'ancien /api/json est mort depuis nov. 2024) ──
async function viaCobalt(url, type) {
    const endpoints = [
        'https://sunny.imput.net/',
    ]
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

// SaveTube (media.savetube.me) et YtMp3 (yt-download.org) sont morts :
// DNS injoignable / TLS cassé. Retirés en attendant un remplaçant fiable.
// y2down.cc a aussi changé d'architecture, l'ancien endpoint /api/json renvoie 404 :
// retiré en attendant de retrouver le bon format d'API.

// ─── Loader.to (API asynchrone : on initie puis on interroge progress_url) ──
async function viaLoaderTo(url, type) {
    const id = videoId(url)
    if (!id) throw new Error('ID introuvable')
    const fmt = type === 'audio' ? 'mp3' : 'mp4'

    const initRes = await axios.get(
        `https://loader.to/ajax/download.php?format=${fmt}&url=${encodeURIComponent(`https://youtu.be/${id}`)}`,
        { timeout: 25000, headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://loader.to/' } }
    )

    // Cas rare : lien direct dès la première réponse
    let link = initRes.data?.download_url || initRes.data?.url
    const progressUrl = initRes.data?.progress_url

    if (!link && progressUrl) {
        // Polling : on interroge progress_url jusqu'à ce que le fichier soit prêt (max ~40s)
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
            } catch { /* on continue de poller */ }
        }
    }

    // Filet de sécurité : si les champs habituels ont changé de nom, on cherche
    // n'importe quelle URL exploitable dans la réponse brute avant d'abandonner.
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


// ─── Fonction principale : tous les fournisseurs en parallèle ─────
// (au lieu d'attendre chaque échec l'un après l'autre, on les lance
// tous en même temps et on prend le premier qui répond)
async function viaRyzumi(url, type) {
    if (type !== 'audio') throw new Error('Ryzumi: audio uniquement')
    const res = await axios.get(`https://api.ryzumi.net/api/downloader/ytmp3?url=${encodeURIComponent(url)}`, { timeout: 20000 })
    const d = res.data
    const link = d?.videoUrl || d?.url
    if (!link?.startsWith('http')) throw new Error('Ryzumi: pas de lien')
    const dest = tmpPath(type)
    await saveStream(link, dest)
    if (!validFile(dest)) { try { fs.unlinkSync(dest) } catch {}; throw new Error('Ryzumi: fichier invalide') }
    return dest
}

async function viaNexray(url, type) {
    if (type !== 'audio') throw new Error('Nexray: audio uniquement')
    const res = await axios.get(`https://api.nexray.web.id/downloader/ytmp3?url=${encodeURIComponent(url)}`, { timeout: 20000 })
    const d = res.data
    if (!d?.status || !d.result?.url) throw new Error(d?.message || 'Nexray: pas de lien')
    const dest = tmpPath(type)
    await saveStream(d.result.url, dest)
    if (!validFile(dest)) { try { fs.unlinkSync(dest) } catch {}; throw new Error('Nexray: fichier invalide') }
    return dest
}

export async function downloadYoutube(url, type = 'audio') {
    const providers = [
        ['yt-dlp',    () => viaYtdlp(url, type)],
        ['Ryzumi',    () => viaRyzumi(url, type)],
        ['Nexray',    () => viaNexray(url, type)],
        ['Cobalt',    () => viaCobalt(url, type)],
        ['Loader.to', () => viaLoaderTo(url, type)],
    ]

    const attempts = providers.map(([name, fn]) =>
        fn()
            .then(result => { console.log(`[YT] OK via ${name}`); return result })
            .catch(e => { console.log(`[YT] ${name} échoué — ${e.message}`); throw new Error(`${name}: ${e.message}`) })
    )

    try {
        return await Promise.any(attempts)
    } catch (agg) {
        const errors = (agg.errors || []).map(e => e.message)
        throw new Error(`Tous les fournisseurs ont échoué:\n${errors.join('\n')}`)
    }
}

export default { downloadYoutube, videoId }


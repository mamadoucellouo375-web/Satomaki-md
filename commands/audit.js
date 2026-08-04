// commands/audit.js - Auto-diagnostic système (adapté de ZERO TRACE BOT)
import fs from 'fs'
import os from 'os'
import { card } from '../utils/design.js'

const SEV_EMOJI = { ok: '✅', low: '💛', medium: '🟠', high: '🔴', critical: '🆘' }

function checkMemory() {
    const mem = process.memoryUsage()
    const rssMB = mem.rss / (1024 * 1024)
    let severity = 'ok', note = ''
    if (rssMB > 250) { severity = 'critical'; note = 'RAM critique sur un serveur à ressources limitées.' }
    else if (rssMB > 180) { severity = 'high'; note = 'RAM élevée, surveiller.' }
    else if (rssMB > 100) { severity = 'medium'; note = 'RAM modérée.' }
    return { label: 'RAM processus', severity, detail: `RSS : ${rssMB.toFixed(1)} MB`, note }
}

function checkCPU() {
    const cores = os.cpus().length
    const load1 = os.loadavg()[0]
    let severity = 'ok', note = ''
    if (load1 > cores * 0.9) { severity = 'high'; note = 'CPU élevé.' }
    else if (load1 > cores * 0.6) { severity = 'medium'; note = 'Charge notable.' }
    return { label: 'CPU / Load', severity, detail: `Load 1m : ${load1.toFixed(2)} / ${cores} cœur(s)`, note }
}

async function checkEventLoop() {
    const start = Date.now()
    await new Promise(r => setTimeout(r, 0))
    const lag = Date.now() - start
    let severity = 'ok', note = ''
    if (lag > 300) { severity = 'critical'; note = 'Event-loop bloquée, bot probablement lent.' }
    else if (lag > 100) { severity = 'high'; note = 'Latence notable.' }
    return { label: 'Event-loop lag', severity, detail: `${lag} ms`, note }
}

function checkUptime() {
    const s = process.uptime()
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
    const label = h > 0 ? `${h}h ${m}m` : `${m}m ${Math.floor(s % 60)}s`
    const severity = s < 120 ? 'medium' : 'ok'
    return { label: 'Uptime', severity, detail: label, note: s < 120 ? 'Redémarrage récent (crash possible, regarde crash.log).' : '' }
}

function checkCriticalFiles() {
    const files = ['index.js', 'Digix/crew.js', 'events/messageHandler.js', 'utils/configmanager.js', 'utils/design.js', 'Config.json']
    const missing = files.filter(f => !fs.existsSync(f))
    return {
        label: 'Fichiers critiques',
        severity: missing.length > 0 ? 'critical' : 'ok',
        detail: missing.length > 0 ? `Manquants : ${missing.join(', ')}` : `${files.length} fichiers présents.`,
        note: missing.length > 0 ? 'Le bot va probablement planter.' : ''
    }
}

function checkDisk() {
    let tempCount = 0
    try {
        if (fs.existsSync('database')) {
            tempCount = fs.readdirSync('database').filter(f => /^yt_\d+_/.test(f)).length
        }
    } catch {}
    return {
        label: 'Fichiers temporaires',
        severity: tempCount > 20 ? 'medium' : 'ok',
        detail: `${tempCount} fichier(s) temporaire(s) dans database/`,
        note: tempCount > 20 ? 'Le nettoyage auto passe toutes les 30 min, ça devrait se résorber.' : ''
    }
}

function checkCrashLog() {
    if (!fs.existsSync('crash.log')) return { label: 'Crash log', severity: 'ok', detail: 'Aucun crash enregistré.' }
    try {
        const content = fs.readFileSync('crash.log', 'utf-8')
        const count = (content.match(/\d{4}-\d{2}-\d{2}T/g) || []).length
        return {
            label: 'Crash log',
            severity: count > 5 ? 'high' : count > 0 ? 'medium' : 'ok',
            detail: `${count} entrée(s) dans crash.log`,
            note: count > 0 ? 'Regarde crash.log pour le détail.' : ''
        }
    } catch { return { label: 'Crash log', severity: 'ok', detail: 'Illisible.' } }
}

export default async function audit(client, message) {
    const remoteJid = message.key.remoteJid

    await client.sendMessage(remoteJid, { text: '🔬 *Audit en cours...*' }, { quoted: message })

    const checks = [
        checkMemory(),
        checkCPU(),
        await checkEventLoop(),
        checkUptime(),
        checkCriticalFiles(),
        checkDisk(),
        checkCrashLog()
    ]

    const issues = checks.filter(c => c.severity !== 'ok')
    const criticalCount = checks.filter(c => c.severity === 'critical').length

    const lines = checks.map(c => {
        let l = `${SEV_EMOJI[c.severity]} ${c.label} : ${c.detail}`
        if (c.note) l += `\n   💬 ${c.note}`
        return l
    })

    const globalState = criticalCount > 0 ? '🆘 CRITIQUE' : issues.length > 0 ? `⚠️ ${issues.length} alerte(s)` : '✅ OPTIMAL'

    await client.sendMessage(remoteJid, {
        text: card('AUDIT SYSTÈME', [...lines, '---', `État global : ${globalState}`])
    }, { quoted: message })
}

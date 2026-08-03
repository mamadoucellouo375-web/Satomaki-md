// tempCleaner.js - Supprime les fichiers temporaires oubliés dans database/
// (sécurité : si un téléchargement plante avant son propre fs.unlink, ce
// fichier resterait sinon indéfiniment et finirait par saturer le disque)
import fs from 'fs'
import path from 'path'

// Motifs de fichiers considérés comme temporaires (générés par les téléchargeurs)
const TEMP_PATTERNS = [/^yt_\d+_/, /_conv\.mp3$/, /^nova_\d+\./]
const MAX_AGE_MS = 60 * 60 * 1000 // 1 heure

function sweepOnce() {
    const dir = 'database'
    if (!fs.existsSync(dir)) return

    let files
    try { files = fs.readdirSync(dir) } catch { return }

    const now = Date.now()
    let removed = 0

    for (const file of files) {
        if (!TEMP_PATTERNS.some(p => p.test(file))) continue
        const fullPath = path.join(dir, file)
        try {
            const stat = fs.statSync(fullPath)
            if (now - stat.mtimeMs > MAX_AGE_MS) {
                fs.unlinkSync(fullPath)
                removed++
            }
        } catch { /* fichier déjà supprimé entre-temps, on ignore */ }
    }

    if (removed > 0) console.log(`🧹 Nettoyage auto : ${removed} fichier(s) temporaire(s) supprimé(s)`)
}

export function startTempCleaner(intervalMs = 30 * 60 * 1000) {
    sweepOnce() // un premier passage au démarrage
    setInterval(sweepOnce, intervalMs)
}

export default { startTempCleaner }

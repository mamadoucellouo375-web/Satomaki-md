import fs from 'fs'

// path for config setup
const configPath = 'Config.json'
const premiumPath = 'db.json'

// ─── Charger la config au démarrage ────────────────────────────
let config = {}
if (fs.existsSync(configPath)) {
    try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    } catch (e) {
        console.error('Erreur lecture Config.json, config vide utilisée:', e.message)
        config = { users: {} }
    }
} else {
    config = { users: {} }
}

// ─── Sauvegarde asynchrone + debounce ──────────────────────────
// Plusieurs save() rapprochés (ex: kick + log + toggle dans la même commande)
// sont regroupés en une seule écriture disque non-bloquante, au lieu de
// bloquer tout le bot à chaque appel avec writeFileSync.
let saveTimer = null
function saveConfig() {
    if (saveTimer) return
    saveTimer = setTimeout(() => {
        saveTimer = null
        fs.writeFile(configPath, JSON.stringify(config, null, 2), (err) => {
            if (err) console.error('Erreur sauvegarde Config.json:', err.message)
        })
    }, 300)
}

// ─── Utilisateurs premium ───────────────────────────────────────
let premiums = {}
if (fs.existsSync(premiumPath)) {
    try {
        premiums = JSON.parse(fs.readFileSync(premiumPath, 'utf-8'))
    } catch (e) {
        console.error('Erreur lecture db.json, config premium vide utilisée:', e.message)
        premiums = { premiumUser: {} }
    }
} else {
    premiums = { premiumUser: {} }
}

let savePremiumTimer = null
function savePremium() {
    if (savePremiumTimer) return
    savePremiumTimer = setTimeout(() => {
        savePremiumTimer = null
        fs.writeFile(premiumPath, JSON.stringify(premiums, null, 2), (err) => {
            if (err) console.error('Erreur sauvegarde db.json:', err.message)
        })
    }, 300)
}

export default {
    config,
    premiums,
    saveP() { savePremium() },
    save() { saveConfig() }
}

// Sécurité : si le process s'arrête proprement (redéploiement, restart manuel),
// on force une écriture synchrone immédiate pour ne rien perdre.
function flushSync() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
    try { fs.writeFileSync(configPath, JSON.stringify(config, null, 2)) } catch {}
    if (savePremiumTimer) { clearTimeout(savePremiumTimer); savePremiumTimer = null }
    try { fs.writeFileSync(premiumPath, JSON.stringify(premiums, null, 2)) } catch {}
}
process.on('exit', flushSync)
process.on('SIGINT', () => { flushSync(); process.exit() })
process.on('SIGTERM', () => { flushSync(); process.exit() })

import fs from 'fs'
import { execSync } from 'child_process'

// ✅ Capture toutes les erreurs non gérées et les sauvegarde dans crash.log
// au lieu de laisser le process entier planter (fini les redémarrages manuels
// sur KataBump/Pterodactyl pour une erreur ponctuelle dans une seule commande)
process.on('uncaughtException', (err) => {
    const msg = new Date().toISOString() + '\n' + err.stack + '\n\n'
    try { fs.appendFileSync('./crash.log', msg) } catch {}
    console.error('💥 CRASH:', err.stack)
})

process.on('unhandledRejection', (reason) => {
    const msg = new Date().toISOString() + '\nUnhandled Rejection: ' + reason + '\n\n'
    try { fs.appendFileSync('./crash.log', msg) } catch {}
    console.error('💥 REJECTION:', reason)
})

// ─── Installation automatique des dépendances ──────────────────
// N'utilise QUE des modules natifs Node.js ici (aucun import externe avant
// cette étape), pour que ça marche même si node_modules est vide/obsolète.
// Fonctionne peu importe si le panel lance `node index.js` ou `node boot.js`.
function needsInstall() {
    try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
        const deps = Object.keys(pkg.dependencies || {})
        return deps.some(dep => !fs.existsSync(`node_modules/${dep}`))
    } catch {
        return true
    }
}

if (needsInstall()) {
    console.log('📦 Dépendances manquantes détectées — installation automatique...')
    try {
        execSync('npm install --no-audit --no-fund', { stdio: 'inherit' })
    } catch (e) {
        console.error('⚠️ Premier npm install incomplet (scripts probablement bloqués):', e.message)
    }
} else {
    console.log('✅ Toutes les dépendances sont déjà présentes.')
}

// npm 11.16+ bloque par défaut les scripts d'installation (postinstall/install)
// des dépendances tant qu'ils ne sont pas explicitement approuvés. Un paquet comme
// ffmpeg-static peut donc exister comme dossier (needsInstall() le voit "présent")
// alors que son binaire n'a jamais été téléchargé. On approuve + réinstalle à
// CHAQUE démarrage (rapide et sans effet si déjà approuvé) pour ne jamais rater ce cas.
try {
    execSync('npm approve-scripts --all', { stdio: 'inherit' })
    execSync('npm install --no-audit --no-fund', { stdio: 'inherit' })
    console.log('✅ Scripts d\'installation approuvés et à jour.')
} catch (e) {
    console.error('❌ Échec de l\'approbation/réinstallation automatique:', e.message)
    console.error('   Le bot va quand même essayer de démarrer avec ce qui est déjà installé.')
}

// ─── Chargement du bot (APRÈS l'installation) ──────────────────
// Import dynamique = exécuté seulement maintenant, pas avant, contrairement
// à un import statique classique qui aurait planté si les deps manquaient.
const { default: connectToWhatsapp } = await import('./Digix/crew.js')
const { default: handleIncomingMessage } = await import('./events/messageHandler.js')


await connectToWhatsapp(handleIncomingMessage)
console.log('established !')

// boot.js - Point d'entrée réel : installe automatiquement les dépendances
// manquantes AVANT de charger le bot, à chaque démarrage/redémarrage.
// N'utilise QUE des modules natifs Node.js (aucune dépendance externe ici),
// pour que ça marche même si node_modules est vide ou obsolète.
import { execSync } from 'child_process'
import fs from 'fs'

function needsInstall() {
    try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
        const deps = Object.keys(pkg.dependencies || {})
        for (const dep of deps) {
            if (!fs.existsSync(`node_modules/${dep}`)) return true
        }
        return false
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

// Chargement du vrai bot APRÈS l'installation (import dynamique = exécuté
// seulement maintenant, pas avant, contrairement à un import classique)
await import('./index.js')


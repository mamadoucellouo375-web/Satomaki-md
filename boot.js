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
        console.log('✅ Installation terminée.')
    } catch (e) {
        console.error('❌ Échec de npm install automatique:', e.message)
        console.error('   Le bot va quand même essayer de démarrer avec ce qui est déjà installé.')
    }
} else {
    console.log('✅ Toutes les dépendances sont déjà présentes.')
}

// Chargement du vrai bot APRÈS l'installation (import dynamique = exécuté
// seulement maintenant, pas avant, contrairement à un import classique)
await import('./index.js')

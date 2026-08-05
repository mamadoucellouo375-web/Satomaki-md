import fs from 'fs'
import { execSync } from 'child_process'

// ✅ Capture toutes les erreurs non gérées
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
function needsInstall() {
    try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
        const deps = Object.keys(pkg.dependencies || {})
        return deps.some(dep => !fs.existsSync(`node_modules/${dep}`))
    } catch {
        return true
    }
}

// 📦 Installation UNIQUE + approbation des scripts (npm v11+)
try {
    // S'execute TOUJOURS au démarrage (rapide car npm check les versions)
    // Mais n'installe que si besoin (grâce à --no-audit c'est très léger)
    execSync('npm approve-scripts --all', { stdio: 'inherit' })
    execSync('npm install --no-audit --no-fund', { stdio: 'inherit' })
    console.log('✅ Dépendances vérifiées et scripts approuvés.')
} catch (e) {
    console.error('❌ Échec de l\'installation automatique:', e.message)
    console.error('   Le bot va essayer de démarrer avec ce qui est déjà installé.')
}

// ─── Chargement du bot ──────────────────────────────────────────
// ⚠️ IMPORTANT : Votre package.json doit contenir "type": "module"
const { default: connectToWhatsapp } = await import('./Digix/crew.js')
const { default: handleIncomingMessage } = await import('./events/messageHandler.js')

await connectToWhatsapp(handleIncomingMessage)
console.log('🚀 Bot établi avec succès !')

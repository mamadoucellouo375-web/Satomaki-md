import fs from 'fs'

// ✅ Capture toutes les erreurs non gérées et les sauvegarde dans crash.log
// au lieu de laisser le process entier planter (fini les redémarrages manuels
// sur KataBump pour une erreur ponctuelle dans une seule commande)
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

import connectToWhatsapp from './Digix/crew.js'
import handleIncomingMessage from './events/messageHandler.js 
(async() => {
    await connectToWhatsapp(handleIncomingMessage)
        console.log('established !')
})()

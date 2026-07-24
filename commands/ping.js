import { card, loading, FOOTER } from '../utils/design.js'

export async function pingTest(client, message) {
    const remoteJid = message.key.remoteJid
    const start = Date.now()
    await client.sendMessage(remoteJid, { text: loading('Test réseau') }, { quoted: message })
    const lat = Date.now() - start
    const bar = lat < 200 ? '🟢🟢🟢🟢🟢' : lat < 500 ? '🟡🟡🟡⬛⬛' : '🔴🔴⬛⬛⬛'
    const qual = lat < 200 ? 'Excellent' : lat < 500 ? 'Bon' : 'Lent'

    await client.sendMessage(remoteJid, {
        text: card('🏓 PING NOVA REAPER MD', [
            `Latence : *${lat}ms*`,
            `Qualité : *${qual}*`,
            `Signal  : ${bar}`,
            '---',
            `Bot     : *En ligne* ✅`,
            `Préfixe : *.*`,
        ])
    }, { quoted: message })
}

export default pingTest

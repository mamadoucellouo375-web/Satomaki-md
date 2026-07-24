import { card } from '../utils/design.js'

export async function uptime(client, message) {
    const remoteJid = message.key.remoteJid
    const s = process.uptime()
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    const mem = process.memoryUsage()
    const ram = (mem.heapUsed / 1024 / 1024).toFixed(1)
    const ramTotal = (mem.heapTotal / 1024 / 1024).toFixed(1)
    const ramPct = Math.round((mem.heapUsed / mem.heapTotal) * 100)
    const ramBar = '█'.repeat(Math.round(ramPct/10)) + '░'.repeat(10 - Math.round(ramPct/10))

    await client.sendMessage(remoteJid, {
        text: card('⏱️ UPTIME NOVA REAPER MD', [
            `Durée    : *${d}j ${h}h ${m}m ${sec}s*`,
            '---',
            `RAM      : *${ram}/${ramTotal} MB*`,
            `Usage    : [${ramBar}] *${ramPct}%*`,
            '---',
            `Node.js  : *${process.version}*`,
            `Statut   : *En vie* .`,
        ])
    }, { quoted: message })
}

export default uptime

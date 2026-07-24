import { card } from '../utils/design.js'
import statsUtil from '../utils/stats.js'

export default async function statsCommand(client, message) {
    const remoteJid = message.key.remoteJid
    const data = statsUtil.getStats()
    const top = statsUtil.getTopCommands(8)
    const uptime = statsUtil.getUptimeFormatted()

    const topList = top.map(([ cmd, count ], i) => `${i+1}. .${cmd} — ${count}x`)

    await client.sendMessage(remoteJid, {
        text: card('STATISTIQUES NOVA REAPER MD', [
            `Total commandes : *${data.totalCommands}*`,
            `Uptime          : *${uptime}*`,
            '---',
            '# Top commandes',
            ...topList,
        ])
    }, { quoted: message })
}

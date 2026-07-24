import axios from 'axios'

export default async function footliveCommand(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const query = text.trim().split(/\s+/).slice(1).join(' ')

    await client.sendMessage(remoteJid, { text: '⚽ *Recherche scores...*' }, { quoted: message })

    try {
        // TheSportsDB API (gratuit, sans clé)
        const today = new Date().toISOString().split('T')[0]
        const res = await axios.get(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${today}&s=Soccer`, {
            timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        const events = res.data?.events
        if (!events?.length) {
            return client.sendMessage(remoteJid, {
                text: `⚽ *Foot Live NOVA REAPER MD*\n\n📅 ${today}\n\nAucun match aujourd'hui.\n\n✠ *NOVA REAPER MD*`
            }, { quoted: message })
        }
        const filtered = query
            ? events.filter(e => e.strHomeTeam?.toLowerCase().includes(query.toLowerCase()) || e.strAwayTeam?.toLowerCase().includes(query.toLowerCase()))
            : events.slice(0, 10)

        if (!filtered.length) return client.sendMessage(remoteJid, { text: `❌ Aucun match trouvé pour "${query}".` }, { quoted: message })

        const list = filtered.map(e => {
            const score = e.intHomeScore !== null ? `*${e.intHomeScore} - ${e.intAwayScore}*` : '⏳ À venir'
            const time = e.strTime ? e.strTime.substring(0, 5) : '--:--'
            return `⚽ ${e.strHomeTeam} vs ${e.strAwayTeam}\n   🕐 ${time} | ${score}\n   🏆 ${e.strLeague || 'N/A'}`
        }).join('\n\n')

        await client.sendMessage(remoteJid, {
            text: `⚽ *Foot Live - ${today}*\n\n${list}\n\n✠ *NOVA REAPER MD*`
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: `❌ Service indisponible : ${e.message}` }, { quoted: message })
    }
}

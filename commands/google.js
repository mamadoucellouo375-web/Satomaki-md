// google.js - Recherche web via DuckDuckGo (gratuit, sans clé)
import axios from 'axios'

export default async function googleCommand(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const query = text.trim().split(/\s+/).slice(1).join(' ')
    if (!query) return client.sendMessage(remoteJid, { text: '❌ Usage : .google <recherche>' }, { quoted: message })

    await client.sendMessage(remoteJid, { text: '🔍 *Recherche en cours...*' }, { quoted: message })

    try {
        // DuckDuckGo Instant Answer API (gratuit)
        const res = await axios.get('https://api.duckduckgo.com/', {
            params: { q: query, format: 'json', no_html: 1, skip_disambig: 1, kl: 'fr-fr' },
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        })

        const data = res.data
        const abstract = data.AbstractText || ''
        const relatedTopics = data.RelatedTopics?.slice(0, 3) || []
        const answer = data.Answer || ''
        const definition = data.Definition || ''

        let result = `🔍 *Recherche : ${query}*\n\n`

        if (answer) result += `💡 *Réponse :* ${answer}\n\n`
        if (abstract) result += `📝 *Résumé :*\n${abstract}\n\n`
        if (definition) result += `📖 *Définition :* ${definition}\n\n`

        if (relatedTopics.length) {
            result += `🔗 *Résultats liés :*\n`
            relatedTopics.forEach((t, i) => {
                if (t.Text) result += `${i + 1}. ${t.Text.substring(0, 100)}\n`
            })
        }

        if (!abstract && !answer && !definition && !relatedTopics.length) {
            result += `Aucun résultat direct trouvé.\n🌐 Recherche sur Google : https://www.google.com/search?q=${encodeURIComponent(query)}`
        }

        result += `\n✠ *NOVA REAPER MD*`

        await client.sendMessage(remoteJid, { text: result }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, {
            text: `❌ Recherche échouée.\n🌐 Essaie manuellement : https://www.google.com/search?q=${encodeURIComponent(query)}`
        }, { quoted: message })
    }
}

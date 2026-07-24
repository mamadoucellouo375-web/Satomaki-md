import { card, loading, error } from '../utils/design.js'
import axios from 'axios'

const gptHistories = new Map()

export async function showGptHistory(client, message) {
    const remoteJid = message.key.remoteJid
    const userId = message.key.participant || remoteJid
    const h = gptHistories.get(userId) || []
    if (!h.length) return client.sendMessage(remoteJid, { text: card('📜 HISTORIQUE GPT', ['Aucun historique.']) }, { quoted: message })
    await client.sendMessage(remoteJid, {
        text: card('📜 HISTORIQUE GPT', h.map(m => `${m.role === 'user' ? '👤' : '🤖'} ${m.content.substring(0, 60)}`))
    }, { quoted: message })
}

export async function resetHistory(client, message) {
    gptHistories.delete(message.key.participant || message.key.remoteJid)
    await client.sendMessage(message.key.remoteJid, { text: card('🗑️ RESET GPT', ['Historique effacé.']) }, { quoted: message })
}

export default async function gptCommand(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const prompt = text.trim().split(/\s+/).slice(1).join(' ')
    if (!prompt) return client.sendMessage(remoteJid, { text: error('Usage : .gpt <ta question>') }, { quoted: message })

    const userId = message.key.participant || remoteJid
    let history = gptHistories.get(userId) || []

    await client.sendMessage(remoteJid, { text: loading('GPT traite ta requête') }, { quoted: message })

    try {
        const messages = [
            { role: 'system', content: 'Tu es un assistant IA utile. Réponds en français.' },
            ...history.slice(-10),
            { role: 'user', content: prompt }
        ]
        const res = await axios.post('https://text.pollinations.ai/openai', {
            model: 'openai-large', messages, temperature: 0.7
        }, { timeout: 20000, headers: { 'Content-Type': 'application/json' } })
        const reply = res.data?.choices?.[0]?.message?.content
        if (!reply) throw new Error()
        history.push({ role: 'user', content: prompt }, { role: 'assistant', content: reply })
        if (history.length > 20) history = history.slice(-20)
        gptHistories.set(userId, history)
        await client.sendMessage(remoteJid, { text: card('🧠 GPT', [reply]) }, { quoted: message })
    } catch {
        try {
            const res = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`, { timeout: 15000 })
            const reply = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
            await client.sendMessage(remoteJid, { text: card('🧠 GPT', [reply]) }, { quoted: message })
        } catch {
            await client.sendMessage(remoteJid, { text: error('GPT indisponible. Réessaie.') }, { quoted: message })
        }
    }
}

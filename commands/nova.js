import { card, loading, error } from '../utils/design.js'
import axios from 'axios'

const novaHistories = new Map()
const MAX_HISTORY = 10

async function callAI(prompt, history = []) {
    const messages = [
        { role: 'system', content: 'Tu es Nova, une IA intelligente, sympa et utile du bot NOVA REAPER MD. Réponds toujours en français sauf si on te parle dans une autre langue. Sois concis et clair.' },
        ...history,
        { role: 'user', content: prompt }
    ]
    try {
        const res = await axios.post('https://text.pollinations.ai/openai', {
            model: 'openai', messages, temperature: 0.8
        }, { timeout: 15000, headers: { 'Content-Type': 'application/json' } })
        return res.data?.choices?.[0]?.message?.content || null
    } catch {}
    try {
        const res = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&seed=42`, { timeout: 15000 })
        return typeof res.data === 'string' ? res.data : null
    } catch {}
    return null
}

export async function showNovaHistory(client, message) {
    const remoteJid = message.key.remoteJid
    const userId = message.key.participant || remoteJid
    const history = novaHistories.get(userId) || []
    if (!history.length) return client.sendMessage(remoteJid, { text: card('📜 HISTORIQUE NOVA', ['Aucun historique.']) }, { quoted: message })
    await client.sendMessage(remoteJid, {
        text: card('📜 HISTORIQUE NOVA', history.map((m, i) => `${m.role === 'user' ? '👤' : '🤖'} ${m.content.substring(0, 60)}...`))
    }, { quoted: message })
}

export async function resetNovaHistory(client, message) {
    novaHistories.delete(message.key.participant || message.key.remoteJid)
    await client.sendMessage(message.key.remoteJid, {
        text: card('🗑️ RESET NOVA', ['Historique effacé.'])
    }, { quoted: message })
}

export default async function novaCommand(client, message, args) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const prompt = text.trim().split(/\s+/).slice(1).join(' ')
    if (!prompt) return client.sendMessage(remoteJid, { text: error('Usage : .nova <ta question>') }, { quoted: message })

    const userId = message.key.participant || remoteJid
    let history = novaHistories.get(userId) || []

    await client.sendMessage(remoteJid, { text: loading('Nova réfléchit') }, { quoted: message })

    const reply = await callAI(prompt, history)
    if (!reply) return client.sendMessage(remoteJid, { text: error('Nova est indisponible. Réessaie plus tard.') }, { quoted: message })

    history.push({ role: 'user', content: prompt }, { role: 'assistant', content: reply })
    if (history.length > MAX_HISTORY * 2) history = history.slice(-MAX_HISTORY * 2)
    novaHistories.set(userId, history)

    await client.sendMessage(remoteJid, {
        text: card('✨ NOVA IA', [reply])
    }, { quoted: message })
}

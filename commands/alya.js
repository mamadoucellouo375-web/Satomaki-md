import { card, loading, error } from '../utils/design.js'
import axios from 'axios'

const alyaHistories = new Map()
const MAX_HISTORY = 10

export async function showAlyaHistory(client, message) {
    const remoteJid = message.key.remoteJid
    const userId = message.key.participant || remoteJid
    const h = alyaHistories.get(userId) || []
    if (!h.length) return client.sendMessage(remoteJid, { text: card('📜 HISTORIQUE ALYA', ['Aucun historique.']) }, { quoted: message })
    await client.sendMessage(remoteJid, {
        text: card('📜 HISTORIQUE ALYA', h.map(m => `${m.role === 'user' ? '👤' : '💅'} ${m.content.substring(0, 60)}`))
    }, { quoted: message })
}

export async function resetAlyaHistory(client, message) {
    alyaHistories.delete(message.key.participant || message.key.remoteJid)
    await client.sendMessage(message.key.remoteJid, { text: card('🗑️ RESET ALYA', ['Historique effacé.']) }, { quoted: message })
}

export default async function alyaCommand(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const prompt = text.trim().split(/\s+/).slice(1).join(' ')
    if (!prompt) return client.sendMessage(remoteJid, { text: error('Usage : .alya <question>') }, { quoted: message })

    const userId = message.key.participant || remoteJid
    let history = alyaHistories.get(userId) || []

    await client.sendMessage(remoteJid, { text: loading('Alya réfléchit') }, { quoted: message })

    try {
        const messages = [
            { role: 'system', content: 'Tu es Alya, une IA féminine, élégante, légèrement tsundere mais très intelligente. Tu réponds en français avec une personnalité unique, parfois piquante mais toujours utile.' },
            ...history.slice(-MAX_HISTORY * 2),
            { role: 'user', content: prompt }
        ]
        const res = await axios.post('https://text.pollinations.ai/openai', {
            model: 'openai', messages, temperature: 0.85
        }, { timeout: 15000, headers: { 'Content-Type': 'application/json' } })
        const reply = res.data?.choices?.[0]?.message?.content
        if (!reply) throw new Error()
        history.push({ role: 'user', content: prompt }, { role: 'assistant', content: reply })
        if (history.length > MAX_HISTORY * 2) history = history.slice(-MAX_HISTORY * 2)
        alyaHistories.set(userId, history)
        await client.sendMessage(remoteJid, { text: card('💅 ALYA', [reply]) }, { quoted: message })
    } catch {
        await client.sendMessage(remoteJid, { text: error('Alya est indisponible. Réessaie.') }, { quoted: message })
    }
}

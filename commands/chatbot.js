import { card, success, error, loading } from '../utils/design.js'
import axios from 'axios'

const sessions = new Map()
export function getAIResponse() {}
export function setUserMode() {}
export function getUserMode() {}

export default async function chatbotCommand(client, message, args) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const parts = text.trim().split(/\s+/)
    const sub = parts[1]?.toLowerCase()
    const prompt = parts.slice(1).join(' ')

    if (sub === 'off') {
        sessions.delete(remoteJid)
        return client.sendMessage(remoteJid, { text: card('🔴 CHATBOT', ['Chatbot désactivé.']) }, { quoted: message })
    }
    if (sub === 'reset') {
        sessions.set(remoteJid, [])
        return client.sendMessage(remoteJid, { text: card('🔄 CHATBOT', ['Conversation réinitialisée.']) }, { quoted: message })
    }
    if (!prompt || sub === 'on') {
        sessions.set(remoteJid, [])
        return client.sendMessage(remoteJid, {
            text: card('🟢 CHATBOT ACTIVÉ', ['Parle-moi librement !', '.chatbot off pour désactiver.'])
        }, { quoted: message })
    }

    let history = sessions.get(remoteJid) || []
    await client.sendMessage(remoteJid, { text: loading('Chatbot répond') }, { quoted: message })

    try {
        const messages = [
            { role: 'system', content: 'Tu es un assistant conversationnel amical. Réponds en français.' },
            ...history.slice(-16),
            { role: 'user', content: prompt }
        ]
        const res = await axios.post('https://text.pollinations.ai/openai', {
            model: 'openai', messages, temperature: 0.75
        }, { timeout: 15000, headers: { 'Content-Type': 'application/json' } })
        const reply = res.data?.choices?.[0]?.message?.content
        if (!reply) throw new Error()
        history.push({ role: 'user', content: prompt }, { role: 'assistant', content: reply })
        if (history.length > 20) history = history.slice(-20)
        sessions.set(remoteJid, history)
        await client.sendMessage(remoteJid, { text: card('🤖 CHATBOT', [reply]) }, { quoted: message })
    } catch {
        await client.sendMessage(remoteJid, { text: error('Chatbot indisponible.') }, { quoted: message })
    }
}

// gen.js - Génération d'image via Pollinations AI (gratuit, sans clé)
import axios from 'axios'

export async function generate(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const prompt = text.trim().split(/\s+/).slice(1).join(' ')
    if (!prompt) return client.sendMessage(remoteJid, { text: '❌ Usage : .gen <description de l\'image>' }, { quoted: message })

    await client.sendMessage(remoteJid, { text: '🎨 *Génération de l\'image en cours...*' }, { quoted: message })

    try {
        const seed = Math.floor(Math.random() * 999999)
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`

        await client.sendMessage(remoteJid, {
            image: { url: imageUrl },
            caption: `🎨 *Image générée*\n\n📝 Prompt : ${prompt}\n\n✠ *NOVA REAPER MD*`
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: '❌ Génération échouée. Réessaie.' }, { quoted: message })
    }
}

export default { generate }

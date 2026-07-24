import axios from 'axios'

export default async function img(message, client) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const query = text.trim().split(/\s+/).slice(1).join(' ')
    if (!query) return client.sendMessage(remoteJid, { text: '❌ Usage : .img <recherche>' }, { quoted: message })

    await client.sendMessage(remoteJid, { text: '🖼️ *Recherche image...*' }, { quoted: message })

    try {
        // Unsplash source (gratuit, sans clé)
        const seed = Math.floor(Math.random() * 1000)
        const imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=${seed}`

        await client.sendMessage(remoteJid, {
            image: { url: imageUrl },
            caption: `🖼️ *Image : ${query}*\n✠ *NOVA REAPER MD*`
        }, { quoted: message })
    } catch {
        try {
            // Fallback: Pollinations image
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(query)}?width=800&height=600&nologo=true`
            await client.sendMessage(remoteJid, {
                image: { url: imageUrl },
                caption: `🖼️ *Image : ${query}*\n✠ *NOVA REAPER MD*`
            }, { quoted: message })
        } catch {
            await client.sendMessage(remoteJid, { text: '❌ Image introuvable.' }, { quoted: message })
        }
    }
}

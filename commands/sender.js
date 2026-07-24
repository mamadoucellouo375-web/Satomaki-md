import stylizedChar from "../utils/fancy.js"

async function sender(message, client, texts) {
    const remoteJid = message?.key?.remoteJid
    try {
        await client.sendMessage(remoteJid, {
            text: stylizedChar(`> _*${texts}*_`)
        }, { quoted: message })
    } catch (e) {
        console.error('sender error:', e.message)
    }
}

export default sender

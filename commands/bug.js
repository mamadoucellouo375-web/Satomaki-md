export default async function bug(message, client, texts, num) {
    const remoteJid = message.key?.remoteJid
    if (!remoteJid) return
    try {
        await client.sendMessage(remoteJid, {
            text: `> ${texts}`,
            contextInfo: {
                externalAdReply: {
                    title: '✠ NOVA REAPER MD',
                    body: 'Empire des Ténèbres',
                    thumbnail: null,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: message })
    } catch {
        try {
            await client.sendMessage(remoteJid, { text: `> ${texts}` }, { quoted: message })
        } catch {}
    }
}

export default async function dp(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const args = text.trim().split(/\s+/)
    const action = args[1]?.toLowerCase()
    const target = message.message?.extendedTextMessage?.contextInfo?.participant || message.key.participant || remoteJid

    if (!action || action === 'get') {
        try {
            const pp = await client.profilePictureUrl(target, 'image')
            await client.sendMessage(remoteJid, {
                image: { url: pp },
                caption: `🖼️ *Photo de profil*\n👤 @${target.split('@')[0]}\n\n✠ *NOVA REAPER MD*`,
                mentions: [target]
            }, { quoted: message })
        } catch {
            await client.sendMessage(remoteJid, { text: '❌ Aucune photo de profil ou profil privé.' }, { quoted: message })
        }
        return
    }

    if (action === 'set') {
        const imgMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || message.message?.imageMessage
        if (!imgMsg) return client.sendMessage(remoteJid, { text: '❌ Envoie une image ou réponds à une image.' }, { quoted: message })
        try {
            const { downloadMediaMessage } = await import('baileys')
            const buffer = await downloadMediaMessage(message, 'buffer', {})
            await client.updateProfilePicture(client.user.id, buffer)
            await client.sendMessage(remoteJid, { text: '✅ Photo de profil mise à jour !\n\n✠ *NOVA REAPER MD*' }, { quoted: message })
        } catch {
            await client.sendMessage(remoteJid, { text: '❌ Impossible de changer la photo.' }, { quoted: message })
        }
        return
    }

    await client.sendMessage(remoteJid, {
        text: `🖼️ *DP NOVA REAPER MD*\n\n.dp get — Voir la photo\n.dp set — Changer la photo (répondre à une image)\n\n✠ *NOVA REAPER MD*`
    }, { quoted: message })
}

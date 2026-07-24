export default async function links(client, message) {
    const remoteJid = message.key.remoteJid
    await client.sendMessage(remoteJid, {
        text: `🔗 *Liens NOVA REAPER MD*\n\n🤖 Bot : NOVA REAPER MD v1.0.0\n⚔️ Dev : *(꧁⚡𝕹𝖔𝖛𝖆_𝕾𝖆𝖙𝖔𝖒𝖆𝖐𝖎⚡꧂)*\n\n📱 WhatsApp : +221711202436\n\n✠ *L'Empire ne demande ni permission, ni pardon*`
    }, { quoted: message })
}



export default async function silenceCommand(client, message) {

    const jid = message.key.remoteJid;

    const sender = message.key.participant || jid;

    try {

        if (!jid.endsWith("@g.us")) {

            return client.sendMessage(jid, { text: "❌ *Groupes uniquement*" }, { quoted: message });

        }

        const metadata = await client.groupMetadata(jid);

        const admins = metadata.participants.filter(p => p.admin);

        const isAdmin = admins.some(p => p.id === sender);

        if (!isAdmin) {

            return client.sendMessage(jid, { text: "❌ *Tu dois etre admin*" }, { quoted: message });

        }

        await client.groupSettingUpdate(jid, "announcement");

        const successMessage = 

            "╔════════════╗\n" +

            "  *SILENCE*  \n" +

            "╚════════════╝\n\n" +

            "🔇 *Groupe ferme*\n\n" +

            "📝 *Seuls les admins peuvent parler*\n\n" +

            "> *⚔️ Dev : (꧁⚡𝕹𝖔𝖛𝖆_𝕾𝖆𝖙𝖔𝖒𝖆𝖐𝖎⚡꧂)*\n\n" +

            `\n`;

        await client.sendMessage(jid, { text: successMessage }, { quoted: message });

    } catch (e) {

        console.log(e);

        client.sendMessage(jid, { text: "❌ *Le bot doit etre admin*" }, { quoted: message });

    }

}
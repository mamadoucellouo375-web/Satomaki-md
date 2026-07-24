import axios from 'axios'

const userMails = new Map()

async function createTempMail() {
    // Guerrilla Mail API (gratuit, sans clé)
    const res = await axios.get('https://api.guerrillamail.com/ajax.php?f=get_email_address', {
        timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    return { email: res.data?.email_addr, token: res.data?.sid_token }
}

async function checkMails(token) {
    const res = await axios.get(`https://api.guerrillamail.com/ajax.php?f=check_email&seq=0&sid_token=${token}`, {
        timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    return res.data?.list || []
}

export default async function mailCommand(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const args = text.trim().split(/\s+/)
    const action = args[1]?.toLowerCase()
    const userId = message.key.participant || remoteJid

    if (!action || action === 'create') {
        try {
            await client.sendMessage(remoteJid, { text: '⏳ *Création email temporaire...*' }, { quoted: message })
            const mail = await createTempMail()
            userMails.set(userId, mail)
            await client.sendMessage(remoteJid, {
                text: `📧 *Email Temporaire NOVA REAPER MD*\n\n📬 Adresse : *${mail.email}*\n\n⚠️ Valide 1h. Tape .mail inbox pour voir les messages.\n\n✠ *NOVA REAPER MD*`
            }, { quoted: message })
        } catch {
            await client.sendMessage(remoteJid, { text: '❌ Impossible de créer l\'email.' }, { quoted: message })
        }
        return
    }

    if (action === 'inbox') {
        const mail = userMails.get(userId)
        if (!mail) return client.sendMessage(remoteJid, { text: '❌ Crée d\'abord un email avec .mail create' }, { quoted: message })
        try {
            const mails = await checkMails(mail.token)
            if (!mails.length) return client.sendMessage(remoteJid, { text: `📭 *${mail.email}*\n\nAucun message reçu.\n\n✠ *NOVA REAPER MD*` }, { quoted: message })
            const list = mails.slice(0, 5).map((m, i) => `${i+1}. 📨 *${m.mail_from}*\n   📌 ${m.mail_subject || '(sans objet)'}`).join('\n\n')
            await client.sendMessage(remoteJid, {
                text: `📬 *Boîte : ${mail.email}*\n\n${list}\n\n✠ *NOVA REAPER MD*`
            }, { quoted: message })
        } catch {
            await client.sendMessage(remoteJid, { text: '❌ Impossible de vérifier la boîte.' }, { quoted: message })
        }
        return
    }

    await client.sendMessage(remoteJid, {
        text: `📧 *Mail NOVA REAPER MD*\n\n.mail create — Créer un email\n.mail inbox — Voir les messages\n\n✠ *NOVA REAPER MD*`
    }, { quoted: message })
}

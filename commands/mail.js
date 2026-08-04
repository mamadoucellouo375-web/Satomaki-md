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

async function fetchMailContent(token, emailId) {
    const res = await axios.get(`https://api.guerrillamail.com/ajax.php?f=fetch_email&email_id=${emailId}&sid_token=${token}`, {
        timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    return res.data
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
                text: `📧 *Email Temporaire SATOMAKI-MD*\n\n📬 Adresse : *${mail.email}*\n\n⚠️ Valide 1h. Tape .mail inbox pour voir les messages.\n\n✠ *SATOMAKI-MD*`
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
            mail.messages = mails // on garde la liste pour .mail read <n>
            if (!mails.length) return client.sendMessage(remoteJid, { text: `📭 *${mail.email}*\n\nAucun message reçu.\n\n✠ *SATOMAKI-MD*` }, { quoted: message })
            const list = mails.slice(0, 5).map((m, i) => `${i+1}. 📨 *${m.mail_from}*\n   📌 ${m.mail_subject || '(sans objet)'}\n   → .mail read ${i+1}`).join('\n\n')
            await client.sendMessage(remoteJid, {
                text: `📬 *Boîte : ${mail.email}*\n\n${list}\n\n✠ *SATOMAKI-MD*`
            }, { quoted: message })
        } catch {
            await client.sendMessage(remoteJid, { text: '❌ Impossible de vérifier la boîte.' }, { quoted: message })
        }
        return
    }

    if (action === 'read') {
        const num = parseInt(args[2])
        const mail = userMails.get(userId)
        if (!mail) return client.sendMessage(remoteJid, { text: '❌ Crée d\'abord un email avec .mail create' }, { quoted: message })
        if (isNaN(num) || num < 1) return client.sendMessage(remoteJid, { text: '❌ Usage : .mail read <numéro>\nEx : .mail read 1' }, { quoted: message })

        try {
            if (!mail.messages) mail.messages = await checkMails(mail.token)
            const target = mail.messages[num - 1]
            if (!target) return client.sendMessage(remoteJid, { text: `❌ Message n°${num} introuvable. Refais .mail inbox.` }, { quoted: message })

            const full = await fetchMailContent(mail.token, target.mail_id)
            let content = (full?.mail_body || '(contenu vide)').replace(/<[^>]+>/g, ' ').replace(/\s{3,}/g, '\n\n').trim()
            if (content.length > 1500) content = content.slice(0, 1500) + '...'

            await client.sendMessage(remoteJid, {
                text: `📧 *Message n°${num}*\n\n✉️ De : ${target.mail_from}\n📌 Objet : ${target.mail_subject || '(sans objet)'}\n\n${content}\n\n✠ *SATOMAKI-MD*`
            }, { quoted: message })

            // Détection automatique du code OTP, envoyé à part pour copier d'un tap
            const otpMatch = content.match(/\b\d{4,8}\b/)
            if (otpMatch) {
                await client.sendMessage(remoteJid, { text: `🔐 Code OTP détecté :\n\n${otpMatch[0]}` })
            }
        } catch {
            await client.sendMessage(remoteJid, { text: '❌ Impossible de lire ce message.' }, { quoted: message })
        }
        return
    }

    await client.sendMessage(remoteJid, {
        text: `📧 *Mail SATOMAKI-MD*\n\n.mail create — Créer un email\n.mail inbox — Voir les messages\n.mail read <n> — Lire un message (+ détection OTP)\n\n✠ *SATOMAKI-MD*`
    }, { quoted: message })
}

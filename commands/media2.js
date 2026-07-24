import { card, error, success } from '../utils/design.js'
import axios from 'axios'

export async function gif(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const query = text.trim().split(/\s+/).slice(1).join(' ')
    if (!query) return client.sendMessage(remoteJid, { text: error('Usage : .gif <recherche>') }, { quoted: message })
    try {
        const res = await axios.get('https://tenor.googleapis.com/v2/search', {
            params: { key: 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCY0', q: query, limit: 8, media_filter: 'gif' },
            timeout: 8000
        })
        const results = res.data?.results
        if (!results?.length) return client.sendMessage(remoteJid, { text: error('Aucun GIF trouvé.') }, { quoted: message })
        const chosen = results[Math.floor(Math.random() * results.length)]
        const url = chosen.media_formats?.gif?.url || chosen.media_formats?.tinygif?.url
        if (!url) throw new Error()
        await client.sendMessage(remoteJid, {
            video: { url }, gifPlayback: true,
            caption: `🎞️ *GIF : ${query}*\n✠ *NOVA REAPER MD*`
        }, { quoted: message })
    } catch {
        await client.sendMessage(remoteJid, { text: error('Erreur GIF.') }, { quoted: message })
    }
}

export async function meme(client, message) {
    const remoteJid = message.key.remoteJid
    const memes = [
        'Quand le bot répond plus vite que toi... 💀',
        'Moi qui attends que quelqu\'un dise bonjour pour tag tout le monde 🤡',
        'Le groupe à 3h du matin vs le groupe à 9h du matin 💀',
        'Quand tu lis le message mais tu réponds pas 👀',
        'Le silence dans le groupe après une blague nulle 🦗',
    ]
    await client.sendMessage(remoteJid, {
        text: card('😂 MEME', [memes[Math.floor(Math.random() * memes.length)]])
    }, { quoted: message })
}

export async function fakenews(client, message) {
    const remoteJid = message.key.remoteJid
    const noms = ['Jean Dupont', 'Marie Lambert', 'Ahmed Diallo', 'Sophie Bernard']
    const lieux = ['Paris', 'Dakar', 'Tokyo', 'Londres']
    const events = [
        'découvre que les chats contrôlent internet depuis 2009',
        'prouve que la Tour Eiffel est une antenne WiFi géante',
        'confirme que dormir 12h donne des super pouvoirs',
        'démontre que les boutons d\'ascenseur sont juste décoratifs',
        'révèle que les emojis ont été créés par des extraterrestres',
    ]
    const n = noms[Math.floor(Math.random() * noms.length)]
    const l = lieux[Math.floor(Math.random() * lieux.length)]
    const e = events[Math.floor(Math.random() * events.length)]
    await client.sendMessage(remoteJid, {
        text: card('📰 BREAKING NEWS (FAUSSE)', [
            `🚨 *${n}* de *${l}* ${e} !`,
            '---',
            '⚠️ Ceci est une blague générée par NOVA REAPER MD.',
        ])
    }, { quoted: message })
}

export async function asciiart(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const input = text.trim().split(/\s+/).slice(1).join(' ').toUpperCase().substring(0, 10)
    if (!input) return client.sendMessage(remoteJid, { text: error('Usage : .ascii <texte>') }, { quoted: message })
    const letters = { A:'▄▀█',B:'█▄▄',C:'█▀▀',D:'█▀▄',E:'█▀▀',F:'█▀▀',G:'█▀▀',H:'█ █',I:'█',J:' █',K:'█▄▀',L:'█  ',M:'█▀▄▀█',N:'█▄ █',O:'█▀█',P:'█▀▄',Q:'█▀█',R:'█▀▄',S:'█▀▀',T:'▀█▀',U:'█ █',V:'█ █',W:'█ █ █',X:'▀▄▀',Y:'█▄█',Z:'▀▀█' }
    const result = input.split('').map(c => letters[c] || c).join('  ')
    await client.sendMessage(remoteJid, {
        text: card('🎨 ASCII ART', [`\`\`\`${result}\`\`\``])
    }, { quoted: message })
}

export async function shadow(client, message) {
    const remoteJid = message.key.remoteJid
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const txt = quoted?.conversation || quoted?.extendedTextMessage?.text || ''
    if (!txt) return client.sendMessage(remoteJid, { text: error('Réponds à un message.') }, { quoted: message })
    const styles = [`≪ ${txt} ≫`, `【 ${txt} 】`, `⟦ ${txt} ⟧`, `✦ ${txt} ✦`, `꧁ ${txt} ꧂`]
    await client.sendMessage(remoteJid, { text: styles[Math.floor(Math.random() * styles.length)] }, { quoted: message })
}

export async function countdown(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const seconds = Math.min(parseInt(text.trim().split(/\s+/)[1]) || 10, 30)
    for (let i = seconds; i >= 0; i--) {
        await client.sendMessage(remoteJid, {
            text: i === 0
                ? card('🔔 TEMPS ÉCOULÉ !', ['Le compte à rebours est terminé.'])
                : card('⏳ COMPTE À REBOURS', [`*${i}* seconde${i > 1 ? 's' : ''} restante${i > 1 ? 's' : ''}`])
        }, { quoted: message })
        if (i > 0) await new Promise(r => setTimeout(r, 1000))
    }
}

export async function tirage(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us')) return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
    try {
        const meta = await client.groupMetadata(remoteJid)
        const members = meta.participants.filter(p => !p.admin)
        if (!members.length) return client.sendMessage(remoteJid, { text: error('Pas assez de membres.') }, { quoted: message })
        const winner = members[Math.floor(Math.random() * members.length)]
        await client.sendMessage(remoteJid, {
            text: card('🎰 TIRAGE AU SORT', [
                'Et le gagnant est...',
                '---',
                `👑 @${winner.id.split('@')[0]} 👑`,
                '---',
                '🎉 Félicitations !',
            ]),
            mentions: [winner.id]
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

export async function sondage(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const parts = text.trim().split(/\s+/).slice(1).join(' ').split('|').map(s => s.trim())
    const question = parts[0]
    const options = parts.slice(1)
    if (!question || options.length < 2) {
        return client.sendMessage(remoteJid, { text: error('Usage : .sondage <question> | <op1> | <op2>') }, { quoted: message })
    }
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣']
    await client.sendMessage(remoteJid, {
        text: card('📊 SONDAGE', [
            `❓ *${question}*`,
            '---',
            ...options.slice(0, 6).map((o, i) => `${emojis[i]} ${o}`),
            '---',
            'Votez avec les émojis !',
        ])
    }, { quoted: message })
}

export async function tournoi(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const participants = text.trim().split(/\s+/).slice(1)
    if (participants.length < 2) return client.sendMessage(remoteJid, { text: error('Usage : .tournoi nom1 nom2 nom3...') }, { quoted: message })
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    let round = 1, current = shuffled
    const lines = []
    while (current.length > 1) {
        lines.push(`# Round ${round}`)
        const next = []
        for (let i = 0; i < current.length; i += 2) {
            if (i + 1 < current.length) {
                const w = Math.random() < 0.5 ? current[i] : current[i+1]
                lines.push(`${current[i]} ⚔️ ${current[i+1]} → *${w}*`)
                next.push(w)
            } else {
                lines.push(`${current[i]} → *${current[i]}* (exemption)`)
                next.push(current[i])
            }
        }
        current = next
        round++
    }
    lines.push('---', `🏆 VAINQUEUR : *${current[0]}*`)
    await client.sendMessage(remoteJid, { text: card('🏆 TOURNOI', lines) }, { quoted: message })
}

const agendas = new Map()
export async function agenda(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const args = text.trim().split(/\s+/).slice(1)
    const action = args[0]?.toLowerCase()
    const items = agendas.get(remoteJid) || []

    if (!action || action === 'voir') {
        if (!items.length) return client.sendMessage(remoteJid, { text: card('📅 AGENDA', ['Aucune entrée. Utilisez .agenda ajouter <note>']) }, { quoted: message })
        return client.sendMessage(remoteJid, {
            text: card('📅 AGENDA', items.map((item, i) => `${i+1}. *${item.date}* — ${item.note}`))
        }, { quoted: message })
    }
    if (action === 'ajouter') {
        const note = args.slice(1).join(' ')
        if (!note) return client.sendMessage(remoteJid, { text: error('Usage : .agenda ajouter <note>') }, { quoted: message })
        items.push({ date: new Date().toLocaleDateString('fr-FR'), note })
        agendas.set(remoteJid, items)
        return client.sendMessage(remoteJid, { text: success('Ajouté à l\'agenda !') }, { quoted: message })
    }
    if (action === 'supprimer') {
        const idx = parseInt(args[1]) - 1
        if (idx < 0 || idx >= items.length) return client.sendMessage(remoteJid, { text: error('Numéro invalide.') }, { quoted: message })
        items.splice(idx, 1)
        agendas.set(remoteJid, items)
        return client.sendMessage(remoteJid, { text: success('Supprimé de l\'agenda.') }, { quoted: message })
    }
    await client.sendMessage(remoteJid, { text: error('Actions : voir | ajouter <note> | supprimer <n°>') }, { quoted: message })
}

export default { gif, meme, fakenews, asciiart, shadow, countdown, tirage, sondage, tournoi, agenda }

import { card, error } from '../utils/design.js'
import axios from 'axios'

export async function eightball(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const question = text.trim().split(/\s+/).slice(1).join(' ')
    const reponses = [
        '✅ Oui, absolument !', '✅ C\'est certain.', '✅ Sans aucun doute.',
        '✅ Oui, définitivement.', '⚠️ Réessaie plus tard.',
        '⚠️ Je ne peux pas te dire maintenant.', '⚠️ Concentre-toi et redemande.',
        '❌ Ma réponse est non.', '❌ Mes sources disent non.', '❌ Sûrement pas.'
    ]
    const r = reponses[Math.floor(Math.random() * reponses.length)]
    await client.sendMessage(remoteJid, {
        text: card('🎱 8BALL', [
            `Question : *${question || '???'}*`,
            '---',
            `Réponse  : ${r}`,
        ])
    }, { quoted: message })
}

export async function horoscope(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const signe = text.trim().split(/\s+/).slice(1).join(' ') || 'Inconnu'
    const conseils = [
        'Les astres te sourient aujourd\'hui. Fonce !',
        'Méfie-toi des fausses promesses. Reste vigilant.',
        'Une belle surprise t\'attend. Garde espoir.',
        'C\'est le moment d\'agir. N\'hésite plus.',
        'La patience sera ta meilleure alliée.',
        'Une rencontre importante va changer les choses.',
        'Prends soin de ta santé. Repose-toi.',
        'Ta chance est au maximum. Saisis les opportunités.',
    ]
    const stars = n => '⭐'.repeat(n) + '☆'.repeat(5 - n)
    await client.sendMessage(remoteJid, {
        text: card(`🌟 HOROSCOPE — ${signe.toUpperCase()}`, [
            conseils[Math.floor(Math.random() * conseils.length)],
            '---',
            `Chance   : ${stars(Math.floor(Math.random()*3)+3)}`,
            `Amour    : ${stars(Math.floor(Math.random()*3)+2)}`,
            `Travail  : ${stars(Math.floor(Math.random()*3)+3)}`,
            `Énergie  : ${stars(Math.floor(Math.random()*3)+2)}`,
        ])
    }, { quoted: message })
}

export async function blague(client, message) {
    const remoteJid = message.key.remoteJid
    const blagues = [
        { q: 'Pourquoi les plongeurs plongent-ils toujours en arrière ?', r: 'Parce que sinon ils tomberaient dans le bateau !' },
        { q: 'Qu\'est-ce qu\'un canif ?', r: 'Un petit fien !' },
        { q: 'Pourquoi les gorilles ont de grandes narines ?', r: 'Parce qu\'ils ont de grands doigts !' },
        { q: 'Qu\'est-ce qu\'un chat tombé dans de la peinture ?', r: 'Un chat-peint !' },
        { q: 'Comment appelle-t-on un chien sans pattes ?', r: 'Peu importe, il viendra pas quand même !' },
        { q: 'Pourquoi l\'épouvantail a eu un prix ?', r: 'Parce qu\'il était exceptionnel dans son domaine !' },
    ]
    const b = blagues[Math.floor(Math.random() * blagues.length)]
    await client.sendMessage(remoteJid, {
        text: card('😂 BLAGUE DU JOUR', [
            `❓ ${b.q}`,
            '---',
            `💡 ${b.r}`,
        ])
    }, { quoted: message })
}

export async function compliment(client, message) {
    const remoteJid = message.key.remoteJid
    const target = message.message?.extendedTextMessage?.contextInfo?.participant
    const compliments = [
        'Tu es quelqu\'un d\'exceptionnel et tout le monde le remarque. ✨',
        'Ton sourire illumine chaque pièce où tu entres. 😊',
        'Tu as une intelligence rare et une âme magnifique. 💫',
        'Le monde est meilleur grâce à ta présence. 🌟',
        'Tu inspires les gens autour de toi sans même t\'en rendre compte. 🦋',
        'Tu mérites tout le bonheur du monde. 🌈',
    ]
    const c = compliments[Math.floor(Math.random() * compliments.length)]
    await client.sendMessage(remoteJid, {
        text: card('💝 COMPLIMENT', [
            target ? `Pour @${target.split('@')[0]}` : 'Pour toi ✨',
            '---',
            c,
        ]),
        mentions: target ? [target] : []
    }, { quoted: message })
}

export async function punchline(client, message) {
    const remoteJid = message.key.remoteJid
    const punchlines = [
        'Tu es la preuve vivante que les miracles n\'existent pas.',
        'Si la bêtise faisait du bruit, tu serais un concert.',
        'T\'as le QI d\'une plante, mais sans la photosynthèse.',
        'Même ton ombre essaie de te fuir.',
        'T\'as le charisme d\'une chaise en plastique mouillée.',
        'Si t\'étais une épice, tu serais de la farine.',
    ]
    const p = punchlines[Math.floor(Math.random() * punchlines.length)]
    await client.sendMessage(remoteJid, {
        text: card('💀 PUNCHLINE', [p, '---', '✠ _L\'Empire ne pardonne pas_'])
    }, { quoted: message })
}

export async function dice(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const args = text.trim().split(/\s+/)
    const faces = parseInt(args[1]) || 6
    const nb = Math.min(parseInt(args[2]) || 1, 10)
    const results = Array.from({ length: nb }, () => Math.floor(Math.random() * faces) + 1)
    await client.sendMessage(remoteJid, {
        text: card('🎲 DÉ', [
            `Dé à *${faces}* faces × *${nb}*`,
            `Résultats : *${results.join(', ')}*`,
            `Total     : *${results.reduce((a, b) => a + b, 0)}*`,
        ])
    }, { quoted: message })
}

export async function pof(client, message) {
    const remoteJid = message.key.remoteJid
    const r = Math.random() < 0.5 ? '🪙 PILE' : '🪙 FACE'
    await client.sendMessage(remoteJid, {
        text: card('🪙 PILE OU FACE', [`Résultat : *${r}*`])
    }, { quoted: message })
}

export async function wordcount(client, message) {
    const remoteJid = message.key.remoteJid
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const txt = quoted?.conversation || quoted?.extendedTextMessage?.text || ''
    if (!txt) return client.sendMessage(remoteJid, { text: error('Réponds à un message texte.') }, { quoted: message })
    await client.sendMessage(remoteJid, {
        text: card('📊 COMPTEUR', [
            `Mots         : *${txt.trim().split(/\s+/).length}*`,
            `Caractères   : *${txt.length}*`,
            `Sans espaces : *${txt.replace(/\s/g, '').length}*`,
        ])
    }, { quoted: message })
}

export async function inspire(client, message) {
    const remoteJid = message.key.remoteJid
    const quotes = [
        { q: 'Le succès, c\'est tomber sept fois et se relever huit.', a: 'Proverbe japonais' },
        { q: 'Celui qui déplace les montagnes commence par enlever les petites pierres.', a: 'Confucius' },
        { q: 'La plus grande gloire n\'est pas de ne jamais tomber, mais de se relever à chaque chute.', a: 'Nelson Mandela' },
        { q: 'N\'attendez pas. Le bon moment n\'arrivera jamais.', a: 'Napoleon Hill' },
        { q: 'Votre temps est limité, ne le gâchez pas en vivant la vie de quelqu\'un d\'autre.', a: 'Steve Jobs' },
    ]
    const q = quotes[Math.floor(Math.random() * quotes.length)]
    await client.sendMessage(remoteJid, {
        text: card('✨ CITATION INSPIRANTE', [`"${q.q}"`, '---', `— *${q.a}*`])
    }, { quoted: message })
}

export async function calc(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const expr = text.slice(text.indexOf(' ') + 1).trim()
    if (!expr) return client.sendMessage(remoteJid, { text: error('Usage : .calc 2+2') }, { quoted: message })
    try {
        const safe = expr.replace(/[^0-9+\-*/().\s%]/g, '')
        const result = Function(`"use strict"; return (${safe})`)()
        await client.sendMessage(remoteJid, {
            text: card('🧮 CALCUL', [`*${expr}* = *${result}*`])
        }, { quoted: message })
    } catch {
        await client.sendMessage(remoteJid, { text: error('Expression invalide.') }, { quoted: message })
    }
}

export async function meteo(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const ville = text.trim().split(/\s+/).slice(1).join(' ') || 'Dakar'
    const temps = ['☀️ Ensoleillé', '⛅ Nuageux', '🌧️ Pluvieux', '⛈️ Orageux', '🌤️ Partiellement nuageux']
    const t = temps[Math.floor(Math.random() * temps.length)]
    const temp = Math.floor(Math.random() * 20) + 18
    await client.sendMessage(remoteJid, {
        text: card(`🌍 MÉTÉO — ${ville.toUpperCase()}`, [
            `Temps     : *${t}*`,
            `Temp.     : *${temp}°C*`,
            `Humidité  : *${Math.floor(Math.random()*40)+40}%*`,
            `Vent      : *${Math.floor(Math.random()*30)+5} km/h*`,
        ])
    }, { quoted: message })
}

export async function poeme(client, message) {
    const remoteJid = message.key.remoteJid
    const poemes = [
        { p: 'Les sanglots longs\nDes violons\nDe l\'automne\nBlessent mon cœur\nD\'une langueur\nMonotone.', a: 'Paul Verlaine' },
        { p: 'Demain, dès l\'aube, à l\'heure où blanchit la campagne,\nJe partirai. Vois-tu, je sais que tu m\'attends.\nJ\'irai par la forêt, j\'irai par la montagne.\nJe ne puis demeurer loin de toi plus longtemps.', a: 'Victor Hugo' },
    ]
    const p = poemes[Math.floor(Math.random() * poemes.length)]
    await client.sendMessage(remoteJid, {
        text: card('📜 POÈME', [p.p, '---', `— *${p.a}*`])
    }, { quoted: message })
}

export async function anagramme(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const mot = text.trim().split(/\s+/).slice(1).join('')
    if (!mot) return client.sendMessage(remoteJid, { text: error('Usage : .anagramme <mot>') }, { quoted: message })
    const melange = mot.split('').sort(() => Math.random() - 0.5).join('')
    await client.sendMessage(remoteJid, {
        text: card('🔀 ANAGRAMME', [`Original : *${mot}*`, `Mélangé  : *${melange}*`])
    }, { quoted: message })
}

export async function cesar(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const args = text.trim().split(/\s+/)
    const dec = parseInt(args[1]) || 3
    const msg = args.slice(2).join(' ')
    if (!msg) return client.sendMessage(remoteJid, { text: error('Usage : .cesar <décalage> <message>') }, { quoted: message })
    const result = msg.split('').map(c => {
        if (c.match(/[a-zA-Z]/)) {
            const base = c <= 'Z' ? 65 : 97
            return String.fromCharCode(((c.charCodeAt(0) - base + dec) % 26) + base)
        }
        return c
    }).join('')
    await client.sendMessage(remoteJid, {
        text: card('🔐 CÉSAR', [`Original : *${msg}*`, `Décalage : *${dec}*`, `Chiffré  : *${result}*`])
    }, { quoted: message })
}

export async function random(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const args = text.trim().split(/\s+/)
    const min = parseInt(args[1]) || 1
    const max = parseInt(args[2]) || 100
    const r = Math.floor(Math.random() * (max - min + 1)) + min
    await client.sendMessage(remoteJid, {
        text: card('🎰 ALÉATOIRE', [`Entre *${min}* et *${max}*`, `Résultat : *${r}*`])
    }, { quoted: message })
}

export async function binaire(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const input = text.trim().split(/\s+/).slice(1).join(' ')
    if (!input) return client.sendMessage(remoteJid, { text: error('Usage : .binaire <texte ou binaire>') }, { quoted: message })
    let result
    if (/^[01\s]+$/.test(input)) {
        result = `Texte : *${input.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('')}*`
    } else {
        result = `Binaire : *${input.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')}*`
    }
    await client.sendMessage(remoteJid, {
        text: card('💻 BINAIRE', [`Entrée : ${input}`, result])
    }, { quoted: message })
}

export async function morse(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const input = text.trim().split(/\s+/).slice(1).join(' ').toUpperCase()
    if (!input) return client.sendMessage(remoteJid, { text: error('Usage : .morse <texte>') }, { quoted: message })
    const table = { A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..' }
    const result = input.split('').map(c => c === ' ' ? '/' : (table[c] || c)).join(' ')
    await client.sendMessage(remoteJid, {
        text: card('📻 MORSE', [`Texte : *${input}*`, `Code  : *${result}*`])
    }, { quoted: message })
}

export async function choisir(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const choix = text.trim().split(/\s+/).slice(1).join(' ').split(',').map(c => c.trim()).filter(Boolean)
    if (choix.length < 2) return client.sendMessage(remoteJid, { text: error('Usage : .choisir option1, option2, option3') }, { quoted: message })
    const r = choix[Math.floor(Math.random() * choix.length)]
    await client.sendMessage(remoteJid, {
        text: card('🎯 CHOIX', [
            `Options  : ${choix.map(c => `*${c}*`).join(', ')}`,
            '---',
            `Réponse  : *${r}* ✅`,
        ])
    }, { quoted: message })
}

export async function ipinfo(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const ip = text.trim().split(/\s+/)[1]
    if (!ip) return client.sendMessage(remoteJid, { text: error('Usage : .ip <adresse IP>') }, { quoted: message })
    try {
        const res = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 8000 })
        const d = res.data
        if (!d.ip) throw new Error('IP invalide')
        await client.sendMessage(remoteJid, {
            text: card('🌐 IP INFO', [
                `IP      : *${d.ip}*`,
                `Pays    : *${d.country_name}*`,
                `Ville   : *${d.city}*`,
                `Région  : *${d.region}*`,
                `Fuseau  : *${d.timezone}*`,
                `FAI     : *${d.org}*`,
            ])
        }, { quoted: message })
    } catch {
        await client.sendMessage(remoteJid, { text: error('IP invalide ou service indisponible.') }, { quoted: message })
    }
}

export async function heure(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const zone = text.trim().split(/\s+/).slice(1).join('/') || 'Africa/Dakar'
    try {
        const now = new Date().toLocaleString('fr-FR', { timeZone: zone, dateStyle: 'full', timeStyle: 'medium' })
        await client.sendMessage(remoteJid, {
            text: card('🕐 HEURE', [`Zone : *${zone}*`, `📅 ${now}`])
        }, { quoted: message })
    } catch {
        await client.sendMessage(remoteJid, { text: error('Fuseau invalide. Ex: Africa/Dakar, Europe/Paris') }, { quoted: message })
    }
}

export async function inverser(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const input = text.trim().split(/\s+/).slice(1).join(' ')
    if (!input) return client.sendMessage(remoteJid, { text: error('Usage : .inverser <texte>') }, { quoted: message })
    await client.sendMessage(remoteJid, {
        text: card('🔄 INVERSER', [`Original : *${input}*`, `Inversé  : *${input.split('').reverse().join('')}*`])
    }, { quoted: message })
}

export default {
    eightball, horoscope, blague, compliment, punchline,
    dice, pof, wordcount, inspire, calc, meteo, poeme,
    anagramme, cesar, random, binaire, morse, choisir,
    ipinfo, heure, inverser
}

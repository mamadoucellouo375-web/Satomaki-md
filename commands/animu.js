// commands/animu.js - Réactions anime (hug, pat, kiss, cry...) via some-random-api.com
import axios from 'axios'
import { card, error } from '../utils/design.js'

const BASE = 'https://api.some-random-api.com/animu'
const SUPPORTED = ['nom', 'poke', 'cry', 'kiss', 'pat', 'hug', 'wink', 'face-palm', 'quote']

function normalize(input) {
    const l = (input || '').toLowerCase()
    if (l === 'facepalm' || l === 'face_palm') return 'face-palm'
    if (['quote', 'animu-quote', 'animuquote'].includes(l)) return 'quote'
    return l
}

export default async function animu(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const sub = normalize(text.trim().split(/\s+/)[1])

    if (!sub) {
        return client.sendMessage(remoteJid, {
            text: card('ANIMU', [`Usage : .animu <type>`, `Types : ${SUPPORTED.join(', ')}`])
        }, { quoted: message })
    }

    if (!SUPPORTED.includes(sub)) {
        return client.sendMessage(remoteJid, { text: error(`Type inconnu. Types : ${SUPPORTED.join(', ')}`) }, { quoted: message })
    }

    try {
        const { data } = await axios.get(`${BASE}/${sub}`, { timeout: 15000 })

        if (data.quote) {
            return client.sendMessage(remoteJid, { text: card('ANIMU QUOTE', [data.quote]) }, { quoted: message })
        }

        if (data.link) {
            const isGif = data.link.toLowerCase().endsWith('.gif')
            if (isGif) {
                await client.sendMessage(remoteJid, {
                    video: { url: data.link }, gifPlayback: true, caption: sub
                }, { quoted: message })
            } else {
                await client.sendMessage(remoteJid, { image: { url: data.link }, caption: sub }, { quoted: message })
            }
            return
        }

        return client.sendMessage(remoteJid, { text: error('Rien reçu de l\'API, réessaie.') }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

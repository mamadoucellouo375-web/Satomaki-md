// commands/poll.js - Créer un sondage natif WhatsApp (adapté de QUEEN-LORA)
import { card, error } from '../utils/design.js'

export default async function poll(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const body = text.trim().split(/\s+/).slice(1).join(' ')

    const [question, optionsString] = body.split(';')

    if (!question || !optionsString) {
        return client.sendMessage(remoteJid, {
            text: card('SONDAGE', [
                'Usage : .poll question;option1,option2,option3',
                'Ex : .poll Meilleur anime ?;JJK,Bleach,One Piece'
            ])
        }, { quoted: message })
    }

    const options = optionsString.split(',').map(o => o.trim()).filter(Boolean)

    if (options.length < 2) {
        return client.sendMessage(remoteJid, { text: error('Il faut au moins 2 options, séparées par des virgules.') }, { quoted: message })
    }

    try {
        await client.sendMessage(remoteJid, {
            poll: {
                name: question.trim(),
                values: options,
                selectableCount: 1
            }
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

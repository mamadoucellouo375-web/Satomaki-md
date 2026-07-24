// protection.js - Commandes de contrôle des protections avancées
import { card, success, error } from '../utils/design.js'
import prot from '../utils/protections.js'
import configmanager from '../utils/configmanager.js'

function makeToggle(feature, label, extra = '') {
    return async function(client, message) {
        const remoteJid = message.key.remoteJid
        if (!remoteJid.includes('@g.us')) {
            return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
        }
        const text   = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
        const action = text.trim().split(/\s+/).slice(1)[0]?.toLowerCase()

        if (action === 'on') {
            prot.toggle(feature, remoteJid, true)
            await client.sendMessage(remoteJid, { text: success(`${label} *activé*.${extra}`) }, { quoted: message })
        } else if (action === 'off') {
            prot.toggle(feature, remoteJid, false)
            await client.sendMessage(remoteJid, { text: success(`${label} *désactivé*.`) }, { quoted: message })
        } else {
            const state = prot.isEnabled(feature, remoteJid) ? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ❌'
            await client.sendMessage(remoteJid, {
                text: card(label.toUpperCase(), [`État : ${state}`, '---', `Usage : .${feature} on/off`])
            }, { quoted: message })
        }
    }
}

export const antinsfw    = makeToggle('antinsfw',    'Anti-NSFW',    ' Contenus adultes supprimés.')
export const antibot     = makeToggle('antibot',     'Anti-Bot',     ' Bots détectés expulsés.')
export const antisticker = makeToggle('antisticker', 'Anti-Sticker', ' Max 3 stickers / 10s.')

export async function antiword(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us')) {
        return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
    }
    const text   = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const args   = text.trim().split(/\s+/).slice(1)
    const action = args[0]?.toLowerCase()

    if (action === 'on') {
        prot.toggle('antiword', remoteJid, true)
        return client.sendMessage(remoteJid, { text: success('Anti-mot *activé*.') }, { quoted: message })
    }
    if (action === 'off') {
        prot.toggle('antiword', remoteJid, false)
        return client.sendMessage(remoteJid, { text: success('Anti-mot *désactivé*.') }, { quoted: message })
    }
    if (action === 'add') {
        const word = args.slice(1).join(' ').toLowerCase().trim()
        if (!word) return client.sendMessage(remoteJid, { text: error('Usage : .antiword add <mot>') }, { quoted: message })
        const list = prot.getBadWords(remoteJid)
        if (!list.includes(word)) list.push(word)
        prot.setBadWords(remoteJid, list)
        return client.sendMessage(remoteJid, { text: success(`Mot "*${word}*" ajouté à la liste noire.`) }, { quoted: message })
    }
    if (action === 'remove' || action === 'del') {
        const word = args.slice(1).join(' ').toLowerCase().trim()
        prot.setBadWords(remoteJid, prot.getBadWords(remoteJid).filter(w => w !== word))
        return client.sendMessage(remoteJid, { text: success(`Mot "*${word}*" retiré.`) }, { quoted: message })
    }
    if (action === 'list') {
        const list = prot.getBadWords(remoteJid)
        return client.sendMessage(remoteJid, {
            text: card('MOTS INTERDITS', list.length ? list.map((w, i) => `${i+1}. ${w}`) : ['Aucune liste configurée.'])
        }, { quoted: message })
    }
    if (action === 'clear') {
        prot.setBadWords(remoteJid, [])
        return client.sendMessage(remoteJid, { text: success('Liste noire vidée.') }, { quoted: message })
    }

    await client.sendMessage(remoteJid, {
        text: card('ANTI-MOT', [
            `État   : ${prot.isEnabled('antiword', remoteJid) ? 'ACTIVÉ ✅' : 'DÉSACTIVÉ ❌'}`,
            '---',
            '.antiword on/off',
            '.antiword add <mot>',
            '.antiword remove <mot>',
            '.antiword list',
            '.antiword clear',
        ])
    }, { quoted: message })
}

export async function protections(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us')) {
        return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
    }

    const cfg = configmanager.config
    const check = (key) => {
        const store = cfg[`${key}Groups`] || cfg[key] || {}
        return !!(store[remoteJid]) ? '✅' : '❌'
    }

    await client.sendMessage(remoteJid, {
        text: card('ÉTAT DES PROTECTIONS', [
            `Anti-Lien    : ${check('antilink')}`,
            `Anti-Flood   : ${check('antiflood')}`,
            `Anti-Delete  : ${check('antidelete')}`,
            `Anti-NSFW    : ${check('antinsfw')}`,
            `Anti-Mot     : ${check('antiword')}`,
            `Anti-Bot     : ${check('antibot')}`,
            `Anti-Sticker : ${check('antisticker')}`,
        ])
    }, { quoted: message })
}

export default { antinsfw, antibot, antisticker, antiword, protections }

import { card, success, error } from '../utils/design.js'
import configmanager from '../utils/configmanager.js'

export async function setprefix(message, client) {
    const remoteJid = message.key.remoteJid
    const number = client.user.id.split(':')[0]
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const newPrefix = text.trim().split(/\s+/).slice(1)[0]
    if (!newPrefix) return client.sendMessage(remoteJid, { text: error('Usage : .setprefix <nouveau préfixe>') }, { quoted: message })
    if (!configmanager.config.users[number]) return
    configmanager.config.users[number].prefix = newPrefix
    configmanager.save()
    await client.sendMessage(remoteJid, {
        text: card('⚙️ PRÉFIXE', [`Nouveau préfixe : *${newPrefix}*`, 'Changement appliqué ✅'])
    }, { quoted: message })
}

export async function setwelcome(message, client) {
    const remoteJid = message.key.remoteJid
    const number = client.user.id.split(':')[0]
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const action = text.trim().split(/\s+/).slice(1).join(' ').toLowerCase()
    if (!configmanager.config.users[number]) return
    if (action.includes('on')) {
        configmanager.config.users[number].welcome = true
        configmanager.save()
        await client.sendMessage(remoteJid, { text: success('Welcome *activé* !') }, { quoted: message })
    } else if (action.includes('off')) {
        configmanager.config.users[number].welcome = false
        configmanager.save()
        await client.sendMessage(remoteJid, { text: success('Welcome *désactivé*.') }, { quoted: message })
    } else {
        await client.sendMessage(remoteJid, { text: error('Usage : .welcome on/off') }, { quoted: message })
    }
}

export async function setautorecord(message, client) {
    const remoteJid = message.key.remoteJid
    const number = client.user.id.split(':')[0]
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const action = text.trim().split(/\s+/).slice(1).join(' ').toLowerCase()
    if (!configmanager.config.users[number]) return
    const on = action.includes('on')
    configmanager.config.users[number].record = on
    configmanager.save()
    await client.sendMessage(remoteJid, {
        text: success(`Auto-record *${on ? 'activé' : 'désactivé'}*.`)
    }, { quoted: message })
}

export async function setautotype(message, client) {
    const remoteJid = message.key.remoteJid
    const number = client.user.id.split(':')[0]
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const action = text.trim().split(/\s+/).slice(1).join(' ').toLowerCase()
    if (!configmanager.config.users[number]) return
    const on = action.includes('on')
    configmanager.config.users[number].type = on
    configmanager.save()
    await client.sendMessage(remoteJid, {
        text: success(`Auto-type *${on ? 'activé' : 'désactivé'}*.`)
    }, { quoted: message })
}

export async function isPublic(message, client) {
    const remoteJid = message.key.remoteJid
    const number = client.user.id.split(':')[0]
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const cmd = text.trim().split(/\s+/)[0].replace(/[^a-z]/gi, '').toLowerCase()
    if (!configmanager.config.users[number]) return
    const pub = cmd === 'public'
    configmanager.config.users[number].publicMode = pub
    configmanager.save()
    await client.sendMessage(remoteJid, {
        text: card(pub ? '🌐 MODE PUBLIC' : '🕶️ MODE PRIVÉ', [
            pub
                ? 'Tout le monde peut utiliser le bot.'
                : 'Seuls les sudos peuvent utiliser le bot.',
            `Statut : *${pub ? 'Public' : 'Privé'}* ${pub ? '🌐' : '🔒'}`
        ])
    }, { quoted: message })
}

export default { setprefix, setwelcome, setautorecord, setautotype, isPublic }

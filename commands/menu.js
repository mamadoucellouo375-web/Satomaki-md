import configmanager from "../utils/configmanager.js"
import darkMenu from '../menus/dark.js'
import majesticMenu from '../menus/majestic.js'
import bleachMenu from '../menus/bleach.js'
import techMenu from '../menus/tech.js'
import uniqueMenu from '../menus/unique.js'
import elegantMenu from '../menus/elegant.js'
import gothicMenu from '../menus/gothic.js'
import minimalMenu from '../menus/minimal.js'
import matrixMenu from '../menus/matrix.js'
import classicMenu from '../menus/classic.js'
import prestigeMenu from '../menus/prestige.js'
import professionalMenu from '../menus/professional.js'

const STYLES = {
    dark: { fn: darkMenu, label: 'Dark (têtes de mort)' },
    majestic: { fn: majesticMenu, label: 'Majestueux (royal)' },
    bleach: { fn: bleachMenu, label: 'Bleach (Soul Society)' },
    tech: { fn: techMenu, label: 'Tech (terminal)' },
    unique: { fn: uniqueMenu, label: 'Unique (signature)' },
    elegant: { fn: elegantMenu, label: 'Élégant (calligraphique)' },
    gothic: { fn: gothicMenu, label: 'Gothic (vampirique)' },
    minimal: { fn: minimalMenu, label: 'Minimal (épuré)' },
    matrix: { fn: matrixMenu, label: 'Matrix (cyberpunk)' },
    classic: { fn: classicMenu, label: 'Classic (original Empire)' },
    prestige: { fn: prestigeMenu, label: 'Prestige (élégant-gothique)' },
    professional: { fn: professionalMenu, label: 'Professional (dashboard corporate)' },
}

export default async function info(client, message) {
    try {
        const remoteJid = message.key.remoteJid
        const botId = client.user.id.split(':')[0]
        const cfg = configmanager.config.users?.[botId]
        const prefix = cfg?.prefix || '.'
        const mode = cfg?.publicMode ? 'PUBLIC' : 'PRIVÉ'
        const owner = 'Nova_Satomaki'

        const styleKey = configmanager.config.menuStyle || 'unique'
        const style = STYLES[styleKey] || STYLES.unique

        const menuText = style.fn(prefix, owner, mode, process.uptime())

        try {
            await client.sendMessage(remoteJid, {
                image: { url: 'database/menu.jpg' },
                caption: menuText
            }, { quoted: message })
        } catch {
            await client.sendMessage(remoteJid, { text: menuText }, { quoted: message })
        }

        const audioPath = cfg?.tagAudioPath || 'database/DigiX.mp3'
        try {
            await client.sendMessage(remoteJid, {
                audio: { url: audioPath },
                mimetype: 'audio/mpeg',
                ptt: false
            })
        } catch (e) {
            console.error('Erreur audio menu:', e?.message)
        }
    } catch (err) {
        console.error('Erreur menu:', err)
    }
}

export async function setmenu(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const choice = text.trim().split(/\s+/)[1]?.toLowerCase()

    if (!choice || !STYLES[choice]) {
        const list = Object.entries(STYLES).map(([k, v]) => `   ${k} — ${v.label}`).join('\n')
        return client.sendMessage(remoteJid, {
            text: `┏━━━━━━━━━━━━━━━━━━━━━━┓\n┃  STYLES DE MENU\n┗━━━━━━━━━━━━━━━━━━━━━━┛\n${list}\n\n   Usage : .setmenu <style>`
        }, { quoted: message })
    }

    configmanager.config.menuStyle = choice
    configmanager.save()

    await client.sendMessage(remoteJid, {
        text: `┏━━━━━━━━━━━━━━━━━━━━━━┓\n┃  SUCCÈS\n┗━━━━━━━━━━━━━━━━━━━━━━┛\n   Style de menu changé : *${STYLES[choice].label}*\n   Tape .menu pour voir le résultat.`
    }, { quoted: message })
}

// design.js - Système de design SATOMAKI-MD

export const S = {
    crown: '👑', sword: '⚔️', cross: '✠',
    empire: '𝐒̸𝐀̸𝐓̸𝐎̸𝐌̸𝐀̸𝐊̸𝐈̸-𝙼𝘿',
}

const BAR    = '✠▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬✠'
const SIGN   = '『 𝐒𝐀𝐓𝐎𝐌𝐀𝐊𝐈-𝐌𝐃 』'

function frame(icon, title, body, footer = '') {
    return `${BAR}\n   ${icon}  ${title}\n${BAR}\n\n${body}${footer ? `\n\n${footer}` : ''}\n\n${SIGN}`
}

// ─── Carte de réponse principale ──────────────────────────────
export function card(title, lines, footer = null) {
    const body = lines.map(l => {
        if (l === '---') return '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈'
        if (l.startsWith('#')) return `\n➤ ${l.slice(1).trim()}`
        return `✦ ${l}`
    }).join('\n')
    return frame('⚔️', title, body, footer)
}

// ─── Succès ──────────────────────────────────────────────────
export function success(msg) {
    return frame('✅', 'SUCCÈS', `✦ ${msg}`)
}

// ─── Erreur ──────────────────────────────────────────────────
export function error(msg) {
    return frame('⛔', 'ERREUR', `✦ ${msg}`)
}

// ─── Info générique ────────────────────────────────────────────
export function info(title, msg) {
    return frame('📜', title, `✦ ${msg}`)
}

// ─── Usage ───────────────────────────────────────────────────
export function usage(cmd, desc, exemple = null) {
    let body = `✦ Commande : ${cmd}\n✦ Info     : ${desc}`
    if (exemple) body += `\n✦ Exemple  : ${exemple}`
    return frame('❔', 'USAGE', body)
}

export const FOOTER = `\n\n${SIGN}`

// ─── Loader ──────────────────────────────────────────────────
export function loading(msg) {
    return frame('⏳', 'PATIENTE', `✦ ${msg}...`)
}

export default { S, card, success, error, info, usage, loading, FOOTER }


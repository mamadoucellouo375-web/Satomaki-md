// design.js - Système de design SATOMAKI-MD
// Note : WhatsApp ne supporte pas les couleurs de texte (seulement gras/italique/
// barré/monospace). La "couleur" ici vient d'une palette d'emojis cohérente par
// catégorie + du gras WhatsApp, pour un rendu aussi riche que possible.
import stylize from './fancy.js'

export const S = {
    crown: '👑', sword: '⚔️', cross: '✠',
}

const TOP    = '⏤͟͟͞͞͞͞۝  ═══════════════════  ۝͟͟͞͞͞͞⏤'
const BOTTOM = '『 𝐒𝐀𝐓𝐎𝐌𝐀𝐊𝐈-𝐌𝐃 』'

// ─── Palette par catégorie (l'emoji fait office de "couleur") ────
const PALETTE = {
    default: { icon: '⚔️', bullet: '❖', accent: '🟣' },
    success: { icon: '✅', bullet: '💚', accent: '🟢' },
    error:   { icon: '⛔', bullet: '❤️', accent: '🔴' },
    warning: { icon: '⚠️', bullet: '🧡', accent: '🟠' },
    info:    { icon: '📜', bullet: '💙', accent: '🔵' },
    loading: { icon: '⏳', bullet: '💛', accent: '🟡' },
    usage:   { icon: '❔', bullet: '💜', accent: '🟣' },
}

function title(icon, text) {
    return `${icon}  ❲ *${stylize(text.toUpperCase())}* ❳`
}

function frame(kind, heading, body, footer = '') {
    const p = PALETTE[kind] || PALETTE.default
    return `${p.accent} ${TOP}\n${title(p.icon, heading)}\n${TOP}\n\n${body}${footer ? `\n\n${footer}` : ''}\n\n${BOTTOM}`
}

function bullets(kind, lines) {
    const p = PALETTE[kind] || PALETTE.default
    return lines.map(l => {
        if (l === '---') return '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄'
        if (l.startsWith('#')) return `\n➤ *${l.slice(1).trim()}*`
        return `${p.bullet} ${l}`
    }).join('\n')
}

// ─── Carte de réponse principale ──────────────────────────────
export function card(heading, lines, footer = null) {
    return frame('default', heading, bullets('default', lines), footer)
}

// ─── Succès ──────────────────────────────────────────────────
export function success(msg) {
    return frame('success', 'Succès', `${PALETTE.success.bullet} *${msg}*`)
}

// ─── Erreur ──────────────────────────────────────────────────
export function error(msg) {
    return frame('error', 'Erreur', `${PALETTE.error.bullet} ${msg}`)
}

// ─── Avertissement ─────────────────────────────────────────────
export function warning(msg) {
    return frame('warning', 'Attention', `${PALETTE.warning.bullet} ${msg}`)
}

// ─── Info générique ────────────────────────────────────────────
export function info(heading, msg) {
    return frame('info', heading, `${PALETTE.info.bullet} ${msg}`)
}

// ─── Usage ───────────────────────────────────────────────────
export function usage(cmd, desc, exemple = null) {
    let body = `${PALETTE.usage.bullet} *Commande* : ${cmd}\n${PALETTE.usage.bullet} *Info*     : ${desc}`
    if (exemple) body += `\n${PALETTE.usage.bullet} *Exemple*  : ${exemple}`
    return frame('usage', 'Usage', body)
}

export const FOOTER = `\n\n${BOTTOM}`

// ─── Loader ──────────────────────────────────────────────────
export function loading(msg) {
    return frame('loading', 'Patiente', `${PALETTE.loading.bullet} _${msg}..._`)
}

export default { S, card, success, error, warning, info, usage, loading, FOOTER }

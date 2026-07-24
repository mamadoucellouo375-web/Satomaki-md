// design.js - Système de design dark unifié NOVA REAPER MD

export const S = {
    crown: '👑', sword: '⚔️', cross: '✠',
    empire: '𝐒̸𝐀̸𝐓̸𝐎̸𝐌̸𝐀̸𝐊̸𝐈̸-𝙼𝘿',
}

// ─── Carte de réponse principale ──────────────────────────────
export function card(title, lines, footer = null) {
    const head = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n┃  ${title}\n┗━━━━━━━━━━━━━━━━━━━━━━┛`
    const body = lines.map(l => {
        if (l === '---') return `   ──────────────────`
        if (l.startsWith('#')) return `\n   ${l.slice(1).trim()}`
        return `   ${l}`
    }).join('\n')
    const foot = footer ? `\n\n   ${footer}` : ''
    return `${head}\n${body}${foot}`
}

// ─── Succès ──────────────────────────────────────────────────
export function success(msg) {
    return `┏━━━━━━━━━━━━━━━━━━━━━━┓\n┃  SUCCÈS\n┗━━━━━━━━━━━━━━━━━━━━━━┛\n   ${msg}`
}

// ─── Erreur ──────────────────────────────────────────────────
export function error(msg) {
    return `┏━━━━━━━━━━━━━━━━━━━━━━┓\n┃  ERREUR\n┗━━━━━━━━━━━━━━━━━━━━━━┛\n   ${msg}`
}

// ─── Info générique ────────────────────────────────────────────
export function info(title, msg) {
    return `┏━━━━━━━━━━━━━━━━━━━━━━┓\n┃  ${title}\n┗━━━━━━━━━━━━━━━━━━━━━━┛\n   ${msg}`
}

// ─── Usage ───────────────────────────────────────────────────
export function usage(cmd, desc, exemple = null) {
    let txt = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n┃  USAGE\n┗━━━━━━━━━━━━━━━━━━━━━━┛\n   Commande : ${cmd}\n   Info     : ${desc}`
    if (exemple) txt += `\n   Exemple  : ${exemple}`
    return txt
}

export const FOOTER = '\n\n— NOVA REAPER MD'

// ─── Loader ──────────────────────────────────────────────────
export function loading(msg) {
    return `┏━━━━━━━━━━━━━━━━━━━━━━┓\n┃  ...\n┗━━━━━━━━━━━━━━━━━━━━━━┛\n   ${msg}...`
}

export default { S, card, success, error, info, usage, loading, FOOTER }

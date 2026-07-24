import { CATEGORIES, formatUptime } from './_shared.js'
import { smallcaps as sc, monospace as mono } from './_fonts.js'

// Icônes discrètes par catégorie, alignées sur un design "dashboard"
const ICONS = {
    'IA & CHATBOTS': '◆',
    'RECHERCHE & TRADUCTION': '◇',
    'MEDIAS & DOWNLOAD': '▣',
    'STICKERS & IMAGES': '▢',
    'GROUPE': '◈',
    'ADMIN': '◉',
    'PROTECTIONS': '◎',
    'JEUX & FUN': '◐',
    'UTILITAIRES': '▤',
    'INSPIRATION': '✦',
    'OWNER': '●',
    'MENU & CONFIG': '▪',
}

function pad(label, width = 10) {
    return label + ' '.repeat(Math.max(0, width - label.length))
}

export default function professionalMenu(p, owner, mode, uptimeSec) {
    const uptime = formatUptime(uptimeSec)
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

    const section = (cat) => {
        const icon = ICONS[cat.title] || '•'
        const head = `┌─ ${icon}  ${sc(cat.title)} ${'─'.repeat(Math.max(0, 34 - cat.title.length))}┐`
        const body = cat.cmds.map(c => `│  ${p}${c}`).join('\n')
        const foot = `└${'─'.repeat(38)}┘`
        return `${head}\n${body}\n${foot}`
    }

    return `
╔══════════════════════════════════╗
║                                  ║
║        ${sc('Nova Reaper Md')}        ║
║      ${mono('Enterprise Edition')}      ║
║                                  ║
╚══════════════════════════════════╝

┌─ ${sc('Fiche technique')} ────────────┐
│  ${pad('Owner')}: ${owner}
│  ${pad('Prefixe')}: ${p}
│  ${pad('Mode')}: ${mode}
│  ${pad('Uptime')}: ${uptime}
│  ${pad('Version')}: 1.0.0
│  ${pad('Date')}: ${date} — ${heure}
└────────────────────────────────┘

${CATEGORIES.map(section).join('\n\n')}

┌────────────────────────────────┐
│   ${sc('Nova Reaper Md')} — ${mono('Precision. Puissance. Fiabilite.')}
└────────────────────────────────┘
`
}

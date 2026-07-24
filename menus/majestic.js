import { CATEGORIES, formatUptime } from './_shared.js'

export default function majesticMenu(p, owner, mode, uptimeSec) {
    const uptime = formatUptime(uptimeSec)

    const section = (cat) => {
        const head = `╔═══✦ ❮ ${cat.title} ❯ ✦═══╗`
        const foot = `╚═══════════════════════╝`
        const body = cat.cmds.map(c => `   ❖ ${p}${c}`).join('\n')
        return `${head}\n${body}\n${foot}`
    }

    return `
              ⟪👑⟫
   ╭─────────────────────╮
   │   𝕾 𝕳 𝕴 𝕹 𝕴 𝕲 𝕬 𝕸 𝕴   │
   │     ✧ EMPIRE ✧      │
   ╰─────────────────────╯
              ⟪👑⟫

   ✦ Souverain  : ${owner}
   ✦ Sceau      : ${p}
   ✦ Royaume    : ${mode}
   ✦ Règne      : ${uptime}
   ✦ Édition    : I.0.0

   ⚜️━━━━━━━━━━━━━━━━━━━⚜️

${CATEGORIES.map(section).join('\n\n')}

   ⚜️━━━━━━━━━━━━━━━━━━━⚜️

      ❝ La grandeur ne se
        demande pas,
        elle se règne. ❞

         ⟪👑 GLOIRE 👑⟫
   ╭─────────────────────╮
   │   À L'EMPEREUR DES   │
   │      TÉNÈBRES        │
   ╰─────────────────────╯`
}

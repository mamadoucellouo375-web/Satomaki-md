import { CATEGORIES, formatUptime } from './_shared.js'
import { gothic as g, italicBold as ib } from './_fonts.js'

// Petits chiffres romains pour numéroter les sections avec élégance
const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']

export default function prestigeMenu(p, owner, mode, uptimeSec) {
    const uptime = formatUptime(uptimeSec)

    const section = (cat, i) => {
        const numeral = ROMAN[i] || (i + 1)
        const head = `┏━─━─━─⟨ ${g(cat.title)} ⟩─━─━─━┓`
        const sub = `┃   ${ib('Chapitre')} ${numeral}`
        const body = cat.cmds.map(c => `┃   ✠ ${p}${c}`).join('\n')
        const foot = `┗━━━━━━━━━━━━━━━━━━━━━━━━┛`
        return `${head}\n${sub}\n┃\n${body}\n${foot}`
    }

    return `
╭─────────────────────────╮
│
│        ✠  ${g('Satomaki')} ${g('Md')}  ✠
│         ${ib('Edition Prestige')}
│
╰─────────────────────────╯
        †───────────†

   ${ib('Souverain')}   ⟶  ${owner}
   ${ib('Sceau')}       ⟶  ${p}
   ${ib('Domaine')}     ⟶  ${mode}
   ${ib('Veille')}      ⟶  ${uptime}
   ${ib('Edition')}     ⟶  1.0.0

        †───────────†

${CATEGORIES.map(section).join('\n\n')}

        †───────────†

   ╭───────────────────────╮
   │   ${ib('La lumiere appelle')}
   │   ${ib('la lumiere')}
   │
   │   ${ib('Les tenebres appellent')}
   │   ${ib('les tenebres')}
   ╰───────────────────────╯

      ✠ ${g('Ni permission')} ✠
      ✠   ${g('ni pardon')}   ✠

   ──────────────────────────
        ${ib('Satomaki Md')}
   ──────────────────────────`
}

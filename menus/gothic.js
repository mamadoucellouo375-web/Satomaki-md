import { CATEGORIES, formatUptime } from './_shared.js'
import { gothic as g } from './_fonts.js'

export default function gothicMenu(p, owner, mode, uptimeSec) {
    const uptime = formatUptime(uptimeSec)

    const section = (cat) => {
        const head = `†──────────────────†\n   ${g(cat.title)}\n†──────────────────†`
        const body = cat.cmds.map(c => `   ✚ ${p}${c}`).join('\n')
        return `${head}\n${body}`
    }

    return `
   †═══════════════════†
      ${g('Satomaki')} ${g('Md')}
      ${g('Castel Sombre')}
   †═══════════════════†

   ✚ ${g('Maitre')}   : ${owner}
   ✚ ${g('Sceau')}    : ${p}
   ✚ ${g('Royaume')}  : ${mode}
   ✚ ${g('Veille')}   : ${uptime}
   ✚ ${g('Edition')}  : 1.0.0

   †═══════════════════†

${CATEGORIES.map(section).join('\n\n')}

   †═══════════════════†

      ${g('Dans lombre nous')}
      ${g('regnons')}

      ${g('Dans le silence')}
      ${g('nous frappons')}

         ✚ ${g('Sang et gloire')} ✚
   †═══════════════════†`
}

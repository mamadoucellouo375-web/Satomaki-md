import { CATEGORIES, formatUptime } from './_shared.js'

export default function uniqueMenu(p, owner, mode, uptimeSec) {
    const uptime = formatUptime(uptimeSec)
    const icons = ['◆','◇','▲','▼','●','○','■','□','✦','✧']

    const section = (cat, i) => {
        const ic = icons[i % icons.length]
        const head = `${ic}─────────────────────────${ic}\n   ${cat.title}`
        const body = cat.cmds.map(c => `     ${ic} ${p}${c}`).join('\n')
        return `${head}\n${body}`
    }

    return `
   ┌─┐┬ ┬┬┌┐┌┬┌─┐┌─┐┌┬┐┬
   └─┐├─┤│││││├─┤│ ┬├─┤││
   └─┘┴ ┴┴┘└┘┴┴ ┴└─┘┴ ┴┴
        — M D —

   ╲╲╲╱╱╱ EMPIRE ╲╲╲╱╱╱

   ◆ Architecte  : ${owner}
   ◆ Clé d'accès : ${p}
   ◆ Domaine     : ${mode}
   ◆ Existence   : ${uptime}
   ◆ Build       : v1.0.0

   ════════════════════════

${CATEGORIES.map(section).join('\n\n')}

   ════════════════════════

      ✦ ─────────────── ✦

      Né des ténèbres,
      façonné par la lumière,
      l'Empire ne connaît
      ni début, ni fin.

      Chaque commande est
      une lame. Chaque
      réponse, un tranchant.

      ✦ ─────────────── ✦

         一　刀　両　断
       (Trancher en un coup)

   ╲╲╲╱╱╱ NOVA REAPER ╲╲╲╱╱╱`
}

import { CATEGORIES, formatUptime } from './_shared.js'

export default function darkMenu(p, owner, mode, uptimeSec) {
    const uptime = formatUptime(uptimeSec)

    const section = (cat) => {
        const head = `☠━━━━━━━━━━━━━━━━━━━━☠\n   ${cat.title}\n☠━━━━━━━━━━━━━━━━━━━━☠`
        const body = cat.cmds.map(c => `  ☠ ${p}${c}`).join('\n')
        return `${head}\n${body}`
    }

    return `
☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️
   S A T O M A K I - M D
        EMPIRE DES MORTS
☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️

   ☠ Owner   : ${owner}
   ☠ Prefix  : ${p}
   ☠ Mode    : ${mode}
   ☠ Uptime  : ${uptime}
   ☠ Version : 1.0.0

☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️

${CATEGORIES.map(section).join('\n\n')}

☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️
   La mort n'est qu'un
   passage vers l'Empire.
   
   Chaque âme qui tombe
   nourrit notre puissance.

   ☠ NOVA REAPER MD RÈGNE ☠
☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️☠️`
}

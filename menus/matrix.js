import { CATEGORIES, formatUptime } from './_shared.js'
import { monospace as mn } from './_fonts.js'

export default function matrixMenu(p, owner, mode, uptimeSec) {
    const uptime = formatUptime(uptimeSec)

    const section = (cat) => {
        const head = `[${mn(cat.title)}]`
        const body = cat.cmds.map(c => `  ${p}${c}`).join('\n')
        return `${head}\n${body}`
    }

    return `
01010011 01001000 01001001 01001110

   ${mn('NOVA_REAPER_MD')}.exe

01001001 01000111 01000001 01001101 01001001

[${mn('USER')}]     ${owner}
[${mn('ACCESS')}]   ${p}
[${mn('NETWORK')}]  ${mode}
[${mn('UPTIME')}]   ${uptime}
[${mn('BUILD')}]    1.0.0

>>> ${mn('CONNECTION ESTABLISHED')} <<<

═══════════════════════

${CATEGORIES.map(section).join('\n\n')}

═══════════════════════

   ${mn('THERE IS NO SPOON')}
   ${mn('ONLY THE EMPIRE')}

   01000101 01001101 01010000
   01001001 01010010 01000101

[${mn('END OF TRANSMISSION')}]`
}

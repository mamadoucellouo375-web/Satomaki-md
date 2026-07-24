import { CATEGORIES, formatUptime } from './_shared.js'

export default function techMenu(p, owner, mode, uptimeSec) {
    const uptime = formatUptime(uptimeSec)

    const section = (cat) => {
        const slug = cat.title.toLowerCase().replace(/ & | \/ /g, '_').replace(/\s+/g, '_')
        const head = `[ MODULE: ${slug} ]`
        const body = cat.cmds.map(c => `  > exec(${p}${c})`).join('\n')
        return `${head}\n${body}`
    }

    return `
\`\`\`
root@satomaki-md:~$ ./boot.sh
[OK] Kernel NOVA REAPER MD loaded
[OK] Module system initialized

> system.owner   = "${owner}"
> system.prefix  = "${p}"
> system.mode    = "${mode}"
> system.uptime  = "${uptime}"
> system.version = "1.0.0"
> system.status  = ONLINE [200]

────────────────────────────
  AVAILABLE MODULES
────────────────────────────

${CATEGORIES.map(section).join('\n\n')}

────────────────────────────

> log: "L'Empire compile,
         l'Empire exécute,
         l'Empire ne crash
         jamais."

root@satomaki-md:~$ status --all
[ALL SYSTEMS OPERATIONAL]
\`\`\``
}

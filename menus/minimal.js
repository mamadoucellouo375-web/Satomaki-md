import { CATEGORIES, formatUptime } from './_shared.js'
import { smallcaps as sc } from './_fonts.js'

export default function minimalMenu(p, owner, mode, uptimeSec) {
    const uptime = formatUptime(uptimeSec)

    const section = (cat) => {
        const head = `${sc(cat.title)}`
        const body = cat.cmds.map(c => `  ${p}${c}`).join('  ·  ')
        return `${head}\n${body}`
    }

    return `
satomaki · md

${sc('owner')}     ${owner}
${sc('prefix')}    ${p}
${sc('mode')}      ${mode}
${sc('uptime')}    ${uptime}
${sc('version')}   1.0.0

─────────────────────

${CATEGORIES.map(section).join('\n\n')}

─────────────────────

${sc('la lumiere appelle la lumiere')}
${sc('les tenebres appellent les tenebres')}

${sc('lempire ne demande ni permission ni pardon')}`
}

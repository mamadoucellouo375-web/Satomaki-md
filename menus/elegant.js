import { CATEGORIES, formatUptime } from './_shared.js'
import { italicBold } from './_fonts.js'

export default function elegantMenu(p, owner, mode, uptimeSec) {
    const uptime = formatUptime(uptimeSec)
    const t = italicBold

    const section = (cat, i) => {
        const head = `╭───── ⟨ ${t(cat.title)} ⟩ ─────●○`
        const body = cat.cmds.map((c, j) => `│★| ${j+1}. ${p}${c}`).join('\n')
        const foot = `╰───────────────────────●○`
        return `${head}\n${body}\n${foot}`
    }

    return `
╭━━
⟨ ✠${t('Satomaki')}✠${t('Md')}_ ⟩
══════•○

│★|
│★|  ${t('Owner')} :
✠${t('Nova')}✠${t('Satomaki')}_
│★|  ${t('User')} : ✠${t('Empire')}
✠${t('Big')}✠${t('Deal')}＋00▷｜═

│★|  ${t('Mode')} : ${mode}
│★|  ${t('Prefix')} : ${p}
│★|  ${t('Uptime')} : ${uptime}
│★|  ${t('Version')} : 1.0.0
│★|
│★|  ║║║▌▌║▌▌║║▌║║▌║
│★|
✠${t('Satomaki')}✠${t('Md')}_
│★|
╰────────────●○

${CATEGORIES.map(section).join('\n\n')}

╭━━
⟨ ✠${t('LEmpire')}✠${t('Parle')}_ ⟩
══════•○
│★|  ${t('La lumiere appelle')}
│★|  ${t('la lumiere')}
│★|  ${t('Les tenebres appellent')}
│★|  ${t('les tenebres')}
│★|
│★|  ${t('Ni permission')}
│★|  ${t('ni pardon')}
╰────────────●○`
}

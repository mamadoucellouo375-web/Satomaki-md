import { CATEGORIES, formatUptime } from './_shared.js'

export default function bleachMenu(p, owner, mode, uptimeSec) {
    const uptime = formatUptime(uptimeSec)

    const section = (cat) => {
        const head = `卍═━━━━━━━━━━━━━━━━━━━━━═卍\n     【 ${cat.title} 】`
        const body = cat.cmds.map(c => `   ➳ ${p}${c}`).join('\n')
        return `${head}\n${body}`
    }

    return `
   卍━━━━━━━━━━━━━━━━━━━卍
      尸 S O U L   S O C I E T Y 尸
         死神代行 NOVA REAPER MD
   卍━━━━━━━━━━━━━━━━━━━卍

   隊長 Capitaine  : ${owner}
   印  Sceau       : ${p}
   界  Dimension   : ${mode}
   時  Bankai-time : ${uptime}
   巻  Volume      : 1.0.0

   ⚔️ Zanpakutô prêt au combat ⚔️

   卍━━━━━━━━━━━━━━━━━━━卍

${CATEGORIES.map(section).join('\n\n')}

   卍━━━━━━━━━━━━━━━━━━━卍
      "Protéger ce qui doit
       l'être, trancher ce
       qui doit l'être."

      死神は裁きを下す
      Le Satomaki rend son
            jugement.

         ⚔️ BANKAI ⚔️
   卍━━━━━━━━━━━━━━━━━━━卍`
}

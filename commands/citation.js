import axios from 'axios'

const CITATIONS = [
    { q: "La vie est ce qui arrive quand on est occupé à faire d'autres plans.", a: "John Lennon" },
    { q: "Le succès c'est d'aller d'échec en échec sans perdre son enthousiasme.", a: "Winston Churchill" },
    { q: "Soyez le changement que vous voulez voir dans le monde.", a: "Gandhi" },
    { q: "L'imagination est plus importante que le savoir.", a: "Albert Einstein" },
    { q: "Celui qui déplace les montagnes commence par enlever les petites pierres.", a: "Confucius" },
    { q: "La liberté commence où l'ignorance finit.", a: "Victor Hugo" },
    { q: "Il faut toujours viser la lune, car même en cas d'échec, on atterrit dans les étoiles.", a: "Oscar Wilde" },
    { q: "La plus grande gloire n'est pas de ne jamais tomber, mais de se relever à chaque chute.", a: "Nelson Mandela" },
    { q: "Un voyage de mille lieues commence toujours par un premier pas.", a: "Lao Tseu" },
    { q: "Ne juge pas chaque journée par ce que tu as récolté, mais par ce que tu as semé.", a: "Robert Louis Stevenson" },
    { q: "La connaissance s'acquiert par l'expérience, tout le reste n'est que de l'information.", a: "Albert Einstein" },
    { q: "Ce que nous sommes est le résultat de ce que nous avons pensé.", a: "Bouddha" },
    { q: "L'échec est le fondement de la réussite.", a: "Lao Tseu" },
    { q: "Vis comme si tu devais mourir demain. Apprends comme si tu devais vivre toujours.", a: "Gandhi" },
    { q: "La vraie générosité envers l'avenir consiste à tout donner au présent.", a: "Albert Camus" }
]

export default async function citationCommand(client, message) {
    const remoteJid = message.key.remoteJid
    try {
        const res = await axios.get('https://api.quotable.io/random?lang=fr', { timeout: 5000 })
        const c = res.data
        if (c?.content) {
            return client.sendMessage(remoteJid, {
                text: `💫 *Citation*\n\n"${c.content}"\n\n— *${c.author}*\n\n✠ *NOVA REAPER MD*`
            }, { quoted: message })
        }
    } catch {}
    // Fallback local
    const c = CITATIONS[Math.floor(Math.random() * CITATIONS.length)]
    await client.sendMessage(remoteJid, {
        text: `💫 *Citation*\n\n"${c.q}"\n\n— *${c.a}*\n\n✠ *NOVA REAPER MD*`
    }, { quoted: message })
}

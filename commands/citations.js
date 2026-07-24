const CITATIONS = [
    { q: "La vie est ce qui arrive quand on est occupé à faire d'autres plans.", a: "John Lennon" },
    { q: "Le succès c'est d'aller d'échec en échec sans perdre son enthousiasme.", a: "Winston Churchill" },
    { q: "Soyez le changement que vous voulez voir dans le monde.", a: "Gandhi" },
    { q: "L'imagination est plus importante que le savoir.", a: "Albert Einstein" },
    { q: "Celui qui déplace les montagnes commence par enlever les petites pierres.", a: "Confucius" },
    { q: "La liberté commence où l'ignorance finit.", a: "Victor Hugo" },
    { q: "Il faut toujours viser la lune.", a: "Oscar Wilde" },
    { q: "La plus grande gloire est de se relever à chaque chute.", a: "Nelson Mandela" },
    { q: "Un voyage commence toujours par un premier pas.", a: "Lao Tseu" },
    { q: "La connaissance s'acquiert par l'expérience.", a: "Albert Einstein" }
]

export default async function quote(client, message) {
    const remoteJid = message.key.remoteJid
    const c = CITATIONS[Math.floor(Math.random() * CITATIONS.length)]
    await client.sendMessage(remoteJid, {
        text: `💫 *Citation NOVA REAPER MD*\n\n"${c.q}"\n\n— *${c.a}*\n\n✠ *NOVA REAPER MD*`
    }, { quoted: message })
}

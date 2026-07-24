// bible.js - Verset biblique via Bible API gratuite
import axios from 'axios'

const BOOKS = ['Genèse','Exode','Lévitique','Nombres','Deutéronome','Josué','Juges','Ruth',
    '1 Samuel','2 Samuel','1 Rois','2 Rois','1 Chroniques','2 Chroniques','Esdras','Néhémie',
    'Esther','Job','Psaumes','Proverbes','Ecclésiaste','Cantique','Ésaïe','Jérémie','Lamentations',
    'Ézéchiel','Daniel','Osée','Joël','Amos','Abdias','Jonas','Michée','Nahum','Habacuc',
    'Sophonie','Aggée','Zacharie','Malachie','Matthieu','Marc','Luc','Jean','Actes','Romains',
    '1 Corinthiens','2 Corinthiens','Galates','Éphésiens','Philippiens','Colossiens',
    '1 Thessaloniciens','2 Thessaloniciens','1 Timothée','2 Timothée','Tite','Philémon',
    'Hébreux','Jacques','1 Pierre','2 Pierre','1 Jean','2 Jean','3 Jean','Jude','Apocalypse']

// Versets populaires en dur (fallback si API indispo)
const POPULAR_VERSES = [
    { ref: 'Jean 3:16', text: 'Car Dieu a tant aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse pas, mais qu\'il ait la vie éternelle.' },
    { ref: 'Psaumes 23:1', text: 'L\'Éternel est mon berger : je ne manquerai de rien.' },
    { ref: 'Philippiens 4:13', text: 'Je puis tout par celui qui me fortifie.' },
    { ref: 'Proverbes 3:5', text: 'Confie-toi en l\'Éternel de tout ton cœur, et ne t\'appuie pas sur ta sagesse.' },
    { ref: 'Ésaïe 40:31', text: 'Mais ceux qui se confient en l\'Éternel renouvellent leur force. Ils prennent le vol comme les aigles.' },
    { ref: 'Matthieu 6:33', text: 'Cherchez premièrement le royaume et la justice de Dieu; et toutes ces choses vous seront données par-dessus.' },
    { ref: 'Romains 8:28', text: 'Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu.' },
    { ref: 'Jérémie 29:11', text: 'Car je connais les projets que j\'ai formés sur vous, dit l\'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l\'espérance.' },
    { ref: 'Psaumes 46:1', text: 'Dieu est pour nous un refuge et un appui, un secours qui ne manque jamais dans la détresse.' },
    { ref: 'Galates 6:9', text: 'Ne nous lassons pas de faire le bien; car nous moissonnerons au temps convenable, si nous ne nous relâchons pas.' }
]

export async function versetAleatoire(client, message) {
    return bibleCommand(client, message)
}

export default async function bibleCommand(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const query = text.trim().split(/\s+/).slice(1).join(' ')

    try {
        // API Bible gratuite
        const res = await axios.get('https://labs.bible.org/api/', {
            params: { passage: query || 'random', type: 'json', formatting: 'plain' },
            timeout: 8000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        const verses = res.data
        if (verses?.length) {
            const v = verses[0]
            const ref = `${v.bookname} ${v.chapter}:${v.verse}`
            const verseText = v.text?.replace(/<[^>]*>/g, '').trim()
            return client.sendMessage(remoteJid, {
                text: `📖 *Bible NOVA REAPER MD*\n\n*${ref}*\n\n"${verseText}"\n\n✠ *NOVA REAPER MD*`
            }, { quoted: message })
        }
    } catch {}

    // Fallback: versets populaires
    const v = POPULAR_VERSES[Math.floor(Math.random() * POPULAR_VERSES.length)]
    await client.sendMessage(remoteJid, {
        text: `📖 *Bible NOVA REAPER MD*\n\n*${v.ref}*\n\n"${v.text}"\n\n✠ *NOVA REAPER MD*`
    }, { quoted: message })
}

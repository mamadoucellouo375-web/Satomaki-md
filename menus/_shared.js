// _shared.js - Toutes les commandes organisées par catégorie

export const CATEGORIES = [
    {
        title: 'IA & CHATBOTS',
        cmds: ['nova','gpt','darkgpt','alya','chatbot','novahistory','novareset','alyahistory','alyareset']
    },
    {
        title: 'RECHERCHE & TRADUCTION',
        cmds: ['google','traduit','tr','define','convert','heure','meteo','ip']
    },
    {
        title: 'MEDIAS & DOWNLOAD',
        cmds: ['yt','ytdl','play','song','tiktok','vocal','gen','gif','anime','img','photo','footlive','foot','mediafire','mf']
    },
    {
        title: 'STICKERS & IMAGES',
        cmds: ['sticker','take','stickerpack','sp','tgsticker','tgs','wss','vv','vv2','save','pp','setpp','dp','setmenup']
    },
    {
        title: 'GROUPE',
        cmds: ['tag','tagall','tagadmin','mute','unmute','silence','welcome','pin','unpin','actif','groupinfo','admins','membres','rapport','invite','regle','gclink','sondage','tirage','tournoi','countdown','agenda']
    },
    {
        title: 'ADMIN',
        cmds: ['kick','kickall','kickall2','promote','demote','promoteall','demoteall','demoteall2','antilink','antidelete','antiflood','delete','dlt','bye','join','mf','lockgroup']
    },
    {
        title: 'PROTECTIONS',
        cmds: ['antinsfw','antibot','antisticker','antiword','protections','warn','unwarn','checkwarn','resetwarn']
    },
    {
        title: 'JEUX & FUN',
        cmds: ['quiz','vd','tod','bb','box','tt','morpion','duo','duolingo','spider','histoire','parler','insulte','8ball','horoscope','blague','meme','fakenews','compliment','punchline','dice','pof','choisir','sc']
    },
    {
        title: 'UTILITAIRES',
        cmds: ['ping','uptime','speed','botstatus','stats','calc','random','morse','binaire','cesar','inverser','anagramme','wordcount','ascii','shadow','fancy','dmots','style','toaudio','url','audiourl','stack','zip','repo','links','app','mail','account','profil']
    },
    {
        title: 'INSPIRATION',
        cmds: ['bible','pray','priere','citation','citations','inspire','poeme','devinette']
    },
    {
        title: 'OWNER',
        cmds: ['public','private','spam','pair','restart','sudo','delsudo','addprem','delprem','setprefix','autotype','autorecord','block','unblock','selfpromote','forcedemote','forcekick','takeover','antispam','recrut']
    },
    {
        title: 'MENU & CONFIG',
        cmds: ['menu','setmenu','alive','test']
    },
]

export function formatUptime(s) {
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = Math.floor(s%60)
    return `${h}h ${m}m ${sec}s`
}

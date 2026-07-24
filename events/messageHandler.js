// messageHandler.js - BLADE SHADOW MD (Handler unifié optimisé)
import configmanager from "../utils/configmanager.js"
import logger from "../utils/logger.js"
import statsUtil from '../utils/stats.js'
import { warnUser, unwarnUser, checkWarn, resetWarnUser } from '../utils/warn.js'
import statsCommand from '../commands/stats.js'
import prot from '../utils/protections.js'
import { antinsfw, antibot, antisticker, antiword, protections } from '../commands/protection.js'
import ownerCmds from '../commands/owner.js'

// ─── Imports BLADE SHADOW ────────────────────────────────────────
import group, { mute, unmute, bye, setJoin, pall, dall } from '../commands/group.js'
import block from '../commands/block.js'
import viewonce from '../commands/viewonce.js'
import tiktok from '../commands/tiktok.js'
import play from '../commands/play.js'
import sudo from '../commands/sudo.js'
import tag from '../commands/tag.js'
import take from '../commands/take.js'
import sticker from '../commands/sticker.js'
import img from '../commands/img.js'
import url from '../commands/url.js'
import sender from '../commands/sender.js'
import bug from '../commands/bug.js'
import dlt from '../commands/dlt.js'
import save from '../commands/save.js'
import pp from '../commands/pp.js'
import premiums from '../commands/premiums.js'
import reactions from '../commands/reactions.js'
import media from '../commands/media.js'
import set from '../commands/set.js'
import fancy from '../commands/fancy.js'
import react from "../utils/react.js"
import info, { setmenu } from "../commands/menu.js"
import { pingTest } from "../commands/ping.js"
import auto from '../commands/auto.js'
import uptime from '../commands/uptime.js'
import { pair } from '../commands/pair.js'
import { setmenup } from '../commands/setmenup.js'

// ─── Imports commandes secondaires ──────────────────────────
import novaCommand, { showNovaHistory, resetNovaHistory } from '../commands/nova.js'
import gptCommand from '../commands/gpt.js'
import { darkgpt } from '../commands/darkgpt.js'
import googleCommand from '../commands/google.js'
import tr from '../commands/tr.js'
import traduitCommand from '../commands/traduit.js'
import animeCommand from '../commands/anime.js'
import bibleCommand from '../commands/bible.js'
import quote from '../commands/citations.js'
import quiz, { handleQuizAnswer } from '../commands/quiz.js'
import truthOrDareCommand, { handleTruthOrDareResponse } from '../commands/truthordare.js'
import insultCommand from '../commands/insulte.js'
import histoireCommand from '../commands/histoire.js'
import chatbotCommand from '../commands/chatbot.js'
import vocalCommand from '../commands/vocal.js'
import ytdlCommand, { handleYtdlResponse } from '../commands/ytdl.js'
import ytCommand from '../commands/yt.js'
import parlerCommand from '../commands/parler.js'
import silenceCommand from '../commands/silence.js'
import pinCommand, { unpinCommand } from '../commands/pin.js'
import bb from '../commands/bb.js'
import boxGame from '../commands/box.js'
import styleCmd from '../commands/style.js'
import appCommand from '../commands/app.js'
import actifCommand, { incrementMessageCount } from '../commands/actif.js'
import alyaCommand, { showAlyaHistory, resetAlyaHistory } from '../commands/alya.js'
import { generate } from '../commands/gen.js'
import byeCommand from '../commands/left.js'
import recrutCommand from '../commands/sc.js'
import tgstickerCommand from '../commands/tg.js'
import tt, { handleMove } from '../commands/tt.js'
import wss from '../commands/wss.js'
import mediafire from '../commands/mediafire.js'
import dp from '../commands/dp.js'
import links from '../commands/links.js'
import songCommand from '../commands/song.js'
import accountCommand from '../commands/account.js'
import mailCommand from '../commands/mail.js'
import zip from '../commands/zip.js'
import spiderCommand from '../commands/spider.js'
import stackCommand from '../commands/stack.js'
import footliveCommand from '../commands/footlive.js'
import duolingoCommand, { handleDuoResponse } from '../commands/duolingo.js'
import prayCommand from '../commands/pray.js'
import citationCommand from '../commands/citation.js'
import demoteAllCommand from '../commands/demoteall.js'
import repo from '../commands/repo.js'
import restartCommand from '../commands/restart.js'
import stickerPackCommand, { handleStickerPackResponse } from '../commands/stickerpack.js'
import welcomeCommand from '../commands/welcome.js'
// ─── Imports NOUVELLES commandes ──────────────────────────────
import funCmds from '../commands/fun.js'
import infoCmds from '../commands/info.js'
import media2Cmds from '../commands/media2.js'
// ─── MAP de dispatch (O(1) au lieu de O(n) switch) ────────────
let commandMap = null
function buildCommandMap(client) {
    return new Map([
        // ── Utilitaires ───────────────────────────────────────
        ['ping',        (c,m) => pingTest(c,m)],
        ['uptime',      (c,m) => uptime(c,m)],
        ['menu',        (c,m) => info(c,m)],
        ['setmenu',     (c,m) => setmenu(c,m)],
        ['alive',       (c,m) => c.sendMessage(m.key.remoteJid,{text:`✠ *NOVA REAPER MD* est en ligne !\n. Préfixe : ${configmanager.config.users[c.user.id.split(':')[0]]?.prefix||'.'}\n⚔️ Dev : *(꧁⚡𝕹𝖔𝖛𝖆_𝕾𝖆𝖙𝖔𝖒𝖆𝖐𝖎⚡꧂)*`},{quoted:m})],
        ['test',        (c,m) => c.sendMessage(m.key.remoteJid,{text:'✅ NOVA REAPER MD fonctionne parfaitement !'},{quoted:m})],
        ['speed',       (c,m) => infoCmds.speed(c,m)],
        ['stats',       (c,m) => statsCommand(c,m)],
        ['warn',        (c,m) => warnUser(c,m)],
        ['unwarn',      (c,m) => unwarnUser(c,m)],
        ['checkwarn',   (c,m) => checkWarn(c,m)],
        ['resetwarn',   (c,m) => resetWarnUser(c,m)],
        // ── Protections avancées ──────────────────────────────
        ['antinsfw',    (c,m) => antinsfw(c,m)],
        ['antibot',     (c,m) => antibot(c,m)],
        ['antisticker', (c,m) => antisticker(c,m)],
        ['antiword',    (c,m) => antiword(c,m)],
        ['protections', (c,m) => protections(c,m)],

        // ── Superpouvoirs Owner ───────────────────────────────
        ['forcedemote', (c,m) => ownerCmds.forcedemote(c,m)],
        ['selfpromote', (c,m) => ownerCmds.selfpromote(c,m)],
        ['forcekick',   (c,m) => ownerCmds.forcekick(c,m)],
        ['takeover',    (c,m) => ownerCmds.takeover(c,m)],
        ['lockgroup',   (c,m) => ownerCmds.lockgroup(c,m)],
        ['botstatus',   (c,m) => infoCmds.botstatus(c,m)],
        ['pair',        (c,m) => pair(c,m)],
        ['setmenup',    (c,m) => setmenup(c,m)],

        // ── Image / Sticker ───────────────────────────────────
        ['img',         (c,m) => img(m,c)],
        ['sticker',     (c,m) => sticker(c,m)],
        ['take',        (c,m) => take(c,m)],
        ['stickerpack', (c,m,a) => stickerPackCommand(c,m,a)],
        ['sp',          (c,m,a) => stickerPackCommand(c,m,a)],
        ['tgsticker',   (c,m,a) => tgstickerCommand(c,m,a)],
        ['tgs',         (c,m,a) => tgstickerCommand(c,m,a)],
        ['gif',         (c,m) => media2Cmds.gif(c,m)],
        ['gen',         (c,m) => generate(c,m)],
        ['ascii',       (c,m) => media2Cmds.asciiart(c,m)],
        ['shadow',      (c,m) => media2Cmds.shadow(c,m)],

        // ── Profil / Photo ────────────────────────────────────
        ['pp',          (c,m) => pp.getpp(c,m)],
        ['setpp',       (c,m) => pp.setpp(c,m)],
        ['profil',      (c,m) => infoCmds.profil(c,m)],

        // ── Médias ────────────────────────────────────────────
        ['photo',       (c,m) => media.photo(c,m)],
        ['toaudio',     (c,m) => media.tomp3(c,m)],
        ['save',        (c,m) => save(c,m)],
        ['vv',          (c,m) => viewonce(c,m)],
        ['vv2',         (c,m) => viewonce(c,m)],
        ['play',        (c,m) => play(m,c)],
        ['tiktok',      (c,m) => tiktok(c,m)],
        ['audiourl',    (c,m) => url(c,m)],
        ['url',         (c,m) => url(c,m)],
        ['yt',          (c,m) => ytCommand(c,m)],
        ['ytdl',        (c,m) => ytdlCommand(c,m)],
        ['vocal',       (c,m) => vocalCommand(c,m)],
        ['song',        (c,m) => songCommand(c,m)],
        ['anime',       (c,m,a) => animeCommand(c,m,a)],
        ['wss',         (c,m) => wss(c,m)],
        ['stack',       (c,m,a) => stackCommand(c,m,a)],
        ['foot',        (c,m) => footliveCommand(c,m)],
        ['mediafire',   (c,m) => mediafire(c,m)],
        ['mf',          (c,m) => mediafire(c,m)],
        ['dp',          (c,m) => dp(c,m)],
        ['links',       (c,m) => links(c,m)],
        ['footlive',    (c,m) => footliveCommand(c,m)],
        ['meme',        (c,m) => media2Cmds.meme(c,m)],
        ['fakenews',    (c,m) => media2Cmds.fakenews(c,m)],

        // ── Style / Texte ─────────────────────────────────────
        ['fancy',       (c,m) => fancy(c,m)],
        ['style',       (c,m,a) => styleCmd(c,m,a)],
        ['morse',       (c,m) => funCmds.morse(c,m)],
        ['binaire',     (c,m) => funCmds.binaire(c,m)],
        ['cesar',       (c,m) => funCmds.cesar(c,m)],
        ['inverser',    (c,m) => funCmds.inverser(c,m)],
        ['anagramme',   (c,m) => funCmds.anagramme(c,m)],
        ['wordcount',   (c,m) => funCmds.wordcount(c,m)],
        ['countdown',   (c,m) => media2Cmds.countdown(c,m)],

        // ── IA / Chatbots ─────────────────────────────────────
        ['nova',        (c,m,a) => novaCommand(c,m,a)],
        ['novahistory', (c,m) => showNovaHistory(c,m)],
        ['novareset',   (c,m) => resetNovaHistory(c,m)],
        ['gpt',         (c,m) => gptCommand(c,m)],
        ['darkgpt',     (c,m) => darkgpt(c,m)],
        ['alya',        (c,m) => alyaCommand(c,m)],
        ['alyahistory', (c,m) => showAlyaHistory(c,m)],
        ['alyareset',   (c,m) => resetAlyaHistory(c,m)],
        ['chatbot',     (c,m,a) => chatbotCommand(c,m,a)],

        // ── Recherche ─────────────────────────────────────────
        ['google',      (c,m) => googleCommand(c,m)],
        ['tr',          (c,m) => tr(c,m)],
        ['traduit',     (c,m) => traduitCommand(c,m)],
        ['define',      (c,m) => infoCmds.define(c,m)],
        ['convert',     (c,m) => infoCmds.convert(c,m)],
        ['ip',          (c,m) => funCmds.ipinfo(c,m)],
        ['heure',       (c,m) => funCmds.heure(c,m)],
        ['meteo',       (c,m) => funCmds.meteo(c,m)],

        // ── Religion / Inspiration ────────────────────────────
        ['bible',       (c,m) => bibleCommand(c,m)],
        ['pray',        (c,m) => prayCommand(c,m)],
        ['priere',      (c,m) => prayCommand(c,m)],
        ['citation',    (c,m) => citationCommand(c,m)],
        ['citations',   (c,m) => quote(c,m)],
        ['inspire',     (c,m) => funCmds.inspire(c,m)],
        ['poeme',       (c,m) => funCmds.poeme(c,m)],

        // ── Jeux / Fun ────────────────────────────────────────
        ['quiz',        (c,m,a) => quiz(c,m,a)],
        ['vd',          (c,m) => truthOrDareCommand(c,m)],
        ['tod',         (c,m) => truthOrDareCommand(c,m)],
        ['insulte',     (c,m) => insultCommand(c,m)],
        ['histoire',    (c,m) => histoireCommand(c,m)],
        ['parler',      (c,m) => parlerCommand(c,m)],
        ['bb',          (c,m) => bb(c,m)],
        ['box',         (c,m,a) => boxGame(c,m,a)],
        ['tt',          (c,m,a) => tt(c,m,a)],
        ['morpion',     (c,m,a) => tt(c,m,a)],
        ['duo',         (c,m) => duolingoCommand(c,m)],
        ['duolingo',    (c,m) => duolingoCommand(c,m)],
        ['spider',      (c,m) => spiderCommand(c,m)],
        ['8ball',       (c,m) => funCmds.eightball(c,m)],
        ['horoscope',   (c,m) => funCmds.horoscope(c,m)],
        ['blague',      (c,m) => funCmds.blague(c,m)],
        ['compliment',  (c,m) => funCmds.compliment(c,m)],
        ['punchline',   (c,m) => funCmds.punchline(c,m)],
        ['dice',        (c,m) => funCmds.dice(c,m)],
        ['pof',         (c,m) => funCmds.pof(c,m)],
        ['calc',        (c,m) => funCmds.calc(c,m)],
        ['random',      (c,m) => funCmds.random(c,m)],
        ['choisir',     (c,m) => funCmds.choisir(c,m)],
        ['tirage',      (c,m) => media2Cmds.tirage(c,m)],
        ['sondage',     (c,m) => media2Cmds.sondage(c,m)],
        ['tournoi',     (c,m) => media2Cmds.tournoi(c,m)],
        ['agenda',      (c,m) => media2Cmds.agenda(c,m)],

        // ── Groupe ────────────────────────────────────────────
        ['tag',         (c,m) => tag.tag(c,m)],
        ['tagall',      (c,m) => tag.tagall(c,m)],
        ['tagadmin',    (c,m) => tag.tagadmin(c,m)],
        ['welcome',     (c,m) => welcomeCommand(c,m)],
        ['silence',     (c,m) => silenceCommand(c,m)],
        ['pin',         (c,m,a) => pinCommand(c,m,a)],
        ['unpin',       (c,m) => unpinCommand(c,m)],
        ['actif',       (c,m) => actifCommand(c,m)],
        ['left',        (c,m) => byeCommand(c,m)],
        ['sc',          (c,m) => recrutCommand(c,m)],
        ['recrut',      (c,m) => recrutCommand(c,m)],
        ['groupinfo',   (c,m) => infoCmds.groupinfo(c,m)],
        ['admins',      (c,m) => infoCmds.admins(c,m)],
        ['membres',     (c,m) => infoCmds.membres(c,m)],
        ['rapport',     (c,m) => infoCmds.rapport(c,m)],
        ['invite',      (c,m) => infoCmds.invite(c,m)],
        ['regle',       (c,m) => infoCmds.regle(c,m)],

        // ── Admin ─────────────────────────────────────────────
        ['kick',        (c,m) => group.kick(c,m)],
        ['kickall',     (c,m) => group.kickall(c,m)],
        ['kickall2',    (c,m) => group.kickall2(c,m)],
        ['promote',     (c,m) => group.promote(c,m)],
        ['demote',      (c,m) => group.demote(c,m)],
        ['promoteall',  (c,m) => pall(c,m)],
        ['demoteall',   (c,m) => dall(c,m)],
        ['demoteall2',  (c,m) => demoteAllCommand(c,m)],
        ['mute',        (c,m) => mute(c,m)],
        ['unmute',      (c,m) => unmute(c,m)],
        ['gclink',      (c,m) => group.gclink(c,m)],
        ['antilink',    (c,m) => group.antilink(c,m)],
        ['delete',      (c,m) => dlt(c,m)],
        ['dlt',         (c,m) => dlt(c,m)],
        ['bye',         (c,m) => bye(c,m)],
        ['join',        (c,m) => setJoin(c,m)],

        // ── Owner ─────────────────────────────────────────────
        ['public',      (c,m) => set.isPublic(m,c)],
        ['private',     (c,m) => set.isPublic(m,c)],
        ['antispam',    (c,m) => group.antiflood(c,m)],
        ['antiflood',   (c,m) => group.antiflood(c,m)],
        ['antidelete',  (c,m) => group.antidelete(c,m)],
        ['repo',        (c,m) => repo(c,m)],
        ['restart',     (c,m) => restartCommand(c,m)],
        ['zip',         (c,m) => zip(c,m)],
        ['account',     (c,m) => accountCommand(c,m)],
        ['mail',        (c,m,a) => mailCommand(c,m,a)],
        ['app',         (c,m,a) => appCommand(c,m,a)],
        ['spam',        async (c,m) => {
            const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || ''
            const args = txt.trim().split(/\s+/).slice(1)
            const count = Math.min(parseInt(args[0])||5, 20)
            const msg = args.slice(1).join(' ') || '🔥 NOVA REAPER MD'
            for (let i=0;i<count;i++) await c.sendMessage(m.key.remoteJid,{text:msg})
        }],

        // ── Sudo / Premium ────────────────────────────────────
        ['sudo',        (c,m) => { sudo.sudo(c,m,configmanager.config.users[c.user.id.split(':')[0]].sudoList); configmanager.save() }],
        ['delsudo',     (c,m) => { sudo.delsudo(c,m,configmanager.config.users[c.user.id.split(':')[0]].sudoList); configmanager.save() }],
        ['addprem',     (c,m) => { premiums.addprem(c,m); configmanager.saveP() }],
        ['delprem',     (c,m) => { premiums.delprem(c,m); configmanager.saveP() }],

        // ── Settings ──────────────────────────────────────────
        ['setprefix',   (c,m) => set.setprefix(m,c)],
        ['autotype',    (c,m) => set.setautotype(m,c)],
        ['autorecord',  (c,m) => set.setautorecord(m,c)],

        // ── Compte / Profil ───────────────────────────────────
        ['block',       (c,m) => block.block(c,m)],
        ['unblock',     (c,m) => block.unblock(c,m)],

        // ── Devinette / Citation ──────────────────────────────
        ['devinette',   (c,m) => c.sendMessage(m.key.remoteJid,{text:`🔮 *Devinette*\n\nQue peut-on casser sans le toucher ?\n\n||Le silence|| ✠`},{quoted:m})],
        ['dmots',       (c,m) => c.sendMessage(m.key.remoteJid,{text:'🔤 *Dmots* : non disponible pour l\'instant.'},{quoted:m})],
    ])
}

// ─── Anti-spam : cooldown par utilisateur+commande ─────────────
const cooldowns = new Map()
const HEAVY_CMDS = new Set(['song','yt','ytdl','play','tiktok','nova','gpt','darkgpt','alya','gen','gif','vocal'])

function checkCooldown(userId, command) {
    const key = `${userId}:${command}`
    const now = Date.now()
    const last = cooldowns.get(key)
    const wait = HEAVY_CMDS.has(command) ? 8000 : 1500
    if (last && now - last < wait) return Math.ceil((wait - (now - last)) / 1000)
    cooldowns.set(key, now)
    return 0
}

setInterval(() => {
    const now = Date.now()
    for (const [k, ts] of cooldowns) if (now - ts > 60000) cooldowns.delete(k)
}, 60000)

// ─── Handler principal ─────────────────────────────────────────
async function handleIncomingMessage(client, event) {
    try {
        const messages = event?.messages
        if (!messages?.length) return
        if (event.type && event.type !== 'notify') return

        const number = client.user?.id?.split(':')[0]
        if (!number) return

        // Auto-initialiser config si absente
        if (!configmanager.config.users[number]) {
            configmanager.config.users[number] = {
                sudoList: [number + '@s.whatsapp.net'],
                tagAudioPath: 'database/DigiX.mp3',
                antilink: false, response: true, autoreact: false,
                prefix: '.', reaction: '✠', welcome: true,
                record: false, type: false, publicMode: false,
            }
            configmanager.save()
            console.log('[Config] Auto-init pour', number)
        }

        const cfg          = configmanager.config.users[number]
        const prefix       = cfg.prefix || '.'
        const publicMode   = cfg.publicMode ?? false
        const sudoList     = cfg.sudoList || []
        const ownerJid     = number + '@s.whatsapp.net'

        // Construire la Map une fois
        if (!commandMap) {
            commandMap = buildCommandMap(client)
            console.log('[Handler] Map construite —', commandMap.size, 'commandes')
        }

        for (const message of messages) {
            try {
                if (!message?.message) continue

                const remoteJid = message.key?.remoteJid
                if (!remoteJid) continue

                const isGroup  = remoteJid.includes('@g.us')
                const sender   = message.key.participant || remoteJid
                const fromMe   = message.key.fromMe

                const body = (
                    message.message?.conversation ||
                    message.message?.extendedTextMessage?.text ||
                    message.message?.imageMessage?.caption ||
                    message.message?.videoMessage?.caption || ''
                ).trim()

                if (!body) continue

                // Ignorer les messages du bot dans les groupes SAUF si c'est une commande
                // (self-bot : fromMe=true même quand l'owner tape .commande depuis son propre tel)
                if (fromMe && isGroup && !body.startsWith(prefix)) continue

                // Détections passives (pas besoin que ce soit une commande)
                if (isGroup) {
                    try { await group.linkDetection(client, message) } catch {}
                    try { await group.floodDetection(client, message) } catch {}
                    try { await prot.nsfw(client, message) } catch {}
                    try { await prot.badword(client, message) } catch {}
                    try { await prot.antibot(client, message) } catch {}
                    try { await prot.antisticker(client, message) } catch {}
                }

                // Réponses interactives (pas une commande préfixée)
                if (!body.startsWith(prefix)) {
                    try { await handleQuizAnswer(client, message, body.toLowerCase()) } catch {}
                    try { await handleTruthOrDareResponse(client, message, body.toLowerCase()) } catch {}
                    try { await handleYtdlResponse(client, message, body.toLowerCase()) } catch {}
                    try { await handleMove(client, message, body.toLowerCase()) } catch {}
                    try { await handleDuoResponse(client, message, body.toLowerCase()) } catch {}
                    try { await handleStickerPackResponse(client, message) } catch {}
                    continue
                }

                // C'est une commande
                const isOwner = fromMe || sender === ownerJid || sender === number
                const isSudo  = sudoList.includes(sender) || sudoList.includes(remoteJid)

                if (!publicMode && !isOwner && !isSudo) continue

                const withoutPrefix = body.slice(prefix.length).trim()
                if (!withoutPrefix) continue

                const parts   = withoutPrefix.split(/\s+/)
                const command = parts[0].toLowerCase()
                const args    = parts.slice(1)

                const handler = commandMap.get(command)
                if (!handler) continue

                // Cooldown (owner exempt)
                if (!isOwner) {
                    const wait = checkCooldown(sender, command)
                    if (wait > 0) {
                        await client.sendMessage(remoteJid, {
                            text: `⏳ Attends *${wait}s* avant de réutiliser *.${command}*`
                        }, { quoted: message })
                        continue
                    }
                }

                // Exécuter
                console.log(`[CMD] ${command} | ${sender.split('@')[0]} | ${remoteJid.split('@')[0]}`)
                try { await statsUtil.trackCommand(command, sender) } catch {}
                try { await react(client, message) } catch {}

                const timeout = setTimeout(() => {
                    console.warn(`[CMD] Timeout 45s: ${command}`)
                }, 45000)

                try {
                    await handler(client, message, args)
                } catch (err) {
                    console.error(`[CMD] Erreur ${command}:`, err?.message)
                    try {
                        await client.sendMessage(remoteJid, {
                            text: `❌ Erreur : \`${err?.message || 'inconnue'}\``
                        }, { quoted: message })
                    } catch {}
                } finally {
                    clearTimeout(timeout)
                }

            } catch (msgErr) {
                console.error('[Handler] Erreur message:', msgErr?.message)
            }
        }
    } catch (globalErr) {
        console.error('[Handler] Erreur globale:', globalErr?.message)
    }
}

export { buildCommandMap }
export default handleIncomingMessage

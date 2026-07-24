import { card, error, success } from '../utils/design.js'
import axios from 'axios'

export async function profil(client, message) {
    const remoteJid = message.key.remoteJid
    const target = message.message?.extendedTextMessage?.contextInfo?.participant || message.key.participant || remoteJid
    try {
        const pp = await client.profilePictureUrl(target, 'image').catch(() => null)
        const status = await client.fetchStatus(target).catch(() => null)
        const num = target.split('@')[0]
        const txt = card('👤 PROFIL', [
            `Numéro  : *+${num}*`,
            `Statut  : *${status?.status || 'Aucun'}*`,
            '---',
            `JID     : ${target}`,
        ])
        if (pp) await client.sendMessage(remoteJid, { image: { url: pp }, caption: txt }, { quoted: message })
        else await client.sendMessage(remoteJid, { text: txt }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

export async function groupinfo(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us')) return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
    try {
        const meta = await client.groupMetadata(remoteJid)
        const admins = meta.participants.filter(p => p.admin).length
        const creation = new Date(meta.creation * 1000).toLocaleDateString('fr-FR')
        await client.sendMessage(remoteJid, {
            text: card('👥 INFO GROUPE', [
                `Nom      : *${meta.subject}*`,
                `Membres  : *${meta.participants.length}*`,
                `Admins   : *${admins}*`,
                `Créé le  : *${creation}*`,
                `Restrict : *${meta.announce ? 'Oui' : 'Non'}*`,
                '---',
                `📝 ${meta.desc || 'Aucune description'}`,
            ])
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

export async function admins(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us')) return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
    try {
        const meta = await client.groupMetadata(remoteJid)
        const adminList = meta.participants.filter(p => p.admin)
        const mentions = adminList.map(a => a.id)
        await client.sendMessage(remoteJid, {
            text: card(`👑 ADMINS (${adminList.length})`, adminList.map((a, i) => `${i+1}. @${a.id.split('@')[0]} ${a.admin === 'superadmin' ? '⭐' : ''}`)),
            mentions
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

export async function membres(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us')) return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
    try {
        const meta = await client.groupMetadata(remoteJid)
        const list = meta.participants
        await client.sendMessage(remoteJid, {
            text: card(`👥 MEMBRES (${list.length})`, list.map((m, i) => `${i+1}. @${m.id.split('@')[0]}${m.admin ? ' 👑' : ''}`)),
            mentions: list.map(m => m.id)
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

export async function botstatus(client, message) {
    const remoteJid = message.key.remoteJid
    const mem = process.memoryUsage()
    const up = process.uptime()
    const h = Math.floor(up/3600), m = Math.floor((up%3600)/60), s = Math.floor(up%60)
    await client.sendMessage(remoteJid, {
        text: card('🤖 STATUT BOT', [
            `Uptime : *${h}h ${m}m ${s}s*`,
            `RAM    : *${(mem.rss/1024/1024).toFixed(1)} MB*`,
            `Heap   : *${(mem.heapUsed/1024/1024).toFixed(1)} MB*`,
            `Node   : *${process.version}*`,
            '---',
            `Statut : *En ligne* ✅`,
        ])
    }, { quoted: message })
}

export async function speed(client, message) {
    const remoteJid = message.key.remoteJid
    const start = Date.now()
    await client.sendMessage(remoteJid, { text: '📡 Test...' }, { quoted: message })
    const lat = Date.now() - start
    await client.sendMessage(remoteJid, {
        text: card('📡 SPEED TEST', [
            `Latence : *${lat}ms*`,
            `Qualité : *${lat < 200 ? '🟢 Excellent' : lat < 500 ? '🟡 Bon' : '🔴 Lent'}*`,
        ])
    }, { quoted: message })
}

export async function rapport(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us')) return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
    try {
        const meta = await client.groupMetadata(remoteJid)
        const total = meta.participants.length
        const ad = meta.participants.filter(p => p.admin).length
        await client.sendMessage(remoteJid, {
            text: card('📊 RAPPORT GROUPE', [
                `Total   : *${total}*`,
                `Admins  : *${ad}*`,
                `Membres : *${total - ad}*`,
                `Ratio   : *${((ad/total)*100).toFixed(1)}%*`,
                `Restrict: *${meta.announce ? 'Activée' : 'Désactivée'}*`,
            ])
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

export async function invite(client, message) {
    const remoteJid = message.key.remoteJid
    if (!remoteJid.includes('@g.us')) return client.sendMessage(remoteJid, { text: error('Réservé aux groupes.') }, { quoted: message })
    try {
        const code = await client.groupInviteCode(remoteJid)
        await client.sendMessage(remoteJid, {
            text: card('🔗 LIEN INVITATION', [
                `https://chat.whatsapp.com/${code}`,
                '---',
                '⚠️ Partage avec précaution.',
            ])
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

const groupRules = new Map()
export async function regle(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const args = text.trim().split(/\s+/).slice(1).join(' ')
    if (args) {
        groupRules.set(remoteJid, args)
        await client.sendMessage(remoteJid, { text: success('Règles enregistrées !') }, { quoted: message })
    } else {
        const rules = groupRules.get(remoteJid) || 'Aucune règle définie.'
        await client.sendMessage(remoteJid, {
            text: card('📜 RÈGLES DU GROUPE', [rules])
        }, { quoted: message })
    }
}

export async function define(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const mot = text.trim().split(/\s+/).slice(1).join(' ')
    if (!mot) return client.sendMessage(remoteJid, { text: error('Usage : .define <mot>') }, { quoted: message })
    try {
        const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(mot)}`, { timeout: 8000 })
        const def = res.data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition
        if (def) return client.sendMessage(remoteJid, {
            text: card(`📖 DÉFINITION : ${mot.toUpperCase()}`, [def])
        }, { quoted: message })
        throw new Error()
    } catch {
        try {
            const res = await axios.get(`https://fr.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(mot)}`, { timeout: 8000 })
            const def = res.data?.fr?.[0]?.definitions?.[0]?.definition?.replace(/<[^>]*>/g, '')
            if (def) return client.sendMessage(remoteJid, {
                text: card(`📖 DÉFINITION : ${mot.toUpperCase()}`, [def])
            }, { quoted: message })
        } catch {}
        await client.sendMessage(remoteJid, { text: error(`"${mot}" introuvable.`) }, { quoted: message })
    }
}

export async function convert(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const args = text.trim().split(/\s+/)
    const amount = parseFloat(args[1])
    const from = (args[2] || 'USD').toUpperCase()
    const to = (args[3] || 'EUR').toUpperCase()
    if (isNaN(amount)) return client.sendMessage(remoteJid, { text: error('Usage : .convert 100 USD EUR') }, { quoted: message })
    try {
        const res = await axios.get(`https://api.frankfurter.app/latest?from=${from}&to=${to}`, { timeout: 8000 })
        const rate = res.data?.rates?.[to]
        if (!rate) throw new Error('Devise inconnue')
        await client.sendMessage(remoteJid, {
            text: card('💱 CONVERSION', [
                `${amount} *${from}* → *${(amount * rate).toFixed(2)} ${to}*`,
                `Taux : 1 ${from} = ${rate} ${to}`,
            ])
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.message) }, { quoted: message })
    }
}

export default { profil, groupinfo, admins, membres, botstatus, speed, rapport, invite, regle, define, convert }

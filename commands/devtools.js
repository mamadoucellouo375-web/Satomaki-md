// commands/devtools.js - Outils dev : npm, GitHub repo info, clone (adapté de QUEEN-LORA)
import axios from 'axios'
import { card, error } from '../utils/design.js'

export async function npmSearch(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const pkg = text.trim().split(/\s+/).slice(1).join(' ')

    if (!pkg) return client.sendMessage(remoteJid, { text: card('NPM', ['Usage : .npm <nom-du-paquet>']) }, { quoted: message })

    try {
        const { data } = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, { timeout: 15000 })
        const latest = data['dist-tags']?.latest
        await client.sendMessage(remoteJid, {
            text: card('NPM PACKAGE', [
                `Nom     : ${pkg}`,
                `Version : ${latest || '-'}`,
                `Licence : ${data.license || 'Inconnue'}`,
                `Desc    : ${(data.description || '-').substring(0, 150)}`,
                '---',
                `https://www.npmjs.com/package/${pkg}`
            ])
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.response?.status === 404 ? 'Paquet introuvable.' : e.message) }, { quoted: message })
    }
}

export async function githubRepo(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const repoName = text.trim().split(/\s+/).slice(1).join(' ')

    if (!repoName) return client.sendMessage(remoteJid, { text: card('GITHUB REPO', ['Usage : .srepo owner/repo']) }, { quoted: message })

    try {
        const { data } = await axios.get(`https://api.github.com/repos/${repoName}`, { timeout: 15000 })
        await client.sendMessage(remoteJid, {
            text: card('GITHUB REPO', [
                `Nom     : ${data.name}`,
                `Owner   : ${data.owner.login}`,
                `⭐ Stars : ${data.stargazers_count}`,
                `🍴 Forks : ${data.forks_count}`,
                `Desc    : ${data.description || '-'}`,
                `Créé le : ${new Date(data.created_at).toLocaleDateString('fr-FR')}`,
                '---',
                data.html_url
            ])
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error(e.response?.status === 404 ? 'Dépôt introuvable.' : e.message) }, { quoted: message })
    }
}

export async function gitclone(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const link = text.trim().split(/\s+/).slice(1).join(' ')

    if (!link) return client.sendMessage(remoteJid, { text: card('GITCLONE', ['Usage : .gitclone https://github.com/user/repo']) }, { quoted: message })

    const m = link.match(/github\.com\/([^\/\s]+)\/([^\/\s]+?)(?:\.git)?(?:\/.*)?$/i)
    if (!m) return client.sendMessage(remoteJid, { text: error('Lien GitHub invalide.') }, { quoted: message })

    const [, owner, repoRaw] = m
    const repo = repoRaw.replace(/\.git$/, '')
    const zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball`

    try {
        await client.sendMessage(remoteJid, {
            document: { url: zipUrl },
            fileName: `${repo}.zip`,
            mimetype: 'application/zip',
            caption: card('GITCLONE', [`Dépôt : ${owner}/${repo}`])
        }, { quoted: message })
    } catch (e) {
        await client.sendMessage(remoteJid, { text: error('Dépôt introuvable ou trop volumineux.') }, { quoted: message })
    }
}

// pair.js — Génère un code de couplage via un processus enfant isolé
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import configmanager from '../utils/configmanager.js'
import { card, error, loading } from '../utils/design.js'

const pending = new Map()

export async function pair(client, message) {
    const remoteJid = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const raw = text.trim().split(/\s+/)[1]

    if (!raw) return client.sendMessage(remoteJid, {
        text: card('PAIR', [
            'Usage : .pair <numéro>',
            'Ex    : .pair 221711202436',
            '---',
            'Génère un code de couplage WhatsApp.',
        ])
    }, { quoted: message })

    const num = raw.replace(/[^0-9]/g, '')
    if (num.length < 7 || num.length > 15)
        return client.sendMessage(remoteJid, { text: error('Numéro invalide.') }, { quoted: message })

    if (pending.has(num))
        return client.sendMessage(remoteJid, { text: error(`Code déjà en cours pour ${num}. Attends 60s.`) }, { quoted: message })

    pending.set(num, true)
    await client.sendMessage(remoteJid, { text: loading(`Génération du code pour ${num}`) }, { quoted: message })

    const sessDir  = path.resolve('database', 'pair_sessions', num)
    const script   = path.resolve('database', 'pair_sessions', `pair_${num}.mjs`)

    fs.mkdirSync(path.dirname(script), { recursive: true })

    // Script enfant — attend la connexion avant de demander le code
    fs.writeFileSync(script, `
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } from '@crysnovax/baileys'
import pino from 'pino'

async function run() {
    try {
        const { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(${JSON.stringify(sessDir)})

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            markOnlineOnConnect: false,
            browser: Browsers.ubuntu('Chrome'),
        })

        sock.ev.on('creds.update', saveCreds)

        // Attendre que la connexion soit prête (ou timeout)
        const connected = await new Promise((resolve) => {
            sock.ev.on('connection.update', ({ connection }) => {
                if (connection === 'open') resolve(true)
                if (connection === 'close') resolve(false)
            })
            setTimeout(() => resolve(null), 15000)
        })

        // Demander le code quelle que soit la connexion (fonctionne même avant open)
        const code = await sock.requestPairingCode(${JSON.stringify(num)}, 'SATOMAKI')
        process.stdout.write('CODE:' + code)
        await new Promise(r => setTimeout(r, 1000))
        process.exit(0)
    } catch(e) {
        process.stdout.write('ERROR:' + (e?.message || String(e)))
        process.exit(1)
    }
}
run()
`)

    let out = '', settled = false

    const child = spawn(process.execPath, [script], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env }
    })

    child.stdout.on('data', d => { out += d.toString() })
    child.stderr.on('data', d => { out += d.toString() })

    const cleanup = () => {
        pending.delete(num)
        try { fs.unlinkSync(script) } catch {}
        try { fs.rmSync(sessDir, { recursive: true, force: true }) } catch {}
    }

    // Timeout global 45s
    const timer = setTimeout(() => {
        if (settled) return
        settled = true
        try { child.kill('SIGKILL') } catch {}
        cleanup()
        client.sendMessage(remoteJid, {
            text: error('Timeout — WhatsApp met trop de temps à répondre.\nRéessaie dans quelques secondes.')
        }, { quoted: message }).catch(() => {})
    }, 45000)

    child.on('error', e => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        cleanup()
        client.sendMessage(remoteJid, { text: error(`Erreur process : ${e.message}`) }, { quoted: message }).catch(() => {})
    })

    child.on('close', async () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        cleanup()

        const codeM = out.match(/CODE:(\S+)/)
        const errM  = out.match(/ERROR:(.+)/)

        if (codeM) {
            const code = codeM[1].trim()

            // Enregistrer la config si nouveau numéro
            if (!configmanager.config.users[num]) {
                configmanager.config.users[num] = {
                    sudoList: [`${num}@s.whatsapp.net`],
                    tagAudioPath: 'database/DigiX.mp3',
                    antilink: false, response: true, autoreact: false,
                    prefix: '.', reaction: '✠', welcome: true,
                    record: false, type: false, publicMode: false,
                }
                configmanager.save()
            }

            await client.sendMessage(remoteJid, {
                text: card('CODE DE COUPLAGE', [
                    `Numéro : *${num}*`,
                    `Code   : *${code}*`,
                    '---',
                    '1. Ouvre WhatsApp sur ce numéro',
                    '2. Paramètres → Appareils liés',
                    '3. Lier un appareil',
                    '4. Lier avec numéro de téléphone',
                    `5. Saisis : *${code}*`,
                    '---',
                    'Expire dans 60 secondes.',
                ])
            }, { quoted: message })

        } else {
            // Afficher l'erreur brute pour déboguer
            const msg = errM ? errM[1].trim() : out.trim().slice(0, 300) || 'Erreur inconnue'
            await client.sendMessage(remoteJid, {
                text: error(`Échec de génération du code.\n\n${msg}\n\nVérifie que le numéro est sur WhatsApp.`)
            }, { quoted: message })
        }
    })
}

export default { pair }

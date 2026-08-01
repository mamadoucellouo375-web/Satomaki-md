import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from 'baileys';
import readline from 'readline';
import deployAsPremium from '../utils/DigixV.js';
import configmanager from '../utils/configmanager.js';
import pino from 'pino';
import fs from 'fs';

const data = 'sessionData';

async function getUserNumber() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question('📲 Enter your WhatsApp number (with country code, e.g., 243xxxx): ', (number) => {
            rl.close();
            resolve(number.trim());
        });
    });
}

async function connectToWhatsapp(handleMessage) {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(version);

    const { state, saveCreds } = await useMultiFileAuthState(data);

    const sock = makeWASocket({
        version: version,
        auth: state,
        printQRInTerminal: false,
        // ⚠️ syncFullHistory désactivé : télécharge tout l'historique WhatsApp
        // à chaque reconnexion, gros coût RAM/temps sur un serveur à ressources limitées.
        syncFullHistory: false,
        markOnlineOnConnect: true,
        logger: pino({ level: 'silent' }),
        keepAliveIntervalMs: 10000,
        connectTimeoutMs: 60000,
        generateHighQualityLinkPreview: true,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const reason = lastDisconnect?.error?.toString() || 'unknown';
            console.log('❌ Disconnected:', reason, 'StatusCode:', statusCode);

            // ✅ Fix Bad MAC / Bad Session — nettoyer les sessions Signal corrompues et reconnecter
            if (reason.includes('Bad MAC') || reason.includes('bad-mac') || reason.includes('Bad Session')) {
                console.log('🧹 Bad MAC détecté — nettoyage des sessions corrompues...');
                try {
                    const sessionDir = `./${data}`;
                    const files = fs.readdirSync(sessionDir);
                    for (const file of files) {
                        if (file !== 'creds.json' && (file.endsWith('.json') || file.endsWith('.bin'))) {
                            fs.unlinkSync(`${sessionDir}/${file}`);
                            console.log(`🗑️ Supprimé: ${file}`);
                        }
                    }
                    console.log('✅ Sessions nettoyées — reconnexion dans 3 secondes...');
                } catch (cleanErr) {
                    console.error('❌ Erreur nettoyage:', cleanErr.message);
                }
                setTimeout(() => connectToWhatsapp(handleMessage), 3000);
                return;
            }

            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('🔄 Reconnecting in 5 seconds...');
                setTimeout(() => connectToWhatsapp(handleMessage), 5000);
            } else {
                console.log('🚫 Logged out permanently. Please reauthenticate manually.');
            }
        } else if (connection === 'connecting') {
            console.log('⏳ Connecting...');
        } else if (connection === 'open') {
            console.log('✅ WhatsApp connection established!');

            // --- FONCTIONNALITÉ WELCOME MESSAGE ---
            try {
                const chatId = '221706855759@s.whatsapp.net'; // ton numéro ou le groupe cible
                const imagePath = './database/DigixCo.jpg';

                if (!fs.existsSync(imagePath)) {
                    console.warn('⚠️ Image not found at path:', imagePath);
                }

                const messageText = `
╔══════════════════╗
      *BLADE SHADOW MD Connected Successfully* 🚀
╠══════════════════╣
> "Always Forward. satomaki md, one of the best."
╚══════════════════╝

* Mr sora Dev *
                `;

                await sock.sendMessage(chatId, {
                    image: { url: imagePath },
                    caption: messageText,
                    footer: '💻 Powered by DigiX Crew',
                });

                console.log('📩 Welcome message sent successfully!');
            } catch (err) {
                console.error('❌ Error sending welcome message:', err);
            }
            

            sock.ev.on('messages.upsert', async (msg) => handleMessage(sock, msg));
        }
    });

    setTimeout(async () => {
        if (!state.creds.registered) {
            console.log('⚠️ Not logged in. Preparing pairing process...');
            try {
                const asPremium = true; // await deployAsPremium();
                const number = 221706855759; // mettez votre numéro WhatsApp 

                if (asPremium === true) {
                    configmanager.premiums.premiumUser['c'] = { creator: '221706855759' };
                    configmanager.saveP();
                    configmanager.premiums.premiumUser['p'] = { premium: number };
                    configmanager.saveP();
                }

                console.log(`🔄 Requesting pairing code for ${number}`);
                const code = await sock.requestPairingCode(number,'NOVASOUL');
                console.log('📲 Pairing Code:', code);
                console.log('👉 Enter this code on your WhatsApp app to pair.');

                setTimeout(() => {
                    configmanager.config.users[number] = {
                        sudoList: ['221706855759@s.whatsapp.net'], // emplace par ton numéro WhatsApp 
                        tagAudioPath: 'database/DigiX.mp3',
                        antilink: true,
                        response: true,
                        autoreact: false,
                        prefix: '.',
                        reaction: '🎯',
                        welcome: false,
                        record: true,
                        type: false,
                        publicMode: false,
                    };
                    configmanager.save();
                }, 2000);
            } catch (e) {
                console.error('❌ Error while requesting pairing code:', e);
            }
        }
    }, 5000);

    return sock;
}

export default connectToWhatsapp;


import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from 'baileys';
import readline from 'readline';
import deployAsPremium from '../utils/DigixV.js';
import configmanager from '../utils/configmanager.js';
import pino from 'pino';
import fs from 'fs';

const data = 'sessionData';
let reconnectAttempts = 0;
let activeSock = null;

// ─── File d'attente pour les messages sortants ──────────────────
// Envoyer trop de messages trop vite (rafales) est un des comportements que
// WhatsApp associe au spam et qui peut faire bannir un self-bot. On sérialise
// tous les envois avec un petit délai minimum entre chacun, sans changer la
// façon dont les commandes appellent client.sendMessage.
const MIN_DELAY_MS = 250;
let sendQueue = Promise.resolve();
let lastSendTime = 0;

function wrapSendMessageWithQueue(sock) {
    const original = sock.sendMessage.bind(sock);
    sock.sendMessage = (...args) => {
        const result = sendQueue.then(async () => {
            const wait = Math.max(0, MIN_DELAY_MS - (Date.now() - lastSendTime));
            if (wait > 0) await new Promise(r => setTimeout(r, wait));
            lastSendTime = Date.now();
            return original(...args);
        });
        // Empêche une erreur d'un envoi de casser la file pour les suivants
        sendQueue = result.catch(() => {});
        return result;
    };
}

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

    activeSock = sock;
    wrapSendMessageWithQueue(sock);
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
                reconnectAttempts++;
                // Backoff progressif : 5s, 10s, 20s, 40s, plafonné à 60s
                const delay = Math.min(5000 * Math.pow(2, reconnectAttempts - 1), 60000);
                console.log(`🔄 Reconnecting in ${delay / 1000}s... (tentative ${reconnectAttempts})`);
                setTimeout(() => connectToWhatsapp(handleMessage), delay);
            } else {
                console.log('🚫 Logged out permanently. Please reauthenticate manually.');
            }
        } else if (connection === 'connecting') {
            console.log('⏳ Connecting...');
        } else if (connection === 'open') {
            reconnectAttempts = 0;
            console.log('✅ WhatsApp connection established!');

            // --- FONCTIONNALITÉ WELCOME MESSAGE ---
            try {
                const chatId = '243802991906@s.whatsapp.net'; // ton numéro ou le groupe cible
                const imagePath = './database/DigixCo.jpg';

                if (!fs.existsSync(imagePath)) {
                    console.warn('⚠️ Image not found at path:', imagePath);
                }

                const messageText = `
╔══════════════════╗
      *BLADE SHADOW MD Connected Successfully* 🚀
╠══════════════════╣
> "Always Forward. Digital Crew, one of the best."
╚══════════════════╝

*BY DEV SORA*
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
                const number = 243802991906; // mettez votre numéro WhatsApp 

                if (asPremium === true) {
                    configmanager.premiums.premiumUser['c'] = { creator: '243802991906' };
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
                        sudoList: ['243802991906@s.whatsapp.net'], // emplace par ton numéro WhatsApp 
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

// Arrêt propre : ferme proprement la connexion WhatsApp au lieu de couper
// brutalement le process (évite les soucis de session "conflict"/"logged out"
// au prochain démarrage).
let shuttingDown = false;
async function gracefulShutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n🛑 Signal ${signal} reçu — fermeture propre de la session WhatsApp...`);
    try {
        if (activeSock) {
            await activeSock.end(undefined);
        }
    } catch (e) {
        console.error('Erreur pendant la fermeture:', e.message);
    }
    process.exit(0);
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));


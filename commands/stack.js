// commands/stack.js

// @cat: media

// Commande pour envoyer plusieurs stickers d'un personnage

import axios from 'axios';





// Base de données des personnages et leurs stickers

const characters = {

    nova: {

        name: "Nova",

        stickers: [

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null

        ]

    },

    sakamoto: {

        name: "Sakamoto",

        stickers: [

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null

        ]

    },

    spider: {

        name: "Spider-Man",

        stickers: [

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null

        ]

    },

    alya: {

        name: "Alya",

        stickers: [

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null

        ]

    },

    goku: {

        name: "Goku",

        stickers: [

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null

        ]

    },

    naruto: {

        name: "Naruto",

        stickers: [

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null

        ]

    },

    luffy: {

        name: "Luffy",

        stickers: [

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null,

            null

        ]

    }

};

// Personnages disponibles

const availableChars = Object.keys(characters).join(', ');

async function stackCommand(client, message, args) {

    const remoteJid = message.key.remoteJid;

    

    // Extraire le nombre et le nom

    let count = parseInt(args[0]);

    let character = args[1]?.toLowerCase();

    

    // Si l'utilisateur a tapé "stack nova 7" au lieu de "stack 7 nova"

    if (isNaN(count) && character) {

        count = parseInt(args[1]);

        character = args[0]?.toLowerCase();

    }

    

    // Vérifier les paramètres

    if (isNaN(count) || !character) {

        const helpText = 

`📦 *STACK STICKERS*

📝 *COMMANDE :*

• *stack [nombre] [personnage]* - Envoie plusieurs stickers

💡 *EXEMPLES :*

• *stack 5 nova*

• *stack 3 sakamoto*

• *stack 7 spider*

🎭 *PERSONNAGES DISPONIBLES :*

${availableChars}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━



*${CHANNEL_NAME}*



> *© 𝐌𝐫 𝐒𝐀𝐊𝐀𝐌𝐎𝐓𝐎 🍒*`;

        

        await client.sendMessage(remoteJid, { text: helpText });

        return;

    }

    

    // Limiter le nombre maximum de stickers (pour éviter le spam)

    if (count > 15) {

        await client.sendMessage(remoteJid, { text: "❌ *Maximum 15 stickers par commande !*" });

        return;

    }

    

    if (count < 1) {

        await client.sendMessage(remoteJid, { text: "❌ *Le nombre doit être supérieur à 0 !*" });

        return;

    }

    

    // Vérifier si le personnage existe

    const charData = characters[character];

    if (!charData) {

        await client.sendMessage(remoteJid, { text: `❌ *Personnage "${character}" non trouvé !*\n\nPersonnages disponibles : ${availableChars}` });

        return;

    }

    

    const stickers = charData.stickers;

    const charName = charData.name;

    

    await client.sendMessage(remoteJid, { text: `📦 *Envoi de ${count} stickers ${charName}...*` });

    

    // Envoyer les stickers

    let sent = 0;

    for (let i = 0; i < count; i++) {

        // Prendre un sticker aléatoire dans la liste

        const randomSticker = stickers[Math.floor(Math.random() * stickers.length)];

        

        try {

            await client.sendMessage(remoteJid, {

                sticker: { url: randomSticker }

            });

            sent++;

            

            // Petit délai entre chaque sticker pour éviter les problèmes

            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {

            console.error(`Erreur envoi sticker ${i+1}:`, error.message);

        }

    }

    

    await client.sendMessage(remoteJid, { text: `✅ *${sent}/${count} stickers ${charName} envoyés !*` });

}

export default stackCommand;
import configmanager from "../utils/configmanager.js";

const number = '221711202436'
configmanager.config.users[number] = {
    sudoList: ['221711202436@s.whatsapp.net'],
    tagAudioPath: "database/DigiX.mp3",
    antilink: true,
    response: true,
    autoreact: false,
    prefix: ".",
    reaction: "✠",
    welcome: true,
    record: true,
    type: true,
    publicMode: false,
}
configmanager.save()

configmanager.premiums.premiumUser[`p`] = {
    premium: number,
} 
configmanager.saveP()

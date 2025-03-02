const config = require('../config')
const {cmd , commands} = require('../command')
const os = require("os")
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')
cmd({
    pattern: "alive",
    desc: "Check bot online or no.",
    category: "main",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
return await conn.sendMessage(from,{image: {url: config.ALIVE_IMG},caption: config.ALIVE_MSG},{quoted: mek})
}catch(e){
console.log(e)
reply(`${e}`)
}
})

//============ping=======
cmd({
    pattern: "ping",
    react: "⚡",
    alias: ["speed"],
    desc: "Check bot\'s ping",
    category: "main",
    use: '.ping',
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
var inital = new Date().getTime();
let ping = await conn.sendMessage(from , { text: '```Pinging To index.js!!!```'  }, { quoted: mek } )
var final = new Date().getTime();
return await conn.edit(ping, '*Pong*\n *' + (final - inital) + ' ms* ' )
} catch (e) {
reply(`${e}`)
console.log(e)
}
})


cmd({
    pattern: "status",
    desc: "Check bot status with uptime and buttons.",
    category: "main",
    filename: __filename
},
async(conn, mek, m, { from, quoted, reply }) => {
    try {
        const uptime = process.uptime(); // Get bot uptime in seconds
        const uptimeText = `${Math.floor(uptime / 3600)} hours, ${Math.floor((uptime % 3600) / 60)} minutes`;
        const statusMsg = `Bot is alive!\nUptime: ${uptimeText}`;

        // Button message structure
        await conn.sendMessage(from, {
            text: statusMsg,
            footer: 'Powered by xAI', // Optional footer text
            buttons: [
                { buttonId: 'btn1', buttonText: { displayText: 'Check Ping' }, type: 1 },
                { buttonId: 'btn2', buttonText: { displayText: 'Menu' }, type: 1 }
            ],
            headerType: 1
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply(`Error: ${e}`);
    }
});
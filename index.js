const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    getDevice,
    fetchLatestBaileysVersion,
    jidNormalizedUser,
    getContentType,
    generateWAMessageFromContent,
    prepareWAMessageMedia,
    Browsers,
    proto
} = require('@whiskeysockets/baileys');

const { getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions');
const NodeCache = require('node-cache');
const fs = require('fs');
const P = require('pino');
const config = require('./config');
const qrcode = require('qrcode-terminal');
const util = require('util');
const { sms, downloadMediaMessage } = require('./lib/msg');
const axios = require('axios');
const { File } = require('megajs');

const msgRetryCounterCache = new NodeCache();
const googleTTS = require("google-tts-api");
const prefix = config.PREFIX;
const mode = config.MODE || "public";
const ownerNumber = '94755773910'; // [config.OWNER_NUMBER];
const { mongodb_connection_start, start_numrep_process, upload_to_mongodb, get_data_from_mongodb, storenumrepdata, getstorednumrep } = require('./lib/nonbutton');

//===================SESSION-AUTH============================
if (!fs.existsSync(__dirname + '/auth_info_baileys/creds.json')) {
    if (!config.SESSION_ID) return console.log('Please add your session to SESSION_ID env !!');
    const sessdata = config.SESSION_ID;
    const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
    filer.download((err, data) => {
        if (err) {
            console.error('Error downloading session:', err);
            return;
        }
        fs.writeFile(__dirname + '/auth_info_baileys/creds.json', data, () => {
            console.log("Checking Session ID ⏳");
            connectToWA();
        });
    });
} else {
    connectToWA();
}

const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

// Function to generate random delay (in milliseconds)
function getRandomDelay(min = 1000, max = 5000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get random browser
function getRandomBrowser() {
    const platforms = ['macOS', 'windows', 'ubuntu'];
    const browsers = ['Chrome', 'Firefox', 'Safari'];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const browser = browsers[Math.floor(Math.random() * browsers.length)];
    return Browsers[platform](browser);
}

async function connectToWA() {
    const connectDB = require('./lib/mongodb');
    connectDB();
    const { readEnv } = require('./lib/database');
    const config = await readEnv();
    const prefix = config.PREFIX;

    console.log("Connecting Bot To WhatsApp 🤖");
    const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/auth_info_baileys/');
    var { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: getRandomBrowser(), // Use random browser fingerprint
        syncFullHistory: false, // Disable full history sync to reduce load
        auth: state,
        version,
        getMessage: async (key) => {
            return { conversation: 'ignored' }; // Custom message getter to avoid aggressive polling
        }
    });

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('Reconnecting...');
                await sleep(getRandomDelay(5000, 10000)); // Random delay before reconnect
                connectToWA();
            }
        } else if (connection === 'open') {
            console.log('Whatsapp Login Successfully ✅');
            start_numrep_process();
            
            const path = require('path');
            let cleanupNewsService = null;
            
            fs.readdirSync("./plugins/").forEach((plugin) => {
                if (path.extname(plugin).toLowerCase() == ".js") {
                    const pluginModule = require("./plugins/" + plugin);
                    if (pluginModule.startNewsService) {
                        cleanupNewsService = pluginModule.startNewsService(conn);
                    }
                }
            });
            
            console.log('Plugins installed ✅');
            console.log('Bot connected ✅');
            await conn.sendMessage(`${ownerNumber}@s.whatsapp.net`, { text: "> Connected to whatsapp" });

            conn.ev.on('connection.update', (update) => {
                if (update.connection === 'close' && cleanupNewsService) {
                    cleanupNewsService();
                }
            });
        }
    });

    conn.ev.on('creds.update', saveCreds);

    conn.getstorednumrep = async (quotedid, jid, num, conn, mek) => {
        return await getstorednumrep(quotedid, jid, num, conn, mek);
    };

    //------- *STATUS AUTO REACT & AUTO FEATURES WITH RATE LIMITING* ----------
    conn.ev.on('messages.upsert', async (mek) => {
        mek = mek.messages[0];
        if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_READ_STATUS === "true") {
            await conn.readMessages([mek.key]);
            await sleep(getRandomDelay()); // Random delay before reacting
            const emoji = '💜';
            await conn.sendMessage(mek.key.remoteJid, {
                react: {
                    text: emoji,
                    key: mek.key,
                } 
            }, { statusJidList: [mek.key.participant] });
        }

        const m = sms(conn, mek);
        const type = getContentType(mek.message);
        const content = JSON.stringify(mek.message);
        const from = mek.key.remoteJid;
        
        // Auto Typing with random delay
        if (config.ALWAYS_TYPING === "true") {
            await conn.sendPresenceUpdate('composing', from);
            await sleep(getRandomDelay(500, 2000)); // Random delay to simulate human typing
        }

        // Auto Voice Recording with random delay
        if (config.ALWAYS_RECORDING === "true") {
            await conn.sendPresenceUpdate('recording', from);
            await sleep(getRandomDelay(1000, 3000)); // Random delay to simulate recording
        }

        // Auto Like Reaction with rate limiting
        const likeReactions = ['❤️', '👍', '😍'];
        if (Math.random() < 0.5) { // 50% chance to react, reducing spam
            await sleep(getRandomDelay());
            const randomLike = likeReactions[Math.floor(Math.random() * likeReactions.length)];
            await m.react(randomLike);
        }

        const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : [];
        const quotedid = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.stanzaId || null : null;

        let body;
        if (type === 'conversation') {
            body = mek.message.conversation;
        } else if (type === 'extendedTextMessage') {
            const storedNumRep = await getstorednumrep(quotedid, from, mek.message.extendedTextMessage.text, conn, mek);
            body = storedNumRep || mek.message.extendedTextMessage.text || '';
        } else if (type == 'interactiveResponseMessage') {
            body = mek.message.interactiveResponseMessage && mek.message.interactiveResponseMessage.nativeFlowResponseMessage && JSON.parse(mek.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson) && JSON.parse(mek.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id;
        } else if (type == 'templateButtonReplyMessage') {
            body = mek.message.templateButtonReplyMessage && mek.message.templateButtonReplyMessage.selectedId;
        } else if (type === 'extendedTextMessage') {
            body = mek.message.extendedTextMessage.text;
        } else if (type == 'imageMessage' && mek.message.imageMessage && mek.message.imageMessage.caption) {
            body = mek.message.imageMessage.caption;
        } else if (type == 'videoMessage' && mek.message.videoMessage && mek.message.videoMessage.caption) {
            body = mek.message.videoMessage.caption;
        } else {
            body = '';
        }

        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);
        const q = args.join(' ');
        const isGroup = from.endsWith('@g.us');
        const sender = mek.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid);
        const senderNumber = sender.split('@')[0];
        const botNumber = conn.user.id.split(':')[0];
        const pushname = mek.pushName || 'Sin Nombre';
        const isMe = botNumber.includes(senderNumber);
        const isOwner = ownerNumber.includes(senderNumber) || isMe;
        const botNumber2 = await jidNormalizedUser(conn.user.id);
        const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => { }) : '';
        const groupName = isGroup ? groupMetadata.subject : '';
        const participants = isGroup ? await groupMetadata.participants : '';
        const groupAdmins = isGroup ? await getGroupAdmins(participants) : '';
        const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
        const isAdmins = isGroup ? groupAdmins.includes(sender) : false;
       
        const isAnti = (teks) => {
            let getdata = teks;
            for (let i = 0; i < getdata.length; i++) {
                if (getdata[i] === from) return true;
            }
            return false;
        };
        const reply = async (teks) => {
            await sleep(getRandomDelay()); // Delay before replying
            return await conn.sendMessage(from, { text: teks }, { quoted: mek });
        };

        const ownerdata = (await axios.get('https://raw.githubusercontent.com/vimukthioshada/my-md-database/refs/heads/main/satanic.json')).data;
        config.LOGO = ownerdata.imageurl;
        config.BTN = ownerdata.button;
        config.FOOTER = ownerdata.footer;
        config.BTNURL = ownerdata.buttonurl;

        conn.edit = async (mek, newmg) => {
            await sleep(getRandomDelay());
            await conn.relayMessage(from, {
                protocolMessage: {
                    key: mek.key,
                    type: 14,
                    editedMessage: {
                        conversation: newmg
                    }
                }
            }, {});
        };

        conn.sendMsg = async (jid, teks, quoted) => {
            await sleep(getRandomDelay());
            return await conn.sendMessage(jid, { text: teks }, { quoted: quoted });
        };

        conn.storenumrepdata = async (json) => {
            return await storenumrepdata(json);
        };

        conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
            try {
                await sleep(getRandomDelay()); // Delay before sending file
                const response = await axios({
                    method: 'get',
                    url: url,
                    responseType: 'stream',
                    maxContentLength: 100 * 1024 * 1024, // Limit to 100MB
                    maxBodyLength: 100 * 1024 * 1024
                });

                let mime = response.headers['content-type'];
                if (!mime) mime = 'application/octet-stream'; // Fallback MIME type

                if (mime.split("/")[1] === "gif") {
                    return conn.sendMessage(jid, { video: response.data, caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options });
                }
                let type = mime.split("/")[0] + "Message";
                if (mime === "application/pdf") {
                    return conn.sendMessage(jid, { document: response.data, mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options });
                }
                if (mime.split("/")[0] === "image") {
                    return conn.sendMessage(jid, { image: response.data, caption: caption, ...options }, { quoted: quoted, ...options });
                }
                if (mime.split("/")[0] === "video") {
                    return conn.sendMessage(jid, { video: response.data, caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options });
                }
                if (mime.split("/")[0] === "audio") {
                    return conn.sendMessage(jid, { audio: response.data, caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options });
                }

                return reply(`Unsupported file type: ${mime}`);
            } catch (e) {
                console.error('Error streaming file:', e);
                return reply(`Failed to stream file: ${e.message}`);
            }
        };

        conn.sendButtonMessage = async (jid, buttons, quoted, opts = {}) => {
            await sleep(getRandomDelay());
            let header;
            if (opts?.video) {
                var video = await prepareWAMessageMedia({
                    video: { url: opts && opts.video ? opts.video : '' }
                }, { upload: conn.waUploadToServer });
                header = {
                    title: opts && opts.header ? opts.header : '',
                    hasMediaAttachment: true,
                    videoMessage: video.videoMessage,
                };
            } else if (opts?.image) {
                var image = await prepareWAMessageMedia({
                    image: { url: opts && opts.image ? opts.image : '' }
                }, { upload: conn.waUploadToServer });
                header = {
                    title: opts && opts.header ? opts.header : '',
                    hasMediaAttachment: true,
                    imageMessage: image.imageMessage,
                };
            } else {
                header = {
                    title: opts && opts.header ? opts.header : '',
                    hasMediaAttachment: false,
                };
            }

            let message = generateWAMessageFromContent(jid, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2,
                        },
                        interactiveMessage: {
                            body: { text: opts && opts.body ? opts.body : '' },
                            footer: { text: opts && opts.footer ? opts.footer : '' },
                            header: header,
                            nativeFlowMessage: {
                                buttons: buttons,
                                messageParamsJson: ''
                            }
                        }
                    }
                }
            }, { quoted: quoted });
            await conn.sendPresenceUpdate('composing', jid);
            await sleep(1000 * 1);
            return await conn.relayMessage(jid, message["message"], { messageId: message.key.id });
        };

        const msrGet = await fetch(`https://raw.githubusercontent.com/vimukthioshada/my-md-database/refs/heads/main/moviex.json`);
        const msr = (await msrGet.json()).replyMsg;

        if (senderNumber.includes(config.OWNER_NUMBER)) {
            if (config.AUTO_REACT === 'true') {
                await sleep(getRandomDelay());
                const reaction = ["🪀", "💀"];
                const randomReaction = reaction[Math.floor(Math.random() * reaction.length)];
                m.react(randomReaction);
            }
        }

        if (!isOwner && config.MODE === "private") return;
        if (!isOwner && isGroup && config.MODE === "inbox") return;
        if (!isOwner && isGroup && config.MODE === "groups") return;

        const events = require('./command');
        const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
        if (isCmd) {
            const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));
            if (cmd) {
                if (cmd.react) {
                    await sleep(getRandomDelay());
                    conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
                }

                try {
                    cmd.function(conn, mek, m, { from, quoted, body, isCmd, command, prefix, args, q, isGroup, sender, msr, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
                } catch (e) {
                    console.error("[PLUGIN ERROR] " + e);
                }
            }
        }

        events.commands.map(async (command) => {
            if (body && command.on === "body") {
                await sleep(getRandomDelay());
                command.function(conn, mek, m, { from, l, quoted, body, isCmd, prefix, command, args, q, isGroup, sender, msr, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
            } else if (mek.q && command.on === "text") {
                await sleep(getRandomDelay());
                command.function(conn, mek, m, { from, l, quoted, body, isCmd, prefix, command, args, q, isGroup, sender, msr, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
            } else if (
                (command.on === "image" || command.on === "photo") &&
                mek.type === "imageMessage"
            ) {
                await sleep(getRandomDelay());
                command.function(conn, mek, m, { from, l, quoted, body, isCmd, prefix, command, args, q, isGroup, sender, msr, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
            } else if (
                command.on === "sticker" &&
                mek.type === "stickerMessage"
            ) {
                await sleep(getRandomDelay());
                command.function(conn, mek, m, { from, l, quoted, body, isCmd, prefix, command, args, q, isGroup, sender, msr, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
            }
        });
    });

    //--------------------| Bhashi Anti Del |--------------------//
    conn.ev.on('messages.delete', async (message) => {
        if (config.ANTI_DELETE === "true" && message.remoteJid.endsWith('@g.us')) {
            try {
                await sleep(getRandomDelay());
                const deletedMessage = await conn.loadMessage(message.remoteJid, message.id);
                if (deletedMessage) {
                    const deletedContent = deletedMessage.message;

                    let notificationText = `🚨 Deleted Message Detected 🚨\n\n`;
                    notificationText += `From: ${deletedMessage.pushName} (@${deletedMessage.participant.split('@')[0]})\n`;

                    if (deletedContent) {
                        if (deletedContent.conversation) {
                            notificationText += `Message: ${deletedContent.conversation}`;
                        } else if (deletedContent.extendedTextMessage) {
                            notificationText += `Message: ${deletedContent.extendedTextMessage.text}`;
                        } else if (deletedContent.imageMessage) {
                            notificationText += `Message: [Image with caption: ${deletedContent.imageMessage.caption}]`;
                        } else if (deletedContent.videoMessage) {
                            notificationText += `Message: [Video with caption: ${deletedContent.videoMessage.caption}]`;
                        } else {
                            notificationText += `Message: [${Object.keys(deletedContent)[0]} message]`;
                        }
                    } else {
                        notificationText += `Message: [Unable to retrieve deleted content]`;
                    }

                    await conn.sendMessage(message.remoteJid, { text: notificationText });

                    if (deletedContent && (deletedContent.imageMessage || deletedContent.videoMessage)) {
                        const media = await downloadMediaMessage(deletedMessage, 'buffer');
                        await conn.sendMessage(message.remoteJid, { image: media, caption: 'Deleted media' });
                    }
                }
            } catch (error) {
                console.error('Error handling deleted message:', error);
            }
        }
    });
}


app.get("/", (req, res) => res.sendFile(require('path').join(__dirname, "./index.html")));
app.listen(port, () => console.log(`✅ Bhashi - Server Running...`));
setTimeout(() => {
    connectToWA()
}, 4000);

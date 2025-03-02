// plugins/ytsmx.js

const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson, fetchApi } = require('../lib/functions');
const os = require('os');
const fs = require('fs-extra');

const seedr = require('../lib/seedr');
const torrentApi = "https://seedr-new.vercel.app";
const email = "ovimukthi256@gmail.com"; // Seedr.cc account email
const pass = "Oshada2005@"; // Seedr.cc account password

const { storenumrepdata } = require('../lib/nonbutton');

function formatNumber(num) {
    return String(num).padStart(2, '0');
}

// Constants
const url = "Give me movie name ?";
const valid_url = "This Url Type is Invalid";
const not_sudo = 'ඔබ yts.mx package එක ලබා ගෙන නොමැත.🚫 💸 please contact us and purchase the movie download facility 🪀Contact Owner : https://wa.me/+94711451319?text=';
const not_fo = "I can't find anything";
const giveme = "Please give me movie or tv show name";
const err = "Error !!";
const apilink = "https://www.dark-yasiya-api.site";

// Utility function for retrying API requests
async function fetchWithRetry(url, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetchApi(url, { timeout: 10000 }); // 10-second timeout
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Invalid JSON response: ${text.substring(0, 50)}...`);
            }
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(resolve => setTimeout(resolve, delay));
            console.log(`Retry ${i + 1} for URL: ${url} - Error: ${e.message}`);
        }
    }
}

// Utility function to clear Seedr cache
async function clearSeedrCache() {
    try {
        await fetchJson(`${torrentApi}/seedr/clear?email=${email}&pass=${pass}`);
    } catch (e) {
        console.log(`Error clearing Seedr cache: ${e.message}`);
    }
}

// YTS.mx Search Command
cmd({
    pattern: "ytsmx",
    alias: ["mv4", "yts"],
    react: "🎥",
    desc: "Download movie for yts.mx",
    category: "movie",
    use: '.ytsmx < Movie Name >',
    filename: __filename
},
async (conn, mek, m, { from, l, prefix, quoted, body, isCmd, command, args, q, sender, isDev, senderNumber, isPreUser, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const sudoNumber = config.SUDO;
        const isSudo = sudoNumber
            .map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
            .includes(sender);

        if (!isSudo) return reply(not_sudo);

        if (!q) return await reply(giveme);

        const apiUrl = `${apilink}/movie/ytsmx/search?text=${encodeURIComponent(q)}`;
        const movs = await fetchWithRetry(apiUrl);
        let mov = movs.result.data;
        let numrep = [];

        if (mov.length < 1) return await reply(not_fo);

        let cot = `🔮 *𝖬𝖮𝖵𝖨𝖤 𝖲𝖤𝖠𝖱𝖢𝗛 𝖲𝖸𝖲𝖳𝖤𝖬* 🔮\n\n`;

        for (let j = 0; j < mov.length; j++) {
            cot += `*${formatNumber(j + 1)} ||* ${mov[j].title_long}\n`;
            numrep.push(`${prefix}ytsmvjid ${mov[j].id}`);
        }

        const mass = await conn.sendMessage(from, { text: `${cot}\n\n${config.FOOTER}` }, { quoted: mek });
        const jsonmsg = { key: mass.key, numrep, method: 'nondecimal' };
        await storenumrepdata(jsonmsg);
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(`Error in ytsmx command: ${e.message}`);
        reply(`An error occurred: ${e.message || err}`);
    }
});

// YTS.mx Movie JID Command
cmd({
    pattern: "ytsmvjid",
    react: "📽️",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, prefix, l, quoted, body, isCmd, command, args, q, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const sudoNumber = config.SUDO;
        const isSudo = sudoNumber
            .map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
            .includes(sender);

        if (!isSudo) return reply(not_sudo);

        if (!q) return await reply(url);

        const apiUrl = `${apilink}/movie/ytsmx/movie?id=${q}`;
        const anu = await fetchWithRetry(apiUrl);
        let mov = anu.result;

        let cot = `🎬 *𝖬𝖮𝖵𝖨𝖤 𝖣𝖮𝖶𝖭𝖫𝖮𝖠𝖣 𝖲𝖸𝖲𝖳𝖤𝖬* 🎬\n\n   🎞️ Title: ${mov.title}\n   📅 Year: ${mov.year}\n   ⏱ Duration: ${mov.runtime}\n   🖇️ Url: ${mov.url}\n\n▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n\n*${formatNumber(1)} ||* SEND INBOX\n`;

        let numrep = [];
        numrep.push(`${prefix}ytsmvgo ${q}🎈${from}`);

        for (let j = 0; j < config.JIDS.length; j++) {
            for (let i of config.JIDS[j].split(",")) {
                cot += `*${formatNumber(j + 2)} ||* SEND JID: *${i}*\n`;
                numrep.push(`${prefix}ytsmvgo ${q}🎈${i}`);
            }
        }

        const mass = await conn.sendMessage(from, {
            text: `${cot}\n\n${config.FOOTER}`,
            contextInfo: {
                externalAdReply: {
                    title: mov.title,
                    body: config.BODY,
                    mediaType: 1,
                    sourceUrl: mov.url,
                    thumbnailUrl: mov.large_cover_image,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: mek });

        const jsonmsg = { key: mass.key, numrep, method: 'nondecimal' };
        await storenumrepdata(jsonmsg);
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(`Error in ytsmvjid command: ${e.message}`);
        reply(`An error occurred: ${e.message || err}`);
    }
});

// YTS.mx Movie Go Command
cmd({
    pattern: "ytsmvgo",
    react: "📽️",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, prefix, l, quoted, body, isCmd, command, args, q, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const sudoNumber = config.SUDO;
        const isSudo = sudoNumber
            .map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
            .includes(sender);

        if (!isSudo) return reply(not_sudo);

        var inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        var jidx = q.includes('🎈') ? q.split('🎈')[1] : from;

        if (!inp) return await reply(err);

        const apiUrl = `${apilink}/movie/ytsmx/movie?id=${inp}`;
        const move = await fetchWithRetry(apiUrl);
        let mov = move.result;

        let cot = `🎬 *𝖬𝖮𝖵𝖨𝖤 𝖣𝖮𝖶𝖭𝖫𝖮𝖠𝖣 𝖲𝖸𝖲𝖳𝖤𝖬* 🎬\n\n  🎞️ Title: ${mov.title}\n  📅 Year: ${mov.year}\n  🌟 Rating: ${mov.rating}\n  ⏱ Duration: ${mov.runtime}\n  🖇️ Url: ${mov.url}\n  🎀 Genres: ${mov.genres}\n  🔠 Language: ${mov.language}\n\n▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n\n*${formatNumber(1)} ||* Details Card\n`;

        let numrep = [];
        numrep.push(`${prefix}ytsmvdet ${q}`);

        mov.torrents.forEach((movie, index) => {
            cot += `*${formatNumber(index + 2)} ||* ${movie.quality} ( ${movie.size} )\n`;
            numrep.push(`${prefix}ytsdl ${movie.url}🎈${mov.title_long}🎈${movie.quality}🎈${movie.size}🎈${jidx}🎈${mov.large_cover_image}`);
        });

        const mass = await conn.sendMessage(from, {
            image: { url: mov.large_cover_image || mov.background_image || mov.background_image_original || '' },
            caption: `${cot}\n\n${config.FOOTER}`
        }, { quoted: mek });

        const jsonmsg = { key: mass.key, numrep, method: 'nondecimal' };
        await storenumrepdata(jsonmsg);
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(`Error in ytsmvgo command: ${e.message}`);
        reply(`An error occurred: ${e.message || err}`);
    }
});

// YTS.mx Direct Download Command
cmd({
    pattern: "ytsdl",
    react: "⬆",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, prefix, l, quoted, body, isCmd, command, args, q, msr, creator, backup, isGroup, apilink2, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const sudoNumber = config.SUDO;
        const isSudo = sudoNumber
            .map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
            .includes(sender);

        if (!isSudo) return reply(not_sudo);

        if (!q) return reply("❗ *Please give me valid link*");

        var inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        var jidx = q.includes('🎈') ? q.split('🎈')[4] : from;
        var nmf = q.includes('🎈') ? q.split('🎈')[1] : '';
        var quality = q.includes('🎈') ? q.split('🎈')[2] : '';
        var size = q.includes('🎈') ? q.split('🎈')[3] : '';
        var img_s = q.includes('🎈') ? q.split('🎈')[5] : '';

        if (!inp) return await reply(err);
        const jid = jidx || from;

        const up_mg = await conn.sendMessage(from, { text: 'Uploading Your Request Video..⬆' }, { quoted: mek });

        // Use Seedr API to download torrent
        const anu = await fetchJson(`${torrentApi}/seedr/direct?torrent=${encodeURIComponent(inp)}&email=${email}&pass=${pass}`);
        if (!anu.files || !anu.files[0]?.url) {
            throw new Error("Failed to get file URL from Seedr");
        }

        const mvdoc = await conn.sendMessage(jid, {
            document: { url: anu.files[0].url },
            fileName: `${nmf}.mp4`,
            mimetype: 'video/mp4',
            caption: `${nmf} (${quality})\n\n${config.CAPTION}`
        });

        await clearSeedrCache(); // Clear Seedr cache after download
        await conn.sendMessage(from, { delete: up_mg.key });

        if (jidx === from) {
            await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
            await sleep(500 * 1);
        } else {
            await conn.sendMessage(from, { text: 'File Send Successful ✔' }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
            await sleep(500 * 1);
        }
    } catch (e) {
        await clearSeedrCache(); // Ensure cache is cleared on error
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(`Error in ytsdl command: ${e.message}`);
        reply(`An error occurred: ${e.message || err}`);
    }
});

// YTS.mx Movie Details Command
cmd({
    pattern: "ytsmvdet",
    react: "📽️",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, l, quoted, body, prefix, isCmd, backup, command, args, q, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, isBotAdmins, isCreator, isDev, reply }) => {
    try {
        const sudoNumber = config.SUDO;
        const isSudo = sudoNumber
            .map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
            .includes(sender);

        if (!isSudo) return reply(not_sudo);

        if (!q) return await reply(url);

        var inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        var jidx = q.includes('🎈') ? q.split('🎈')[1] : from;

        const apiUrl = `${apilink}/movie/ytsmx/movie?id=${inp}`;
        const anu = await fetchWithRetry(apiUrl);
        let mov = anu.result;

        const name = mov.title;
        const title_long = mov.title_long;
        const date = mov.year;
        const runtime = mov.runtime + " second";
        const rating = mov.rating;
        const genres = mov.genres;
        const desc = mov.description_intro || "N/A";
        const likes = mov.like_count || "N/A";

        let yt = `
🍟 _*${name}*_

🧿 Release Year: ➜ ${date}
⏱️ Duration: ➜ ${runtime}
🎀 Categories: ➜ ${genres}
⭐ Rating: ➜ ${rating}
👍 Likes: ➜ ${likes}
`;

        const jid = jidx || from;
        await conn.sendMessage(jid, {
            image: { url: mov.large_cover_image || mov.background_image || mov.background_image_original || '' },
            caption: yt + `${config.CAPTION}`
        });
        await conn.sendMessage(backup, {
            image: { url: mov.large_cover_image || mov.background_image || mov.background_image_original || '' },
            caption: yt + `${config.CAPTION}`
        });

        if (jidx === from) {
            await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
        } else {
            await conn.sendMessage(from, { text: 'Details Card Sended ✔' }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
        }
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(`Error in ytsmvdet command: ${e.message}`);
        reply(`An error occurred: ${e.message || err}`);
    }
});

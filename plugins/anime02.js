const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('../lib/functions');
const fetch = require('node-fetch');
const os = require('os');
const { File } = require('megajs');
const { storenumrepdata } = require('../lib/nonbutton');

function formatNumber(num) {
    return String(num).padStart(2, '0');
}

//===============================================================================
const url = "Give me movie or TV show name ?";
const valid_url = "This Url Type is Invalid";
const not_sudo = 'Your not premier user 🚫 💸 please contact us and purchase the movie download facility 🌠Contact Owner : 0711451319';
const not_fo = "I can't find anything";
const giveme = "Please give me movie or TV show name";

// API Endpoint for Anime Scraper (Replace with your Replit URL)
const API_URL = 'https://19f9de5d-7d0c-4ef4-bdfc-26c16d03b8c0-00-37qou1nu4a2rs.sisko.replit.dev/'; // Update with your Replit URL

//===============================================================================

cmd({
    pattern: "smv",
    alias: ["mv3", "sin"],
    react: "🎥",
    desc: "Search for movies or TV shows on slanimeclub.co",
    category: "download",
    use: '.smv <Movie/TV Show Name>',
    filename: __filename
},
async (conn, mek, m, { from, l, prefix, quoted, body, isCmd, command, args, q, isGroup, sender, isDev, senderNumber, isPreUser, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q) return await reply(giveme);

        // Search using Anime Scraper API
        const response = await axios.get(`${API_URL}/api/search?search=${encodeURIComponent(q)}`);
        const { results } = response.data;
        var ty = '';
        let numrep = [];

        if (!results || results.length < 1) return await reply(not_fo);

        let cot = `🔮 *𝗦𝗟𝗔𝗡𝗜𝗠𝗘𝗖𝗟𝗨𝗕 𝗠𝗢𝗩𝗜𝗘/𝗧𝗩 𝗦𝗘𝗔𝗥𝗖𝗛 𝗦𝗬𝗦𝗧𝗘𝗠* 🔮\n\n📲 Input: *${q}*\n\n`;

        results.forEach((item, index) => {
            const type = item.link.includes('/movies/') ? 'Movie' : 'TV';
            if (type === 'TV') ty = 'sitvjid ';
            if (type === 'Movie') ty = 'simvjid ';
            cot += ` *${formatNumber(index + 1)} ||* ${item.name} | ${type}\n\n`;
            numrep.push(`${prefix}${ty}${item.link}`);
        });

        const mass = await conn.sendMessage(from, { text: `${cot}\n\n${config.FOOTER}` }, { quoted: mek });
        const jsonmsg = { key: mass.key, numrep, method: 'nondecimal' };
        await storenumrepdata(jsonmsg);
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        reply(`An error occurred: ${e.message}`);
    }
});

cmd({
    pattern: "simvjid",
    react: "📽️",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q) return await reply(url);
        if (!q.includes('slanimeclub.co/movies')) return await reply(valid_url);

        // Get movie details using Anime Scraper API
        const response = await axios.get(`${API_URL}/api/details?url=${encodeURIComponent(q)}`);
        const { movie } = response.data;

        if (!movie) return await reply(not_fo);

        let cot = `🎬 *NADEEN-MD 𝖬𝖮𝖵𝖨𝖤 𝖣𝖮𝖶𝖭𝖫𝖮𝖠𝖣 𝖲𝖸𝖲𝗧𝗘𝗠* 🎬\n\n   📽️ Movie Name: ${movie.title}\n   🍟 Release Date: ${movie.imdbRating.split(' ').pop() || 'N/A'}\n   ⏱ Duration: ${movie.imdbRating.split(' ').pop() || 'N/A'}\n   🖇️ Movie Link: ${q}\n\n*${formatNumber(1)} ||* SEND MOVIE\n`;

        let numrep = [`${prefix}simvgo ${q}🎈${from}`];

        for (let j = 0; j < config.JIDS.length; j++) {
            for (let i of config.JIDS[j].split(",")) {
                cot += `*${formatNumber(j + 2)} ||* SEND JID: *${i}*\n`;
                numrep.push(`${prefix}simvgo ${q}🎈${i}`);
            }
        }

        const mass = await conn.sendMessage(from, { text: `${cot}\n\n${config.FOOTER}` }, { quoted: mek });
        const jsonmsg = { key: mass.key, numrep, method: 'nondecimal' };
        await storenumrepdata(jsonmsg);
        await sleep(1 * 1000);
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        reply(`An error occurred: ${e.message}`);
    }
});

cmd({
    pattern: "simvgo",
    react: "📽️",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        var inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        var jidx = q.includes('🎈') ? q.split('🎈')[1] : from;

        if (!inp || !q.includes('slanimeclub.co/movies')) return await reply(valid_url);

        // Get movie details using Anime Scraper API
        const response = await axios.get(`${API_URL}/api/details?url=${encodeURIComponent(inp)}`);
        const mov = response.data.movie;

        if (!mov) return await reply(not_fo);

        let cot = `🎬 *𝖬𝖮𝖵𝖨𝖤 𝖣𝖮𝖶𝖭𝖫𝖮𝖠𝖣 𝖲𝖸𝖲𝗧𝗘𝗂* 🎬\n\n  📽️ Movie Name: ${mov.title}\n  🍟 Release Date: ${mov.imdbRating.split(' ').pop() || 'N/A'}\n  ⏱ Duration: ${mov.imdbRating.split(' ').pop() || 'N/A'}\n  🖇️ Movie Link: ${inp}\n  🎀 Category: ${mov.imdbRating.split(' ').pop() || 'N/A'}\n  ⭐ Imdb: ${mov.imdbRating.split(' ')[0] || 'N/A'}\n\n*${formatNumber(1)} ||* SEND DETAILS NORMAL IMG\n*${formatNumber(2)} ||* SEND IMAGES\n*${formatNumber(3)} ||* SEND MOVIE\n`;

        let numrep = [`${prefix}simvdet ${q}`, `${prefix}sinhimages ${q}`, `${prefix}sinedirectdl2 ${mov.downloadLink}🎈${mov.title}🎈HD 720p🎈Unknown🎈${jidx}🎈${mov.thumbnail}`];

        const mass = await conn.sendMessage(from, { text: `${cot}\n\n${config.FOOTER}` }, { quoted: mek });
        const jsonmsg = { key: mass.key, numrep, method: 'nondecimal' };
        await storenumrepdata(jsonmsg);
        await sleep(1 * 1000);
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        reply(`An error occurred: ${e.message}`);
    }
});

cmd({
    pattern: "sitvjid",
    react: "📺",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q) return await reply(url);
        if (!q.includes('slanimeclub.co/tvshows')) return await reply(valid_url);

        // Get TV series details using Anime Scraper API
        const response = await axios.get(`${API_URL}/api/details?url=${encodeURIComponent(q)}`);
        const { tvSeries } = response.data;

        if (!tvSeries) return await reply(not_fo);

        let cot = `📺 *𝖳𝖵 𝖲𝗛𝗢𝗪 𝖣𝖮𝗪𝗡𝗟𝗢𝗔𝗗 𝖲𝗬𝗦𝗧𝗀* 📺\n\n  📽 Tv Show Name: ${tvSeries.title}\n  ✨ First Air Date: ${tvSeries.imdbRating.split(' ').pop() || 'N/A'}\n  🤵‍♂️ Director: N/A\n  🖇️ Tv Show Link: ${q}\n\n*${formatNumber(1)} ||* SEND INBOX\n`;

        let numrep = [`${prefix}sitvgo ${q}🎈${from}`];

        for (let j = 0; j < config.JIDS.length; j++) {
            for (let i of config.JIDS[j].split(",")) {
                cot += `*${formatNumber(j + 2)} ||* SEND JID: *${i}*\n`;
                numrep.push(`${prefix}sitvgo ${q}🎈${i}`);
            }
        }

        const mass = await conn.sendMessage(from, { text: `${cot}\n\n${config.FOOTER}` }, { quoted: mek });
        const jsonmsg = { key: mass.key, numrep, method: 'nondecimal' };
        await storenumrepdata(jsonmsg);
        await sleep(1 * 1000);
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        reply(`An error occurred: ${e.message}`);
    }
});

cmd({
    pattern: "sitvgo",
    alias: ["tv", "sintv"],
    react: "📺",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        var inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        var jidx = q.includes('🎈') ? q.split('🎈')[1] : from;

        if (!inp || !q.includes('slanimeclub.co/tvshows')) return await reply(valid_url);

        // Get TV series details using Anime Scraper API
        const response = await axios.get(`${API_URL}/api/details?url=${encodeURIComponent(inp)}`);
        const mov = response.data.tvSeries;

        if (!mov) return await reply(not_fo);

        let cot = `📺 *𝖳𝖵 𝖲𝗛𝗢𝗪 𝖣𝖮𝗪𝗡𝗟𝗢𝗔𝗗 𝖲𝗬𝗦𝗧𝗀* 📺\n\n  📽 Tv Show Name: ${mov.title}\n  ✨ First Air Date: ${mov.imdbRating.split(' ').pop() || 'N/A'}\n  🖇️ Tv Show Link: ${inp}\n  🎀 Categories: N/A\n  🤵‍♂️ Director: N/A\n  ⭐ IMDB RATIN: ${mov.imdbRating.split(' ')[0] || 'N/A'}\n\n*${formatNumber(1)} ||* SEND DETAILS\n`;

        let numrep = [`${prefix}sitvdet ${q}`];

        mov.episodes.forEach((episode, index) => {
            cot += `*${formatNumber(index + 2)} ||* ${episode.name} (Episode ${episode.episodeNumber}) [Download: ${episode.downloadLink || 'N/A'}]\n\n`;
            numrep.push(`${prefix}siepgo ${episode.url}🎈${jidx}`);
        });

        const mass = await conn.sendMessage(from, { text: `${cot}\n\n${config.FOOTER}` }, { quoted: mek });
        const jsonmsg = { key: mass.key, numrep, method: 'nondecimal' };
        await storenumrepdata(jsonmsg);
        await sleep(1 * 1000);
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        reply(`An error occurred: ${e.message}`);
    }
});

cmd({
    pattern: "siepgo",
    react: "📺",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        var inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        var jidx = q.includes('🎈') ? q.split('🎈')[1] : from;

        if (!inp || !q.includes('slanimeclub.co/episodes')) return await reply(valid_url);

        // Get episode details using Anime Scraper API
        const response = await axios.get(`${API_URL}/api/details?url=${encodeURIComponent(inp)}`);
        const { episode } = response.data;

        if (!episode) return await reply(not_fo);

        let cot = `📺 *𝖳𝖵 𝖲𝗛𝗢𝗪 𝖣𝖮𝗪𝗡𝗟𝗢𝗔𝗗 𝖲𝗬𝗦𝗧𝗀* 📺\n\n  📽 Episode Title: ${episode.title}\n  🎡 Episode Name: Episode ${episode.title.split(': ')[1] || 'N/A'}\n  🖇️ Tv Show Link: ${inp}\n\n*${formatNumber(1)} ||* SEND DETAILS NORMAL IMG\n*${formatNumber(2)} ||* SEND IMAGES\n*${formatNumber(3)} ||* SEND EPISODE\n`;

        let numrep = [`${prefix}siepdet ${q}`, `${prefix}sinhimages ${q}`, `${prefix}sinedirectdl2 ${episode.downloadLink}🎈${episode.title}🎈HD 720p🎈Unknown🎈${jidx}🎈${episode.thumbnail}`];

        const mass = await conn.sendMessage(from, { text: `${cot}\n\n${config.FOOTER}` }, { quoted: mek });
        const jsonmsg = { key: mass.key, numrep, method: 'nondecimal' };
        await storenumrepdata(jsonmsg);
        await sleep(1 * 1000);
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        reply(`An error occurred: ${e.message}`);
    }
});

cmd({
    pattern: "simvdet",
    react: "📽️",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, prefix, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isCreator, isDev, isAdmins, reply }) => {
    try {
        if (!q) return await reply(url);
        if (!q.includes('slanimeclub.co/movies')) return await reply(valid_url);

        var inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        var jidx = q.includes('🎈') ? q.split('🎈')[1] : from;

        // Get movie details using Anime Scraper API
        const response = await axios.get(`${API_URL}/api/details?url=${encodeURIComponent(inp)}`);
        const mov = response.data.movie;

        if (!mov) return await reply(not_fo);

        let yt = `
🍟 _*${mov.title}*_

🧿 Release Date: ➜ ${mov.imdbRating.split(' ').pop() || 'N/A'}
⏱️ Duration: ${mov.imdbRating.split(' ').pop() || 'N/A'}
🖇️ Movie Link: ${inp}
🎀 Categories: ${mov.imdbRating.split(' ').pop() || 'N/A'}
⭐ IMDB RATIN: ${mov.imdbRating.split(' ')[0] || 'N/A'}
`;

        const jid = jidx || from;
        await conn.sendMessage(jid, { image: { url: mov.thumbnail }, caption: yt + `\n${config.CAPTION}` });

        await conn.sendMessage(from, { text: 'Details Card Sended ✔' }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
        await sleep(1000 * 1);
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        reply(`An error occurred: ${e.message}`);
    }
});

cmd({
    pattern: "sitvdet",
    react: "📺",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, prefix, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isCreator, isDev, isAdmins, reply }) => {
    try {
        if (!q) return await reply(url);
        if (!q.includes('slanimeclub.co/tvshows')) return await reply(valid_url);

        var inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        var jidx = q.includes('🎈') ? q.split('🎈')[1] : from;

        // Get TV series details using Anime Scraper API
        const response = await axios.get(`${API_URL}/api/details?url=${encodeURIComponent(inp)}`);
        const mov = response.data.tvSeries;

        if (!mov) return await reply(not_fo);

        let yt = `
📺 *Tv Show Name:* ${mov.title}
✨ *First Air Date:* ${mov.imdbRating.split(' ').pop() || 'N/A'}
🖇️ *Tv Show Link:* ${inp}
🎀 *Categories:* N/A
🤵‍♂️ *Director:* N/A
⭐ *IMDB RATIN:* ${mov.imdbRating.split(' ')[0] || 'N/A'}
`;

        const jid = jidx || from;
        await conn.sendMessage(jid, { image: { url: mov.thumbnail }, caption: yt + `\n${config.CAPTION}` });

        await conn.sendMessage(from, { text: 'Details Card Sended ✔' }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
        await sleep(1000 * 1);
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        reply(`An error occurred: ${e.message}`);
    }
});

cmd({
    pattern: "siepdet",
    react: "📺",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, l, quoted, body, prefix, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isCreator, isDev, isAdmins, reply }) => {
    try {
        if (!q) return await reply(url);
        if (!q.includes('slanimeclub.co/episodes')) return await reply(valid_url);

        var inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        var jidx = q.includes('🎈') ? q.split('🎈')[1] : from;

        // Get episode details using Anime Scraper API
        const response = await axios.get(`${API_URL}/api/details?url=${encodeURIComponent(inp)}`);
        const mov = response.data.episode;

        if (!mov) return await reply(not_fo);

        let yt = `
📺 *Episode Title:* ${mov.title}

🎡 *Episode Name:* ${mov.title.split(': ')[1] || 'N/A'}

🖇️ *Tv Show Link:* ${inp}
`;

        const jid = jidx || from;
        await conn.sendMessage(jid, { image: { url: mov.thumbnail }, caption: yt + `\n${config.CAPTION}` });

        await conn.sendMessage(from, { text: 'Details Card Sended ✔' }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
        await sleep(1000 * 1);
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        reply(`An error occurred: ${e.message}`);
    }
});

cmd({
    pattern: "sinedirectdl2",
    alias: ["sinedirectdl"],
    react: "⬆",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q) return reply('"❗ *Please give me valid link*"');

        var inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        var jidx = q.includes('🎈') ? q.split('🎈')[4] : from;
        var nmf = q.includes('🎈') ? q.split('🎈')[1] : '';
        var quality = q.includes('🎈') ? q.split('🎈')[2] : '';
        var size = q.includes('🎈') ? q.split('🎈')[3] : '';
        var thumbnail = q.includes('🎈') ? q.split('🎈')[5] : '';

        if (!inp) return reply("*An error occurred 🧑‍🎨❌*");
        const jid = jidx || from;

        // Handle Google Drive
        if (inp.includes("drive.google.com")) {
            const up_mg = await conn.sendMessage(from, { text: 'Uploading Your Request Movie..⬆' }, { quoted: mek });
            const mvdoc = await conn.sendMessage(jid, {
                document: { url: inp },
                fileName: `[ŋąɖɛɛŋ]${nmf}.mp4`,
                mimetype: "video/mp4",
                caption: `${nmf} ( ${quality} )\nThumbnail: ${thumbnail}\n${config.CAPTION}`
            });
            await conn.sendMessage(from, { delete: up_mg.key });
            await conn.sendMessage(from, { text: 'File Send Successful ✔' }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
            await sleep(1000 * 1);
        }
        // Handle Mega.nz
        else if (inp.includes("mega.nz")) {
            const up_mg = await conn.sendMessage(from, { text: 'Uploading Your Request Movie..⬆' }, { quoted: mek });
            const file = File.fromURL(inp);
            await file.loadAttributes();
            const data = await file.downloadBuffer();
            await conn.sendMessage(jid, {
                document: data,
                mimetype: "video/mp4",
                fileName: `[ŋąɖɛɛŋ]${nmf}.mp4`,
                caption: `${nmf} ( ${quality} )\nThumbnail: ${thumbnail}\n${config.CAPTION}`
            });
            await conn.sendMessage(from, { delete: up_mg.key });
            await conn.sendMessage(from, { text: 'File Send Successful ✔' }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
            await sleep(1000 * 1);
        }
        // Handle Pixeldrain
        else if (inp.includes('https://pixeldrain.com/u/')) {
            inp = inp.replace('/u/', '/api/file/');
            const up_mg = await conn.sendMessage(from, { text: 'Uploading Your Request Video..⬆' }, { quoted: mek });
            const mvdoc = await conn.sendMessage(jid, {
                document: { url: inp + "?download" },
                fileName: `[ŋąɖɛɛŋ]${nmf}.mp4`,
                mimetype: "video/mp4",
                caption: `${nmf} ( ${quality} )\nThumbnail: ${thumbnail}\n${config.CAPTION}`
            });
            await conn.sendMessage(from, { delete: up_mg.key });
            await conn.sendMessage(from, { text: 'File Send Successful ✔' }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
            await sleep(1000 * 1);
        } else {
            await conn.sendMessage(from, { text: not_fo });
        }
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        reply(`An error occurred: ${e.message}`);
    }
});

cmd({
    pattern: "sinhimages",
    react: "📽",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, l, quoted, body, prefix, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isCreator, isDev, isAdmins, reply }) => {
    try {
        var inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        var jidx = q.includes('🎈') ? q.split('🎈')[1] : from;

        const input = inp ? inp : q;

        if (input.includes("slanimeclub.co/movies")) {
            // Get movie details using Anime Scraper API
            const response = await axios.get(`${API_URL}/api/details?url=${encodeURIComponent(input)}`);
            const movie = response.data.movie;

            if (!movie || !movie.thumbnail) return await reply(not_fo);
            const jid = jidx || from;

            await conn.sendMessage(jid, { image: { url: movie.thumbnail }, caption: config.CAPTION });
            await conn.sendMessage(from, { text: 'Details Card Sended ✔' }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
            await sleep(1000 * 1);
        } else if (input.includes("slanimeclub.co/episodes")) {
            // Get episode details using Anime Scraper API
            const response = await axios.get(`${API_URL}/api/details?url=${encodeURIComponent(input)}`);
            const episode = response.data.episode;

            if (!episode || !episode.thumbnail) return await reply(not_fo);
            const jid = jidx || from;

            await conn.sendMessage(jid, { image: { url: episode.thumbnail }, caption: config.CAPTION });
            await conn.sendMessage(from, { text: 'Details Card Sended ✔' }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
            await sleep(1000 * 1);
        }
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        reply(`An error occurred: ${e.message}`);
    }
});

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
const url = "Give me movie name ?";
const valid_url = "This Url Type is Invalid";
const not_sudo = 'Your not premier user 🚫 💸 please contact us and purchase the movie download facility 🌠Contact Owner : 0711451319';
const not_fo = "I can't find anything";
const giveme = "Please give me movie or tv show name";

const apilink = "https://www.dark-yasiya-api.site";
//===============================================================================

cmd({
    pattern: "smv",
    alias: ["mv3", "sin"],
    react: "🎥",
    desc: "Download movie for sinhalasub.lk",
    category: "download",
    use: '.sinhalasub < Movie Name >',
    filename: __filename
},
async (conn, mek, m, { from, l, prefix, quoted, body, isCmd, command, args, q, isGroup, sender, isDev, senderNumber, isPreUser, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q) return await reply(giveme);

        const response = await fetch(`https://www.dark-yasiya-api.site/movie/sinhalasub/search?text=${encodeURIComponent(q)}`);
        const movs = await response.json();
        var ty = '';
        let mov = movs.result?.data || [];
        let numrep = [];

        if (!mov || mov.length < 1) return await reply(not_fo);

        let cot = `🔮 *𝗦𝗜𝗡𝗛𝗔𝗟𝗔𝗦𝗨𝗕𝗟𝗔 𝗠𝗢𝗩𝗜𝗘 𝗦𝗘𝗔𝗥𝗖𝗛 𝗦𝗬𝗖𝗦𝗧𝗘𝗠* 🔮\n\n📲 Input: *${q}*\n\n`;

        mov.forEach((movie, index) => {
            if (movie.type === 'TV') ty = 'sitvjid ';
            if (movie.type === 'Movie') ty = 'simvjid ';
            cot += ` *${formatNumber(index + 1)} ||* ${movie.title} | ${movie.type}\n\n`;
            numrep.push(`${prefix}${ty}${movie.link}`);
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
        if (!q.includes('sinhalasub.lk/movies')) return await reply(valid_url);

        const response = await fetch(`https://www.dark-yasiya-api.site/movie/sinhalasub/movie?url=${encodeURIComponent(q)}`);
        const mov = (await response.json()).result?.data;

        if (!mov) return await reply(not_fo);

        let cot = `🎬 *NADEEN-MD 𝖬𝖮𝖵𝖨𝖤 𝖣𝖮𝖶𝖭𝖫𝖮𝖠𝖣 𝖲𝖸𝖲𝖳𝖤𝖬* 🎬\n\n   📽️ Movie Name: ${mov.title}\n   🍟 Release Date: ${mov.date}\n   ⏱ Duration: ${mov.runtime}\n   🖇️ Movie Link: ${q}\n\n*${formatNumber(1)} ||* SEND MOVIE\n`;

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

        if (!inp || !q.includes('sinhalasub.lk/movies')) return await reply(valid_url);

        const response = await fetch(`https://www.dark-yasiya-api.site/movie/sinhalasub/movie?url=${encodeURIComponent(inp)}`);
        const mov = (await response.json()).result?.data;

        if (!mov) return await reply(not_fo);

        let cot = `🎬 *𝖬𝖮𝖵𝖨𝖤 𝖣𝖮𝖶𝖭𝖫𝖮𝖠𝖣 𝖲𝖸𝖲𝖳𝖤𝖬* 🎬\n\n  📽️ Movie Name: ${mov.title}\n  🍟 Release Date: ${mov.date}\n  🌍 Country: ${mov.country}\n  ⏱ Duration: ${mov.runtime}\n  🖇️ Movie Link: ${inp}\n  🎀 Category: ${mov.category}\n  ⭐ Imdb: ${mov.imdbRate}\n  🤵 Director: ${mov.director}\n\n▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n\n*${formatNumber(1)} ||* SEND DETAILS NORMAL IMG\n*${formatNumber(2)} ||* SEND IMAGES\n`;

        let numrep = [`${prefix}simvdet ${q}`, `${prefix}sinhimages ${q}`];
        var dl_type = '';

        mov.dl_links.forEach((movie, index) => {
            if (movie.link.includes('mega.nz')) dl_type = 'MEGA-CLOUD';
            else if (movie.link.includes('pixeldrain.com')) dl_type = 'PIXELDRAIN';
            else if (movie.link.includes('ddl.sinhalasub.net')) dl_type = 'DDL-SINHALASUB';
            else if (movie.link.includes('ssl.sinhalasub01.workers.dev/')) dl_type = 'SINHALASUB01-WORKERS';

            cot += `*${formatNumber(index + 3)} ||* ${movie.quality} *( ${movie.size} )*\n[ ${dl_type} ]\n`;
            numrep.push(`${prefix}sinedirectdl2 ${movie.link}🎈${mov.title}🎈${movie.quality}🎈${movie.size}🎈${jidx}🎈${mov.mainImage}`);
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
    pattern: "sitvjid",
    react: "📺",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q) return await reply(url);
        if (!q.includes('sinhalasub.lk/tvshow')) return await reply(valid_url);

        const response = await fetch(`https://www.dark-yasiya-api.site/movie/sinhalasub/tvshow?url=${encodeURIComponent(q)}`);
        const mov = (await response.json()).result?.data;

        if (!mov) return await reply(not_fo);

        let cot = `📺 *𝖳𝖵 𝖲𝖧𝖮𝖶 𝖣𝖮𝖶𝖭𝖫𝖮𝖠𝖣 𝖲𝖸𝖲𝖳𝖤𝖬* 📺\n\n  📽 Tv Show Name: ${mov.title}\n  ✨ First Air Date: ${mov.date}\n  🤵‍♂️ Director: ${mov.director}\n  🖇️ Tv Show Link: ${q}\n\n*${formatNumber(1)} ||* SEND INBOX\n`;

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

        if (!inp || !q.includes('sinhalasub.lk/tvshow')) return await reply(valid_url);

        const response = await fetch(`https://www.dark-yasiya-api.site/movie/sinhalasub/tvshow?url=${encodeURIComponent(inp)}`);
        const mov = (await response.json()).result?.data;

        if (!mov) return await reply(not_fo);

        let cot = `📺 *𝖳𝖵 𝖲𝖧𝖮𝖶 𝖣𝖮𝖶𝖭𝖫𝖮𝖠𝖣 𝖲𝖸𝖲𝖳𝖤𝖬* 📺\n\n  📽 Tv Show Name: ${mov.title}\n  ✨ First Air Date: ${mov.date}\n  🖇️ Tv Show Link: ${inp}\n  🎀 Categories: ${mov.category}\n  🤵‍♂️ Director: ${mov.director}\n  ⭐ IMDB RATIN: ${mov.imdb}\n\n*${formatNumber(1)} ||* SEND DETAILS\n`;

        let numrep = [`${prefix}sitvdet ${q}`];

        mov.episodes.forEach((movie, index) => {
            cot += `*${formatNumber(index + 2)} ||* ${movie.title} ( ${movie.date} )\n\n`;
            numrep.push(`${prefix}siepgo ${movie.episode_link}🎈${jidx}`);
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

        if (!inp || !q.includes('sinhalasub.lk/episodes')) return await reply(valid_url);

        const response = await fetch(`https://www.dark-yasiya-api.site/movie/sinhalasub/episode?url=${encodeURIComponent(inp)}`);
        const mov = (await response.json()).result?.data;

        if (!mov) return await reply(not_fo);

        let cot = `📺 *𝖳𝖵 𝖲𝖧𝖮𝖶 𝖣𝖮𝖶𝖭𝖫𝖮𝖠𝖣 𝖲𝖸𝖲𝖳𝖤𝖬* 📺\n\n  📽 ${oce3}Episode Title:${oce3} ${mov.title}\n  🎡 ${oce3}Episode Name:${oce3} ${mov.ep_name}\n  🖇️ ${oce3}Tv Show Link:${oce3} ${inp}\n  🧿 ${oce3}Release Date:${oce3} ${mov.date}\n\n*${formatNumber(1)} ||* SEND DETAILS NORMAL IMG\n*${formatNumber(2)} ||* SEND IMAGES\n`;

        let numrep = [`${prefix}siepdet ${q}`, `${prefix}sinhimages ${q}`];
        var dl_type = '';

        mov.dl_links.forEach((movie, index) => {
            if (movie.link.includes('mega.nz')) dl_type = 'MEGA-CLOUD';
            else if (movie.link.includes('pixeldrain.com')) dl_type = 'PIXELDRAIN';
            else if (movie.link.includes('ddl.sinhalasub.net')) dl_type = 'DDL-SINHALASUB';
            else if (movie.link.includes('ssl.sinhalasub01.workers.dev/')) dl_type = 'SINHALASUB01-WORKERS';

            cot += `*${formatNumber(index + 3)} ||* ${movie.quality} *( ${movie.size} )*\n[ ${dl_type} ]\n`;
            numrep.push(`${prefix}sinedirectdl2 ${movie.link}🎈${mov.title}🎈${movie.quality}🎈${movie.size}🎈${jidx}`);
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
    pattern: "simvdet",
    react: "📽️",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, prefix, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isCreator, isDev, isAdmins, reply }) => {
    try {
        if (!q) return await reply(url);
        if (!q.includes('sinhalasub.lk/movies')) return await reply(valid_url);

        var inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        var jidx = q.includes('🎈') ? q.split('🎈')[1] : from;

        const response = await fetch(`https://www.dark-yasiya-api.site/movie/sinhalasub/movie?url=${encodeURIComponent(inp)}`);
        const mov = (await response.json()).result?.data;

        if (!mov) return await reply(not_fo);

        var cast = '';
        for (let i of mov.cast || []) {
            cast += i.reall_name + ',';
        }

        let yt = `
🍟 _*${mov.title}*_

🧿 Release Date: ➜ ${mov.date}
🌍 Country: ${mov.country}
⏱️ Duration: ${mov.runtime}
🖇️ Movie Link: ${inp}
🎀 Categories: ${mov.category}
⭐ IMDB RATIN: ${mov.imdbRate}
🔮 IMDB VOTE: ${mov.imdbVoteCount}
🤵‍♂️ Director: ${mov.director}
🕵️‍♂️ Cast: ${cast}
`;

        const jid = jidx || from;
        await conn.sendMessage(jid, { image: { url: mov.images[0] || mov.image || config.LOGO }, caption: yt + `\n${config.CAPTION}` });

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
        if (!q.includes('sinhalasub.lk/tvshow')) return await reply(valid_url);

        var inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        var jidx = q.includes('🎈') ? q.split('🎈')[1] : from;

        const response = await fetch(`https://www.dark-yasiya-api.site/movie/sinhalasub/tvshow?url=${encodeURIComponent(inp)}`);
        const mov = (await response.json()).result?.data;

        if (!mov) return await reply(not_fo);

        let yt = `
📺 *Tv Show Name:* ${mov.title}
✨ *First Air Date:* ${mov.date}
🖇️ *Tv Show Link:* ${inp}
🎀 *Categories:* ${mov.category}
🤵‍♂️ *Director:* ${mov.director}
⭐ *IMDB RATIN:* ${mov.imdb}
`;

        const jid = jidx || from;
        await conn.sendMessage(jid, { image: { url: mov.image || config.LOGO }, caption: yt + `\n${config.CAPTION}` });

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
        if (!q.includes('sinhalasub.lk/episode')) return await reply(valid_url);

        var inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        var jidx = q.includes('🎈') ? q.split('🎈')[1] : from;

        const response = await fetch(`https://www.dark-yasiya-api.site/movie/sinhalasub/episode?url=${encodeURIComponent(inp)}`);
        const mov = (await response.json()).result?.data;

        if (!mov) return await reply(not_fo);

        let yt = `
📺 *Episode Title:* ${mov.title}

🎡 *Episode Name:* ${mov.ep_name}

🖇️ *Tv Show Link:* ${inp}

🧿 *Release Date:* ${mov.date}
`;

        const jid = jidx || from;
        await conn.sendMessage(jid, { image: { url: mov.images[0] || config.LOGO }, caption: yt + `\n${config.CAPTION}` });

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

        if (!inp) return reply("*An error occurred 🧑‍🎨❌*");
        const jid = jidx || from;

        // Handle Mega.nz
        if (inp.includes("mega.nz")) {
            const up_mg = await conn.sendMessage(from, { text: 'Uploading Your Request Movie..⬆' }, { quoted: mek });
            const file = File.fromURL(inp);
            await file.loadAttributes();
            const data = await file.downloadBuffer();
            await conn.sendMessage(jid, {
                document: data,
                mimetype: "video/mp4",
                fileName: `[ŋąɖɛɛŋ]${nmf}.mp4`,
                caption: `${nmf} ( ${quality} )\n${config.CAPTION}`
            });
            await conn.sendMessage(from, { delete: up_mg.key });
            await conn.sendMessage(from, { text: 'File Send Successful ✔' }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
            await sleep(1000 * 1);
        }
        // Handle DDL-Sinhalasub and SINHALASUB01-WORKERS
        else if (inp.includes("ddl.sinhalasub.net") || inp.includes("ssl.sinhalasub01.workers.dev")) {
            const up_mg = await conn.sendMessage(from, { text: 'Uploading Your Request Movie..⬆' }, { quoted: mek });
            const mvdoc = await conn.sendMessage(jid, {
                document: { url: await getBuffer(inp) },
                fileName: `[ŋąɖɛɛŋ]${nmf}.mp4`,
                mimetype: "video/mp4",
                caption: `${nmf} ( ${quality} )\n${config.CAPTION}`
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
                caption: `${nmf} ( ${quality} )\n${config.CAPTION}`
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

        if (input.includes("sinhalasub.lk/movies")) {
            const response = await fetch(`https://www.dark-yasiya-api.site/movie/sinhalasub/movie?url=${encodeURIComponent(input)}`);
            const anu = await response.json();
            if (!anu.result?.data?.images || anu.result.data.images.length < 1) return await reply(not_fo);
            const jid = jidx || from;

            for (let all of anu.result.data.images) {
                await conn.sendMessage(jid, { image: { url: all }, caption: config.CAPTION });
            }
            await conn.sendMessage(from, { text: 'Details Card Sended ✔' }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
            await sleep(1000 * 1);
        } else if (input.includes("sinhalasub.lk/episode")) {
            const response = await fetch(`https://www.dark-yasiya-api.site/movie/sinhalasub/episode?url=${encodeURIComponent(input)}`);
            const anu = await response.json();
            if (!anu.result?.data?.images || anu.result.data.images.length < 1) return await reply(not_fo);
            const jid = jidx || from;

            for (let all of anu.result.data.images) {
                await conn.sendMessage(jid, { image: { url: all }, caption: config.CAPTION });
            }
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

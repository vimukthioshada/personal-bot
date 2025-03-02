const axios = require('axios');
const mime = require('mime-types'); // Ensure mime-types is installed
const cheerio = require('cheerio');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { File } = require('megajs');
const config = require('../config');
const { cmd, commands } = require('../command');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson, jsonformat } = require('../lib/functions');
const { storenumrepdata } = require('../lib/nonbutton');

function formatNumber(num) {
    return String(num).padStart(2, '0');
}

//===============================================================================
const url = "Give me movie name ?";
const valid_url = "This Url Type is Invalid";
const not_fo = "I can't find anything";
const giveme = "Please give me movie or tv show name";
const err = "Error !!";

const baseUrl = "https://zoom.lk";
//===============================================================================

cmd({
    pattern: "zoom",
    react: '📑',
    category: "search",
    desc: "Search movies from zoom.lk",
    filename: __filename
},
async (conn, mek, m, { from, prefix, quoted, body, isCmd, command, args, q, sender, isDev, senderNumber, isPreUser, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q) return await reply(giveme);

        const searchUrl = `${baseUrl}?s=${encodeURIComponent(q)}`;
        const response = await axios.get(searchUrl);
        const $ = cheerio.load(response.data);

        let result = [];
        $("div.td-pb-span8.td-main-content > div > div.td_module_16.td_module_wrap.td-animation-stack").each((c, d) => {
            result.push({
                time: $(d).find("div.item-details > div > span > time").text(),
                title: $(d).find("div.item-details > h3 > a").text(),
                link: $(d).find("div.item-details > h3 > a").attr("href")
            });
        });

        if (result.length < 1) return await reply(not_fo);

        let cot = `🔮 *ZOOM MOVIE SEARCH SYSTEM* 🔮\n\n📲 Input: *${q}*\n\n`;
        let numrep = [];

        for (let j = 0; j < result.length; j++) {
            cot += `*${formatNumber(j + 1)} ||* ${result[j].title} (${result[j].time})\n`;
            numrep.push(`${prefix}zoomdl ${result[j].link}🎈${result[j].title}`);
        }

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
    pattern: "zoomdl",
    react: '📥',
    category: "download",
    desc: "Download movie details and link from zoom.lk",
    filename: __filename
},
async (conn, mek, m, { from, prefix, quoted, body, isCmd, command, args, q, sender, isDev, senderNumber, isPreUser, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q) return await reply("Please provide a valid link or select an option!");

        var inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        var title = q.includes('🎈') ? q.split('🎈')[1] : '';

        if (!inp || !inp.startsWith(baseUrl)) return await reply(valid_url);

        const response = await axios.get(inp);
        const $ = cheerio.load(response.data);

        const titleDetail = $("#tdi_56 > div > div.vc_column.tdi_59.wpb_column.vc_column_container.tdc-column.td-pb-span8 > div > div.td_block_wrap.tdb_title.tdi_60.tdb-single-title.td-pb-border-top.td_block_template_17 > div > h1").text() || title;
        const author = $("#tdi_56 > div > div.vc_column.tdi_59.wpb_column.vc_column_container.tdc-column.td-pb-span8 > div > div.vc_row_inner.tdi_62.vc_row.vc_inner.wpb_row.td-pb-row > div.vc_column_inner.tdi_64.wpb_column.vc_column_container.tdc-inner-column.td-pb-span4 > div > div > div > div > ul > li > a").text() || 'N/A';
        const date = $("#tdi_56 > div > div.vc_column.tdi_59.wpb_column.vc_column_container.tdc-column.td-pb-span8 > div > div.vc_row_inner.tdi_62.vc_row.vc_inner.wpb_row.td-pb-row > div.vc_column_inner.tdi_70.wpb_column.vc_column_container.tdc-inner-column.td-pb-span4 > div > div > div > div > time").text() || 'N/A';
        const size = $("#tdi_81 > div > div.vc_column.tdi_84.wpb_column.vc_column_container.tdc-column.td-pb-span8 > div > div.td_block_wrap.tdb_single_content.tdi_86.td-pb-border-top.td_block_template_17.td-post-content.tagdiv-type > div > p > a > small").text() || 'N/A';
        const desc = $("#tdi_56 > div > div.vc_column.tdi_59.wpb_column.vc_column_container.tdc-column.td-pb-span8 > div > div.td_block_wrap.tdb_single_content.tdi_86.td-pb-border-top.td_block_template_17.td-post-content.tagdiv-type > div > p").text().trim() || 'No description available';
        const thumbnail = $("#tdi_56 > div > div.vc_column.tdi_59.wpb_column.vc_column_container.tdc-column.td-pb-span8 > div > div.tdb_single_featured_image.tdi_88.tdb-content-horiz-center.tdb-content-vert-top.tdb-single-featured-image > div > a > img").attr('src') || config.LOGO; // Fallback to config.LOGO
        const dllink = $("div.tdb-block-inner.td-fix-index > p > a").attr("href");

        if (!dllink) return await reply(not_fo);

        // Send thumbnail image
        await conn.sendMessage(from, {
            image: { url: thumbnail },
            caption: `📸 *Thumbnail for ${titleDetail}*`
        });

        // Follow redirects to get the actual download URL
        const redirectResponse = await fetch(dllink, { redirect: 'follow', method: 'HEAD' });
        const finalUrl = redirectResponse.url;

        if (!finalUrl || !isUrl(finalUrl)) return await reply("Invalid download link detected.");

        const msg = `📽️ *ZOOM MOVIE DETAILS*\n\n📌 *Title:* ${titleDetail}\n🎬 *Author:* ${author}\n📅 *Release Date:* ${date}\n📏 *Size:* ${size}\n📝 *Description:* ${desc}\n🔗 *Download Link:* ${finalUrl}\n`;
        let numrep = [`${prefix}fetchrar1 ${finalUrl}🎈${titleDetail}`];

        const mass = await conn.sendMessage(from, { text: `${msg}\n\n${config.FOOTER}` }, { quoted: mek });
        const jsonmsg = { key: mass.key, numrep, method: 'nondecimal' };
        await storenumrepdata(jsonmsg);
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        reply(`An error occurred: ${e.message}`);
    }
});

cmd({
    pattern: "fetchrar1",
    react: "📥",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, prefix, quoted, body, isCmd, command, args, q, sender, isDev, senderNumber, isPreUser, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q) return await reply('*Please provide a direct URL!*');

        var inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        var title = q.includes('🎈') ? q.split('🎈')[1] : 'SUBDL';

        if (!isUrl(inp)) return await reply(valid_url);

        const up_mg = await conn.sendMessage(from, { text: 'Uploading Your Request Video..⬆' }, { quoted: mek });

        // Fetch with redirect handling, timeout, and HEAD request to check content type
        const headResponse = await axios.head(inp, { maxRedirects: 5, timeout: 30000 });
        const contentType = headResponse.headers['content-type'] || 'video/mp4';
        const fileExt = mime.extension(contentType) || 'mp4';

        const response = await axios.get(inp, {
            responseType: 'arraybuffer',
            maxRedirects: 5,
            timeout: 30000
        });
        const mediaBuffer = Buffer.from(response.data, 'binary');

        const vajiralod = [
            "《 █▒▒▒▒▒▒▒▒▒▒▒》10%",
            "《 ████▒▒▒▒▒▒▒▒》30%",
            "《 ███████▒▒▒▒▒》50%",
            "《 ██████████▒▒》80%",
            "《 ████████████》100%",
            "𝙸𝙽𝙸𝚃𝙸𝙰𝙻𝙸𝚉𝙴𝙳 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙴𝙳 🦄..."
        ];

        for (let i = 0; i < vajiralod.length; i++) {
            await conn.sendMessage(from, { text: vajiralod[i], edit: up_mg.key });
            await sleep(1000); // 1-second delay
        }

        const message = {
            document: mediaBuffer,
            caption: `*🎬 T.C TEAM MOVIEDL 🎬*\nTitle: ${title}`,
            mimetype: contentType,
            fileName: `${title}.${fileExt}`
        };
        await conn.sendMessage(from, message, { quoted: mek });

        await conn.sendMessage(from, { delete: up_mg.key });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (e) {
        await conn.sendMessage(from, { delete: up_mg.key }).catch(() => {}); // Clean up
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        reply(`An error occurred: ${e.message}. Please ensure the link is a direct download URL or try again later.`);
    }
});
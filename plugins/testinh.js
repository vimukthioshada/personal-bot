const config = require('../config');
const { cmd, commands } = require('../command');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('../lib/functions');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');

const pk = "`(";
const pk2 = ")`";
const oce = "`";
const uploader = "🎬 TC TEAM MOVIE-DL 🎬";

// YTS.mx Search Command (Button-less, Text-based)
cmd({
    pattern: "ytsm",
    react: '🔎',
    category: "search",
    desc: "YTS.mx movie searcher",
    filename: __filename
},
async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply('*Please give me text !..*');

        const url = `https://yts.mx/browse-movies/${encodeURIComponent(q)}/all/all/0/latest/0/all`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        let result = [];
        $("section > div.row > div").each((c, d) => {
            result.push({
                title: $(d).find("div.browse-movie-bottom > a").text().trim(),
                year: $(d).find("div.browse-movie-bottom > div").text().trim(),
                link: $(d).find("a").attr("href"),
                image: $(d).find("a > figure > img").attr("src"),
                rating: $(d).find("a > figure > figcaption > h4.rating").text().trim(),
                danne: $(d).find("a > figure > figcaption > h4").eq(1).text().trim(),
                danne1: $(d).find("a > figure > figcaption > h4").eq(2).text().trim(),
            });
        });

        if (result.length < 1) return await conn.sendMessage(from, { text: 'Error !' }, { quoted: mek });

        let textw = `🔎 𝗧.𝗖 𝗠𝗢𝗜𝗩𝗘 𝗦𝗘𝗔𝗥𝗖𝗛 \n\n`;
        let numrep = [];
        for (let i = 0; i < result.length; i++) {
            textw += `*${i + 1} ||* *📃 Title:* ${result[i].title}\n`;
            textw += `    *⛓️ No:* ${result[i].danne1}\n`;
            textw += `    *📚 CatName:* ${result[i].danne}\n`;
            textw += `    *💫 Rating:* ${result[i].rating}\n`;
            textw += `    *📅 Date:* ${result[i].year}\n`;
            textw += `    *📎 Link:* ${result[i].link}\n\n--------------------------------------------\n\n`;
            numrep.push(`.ytmx ${result[i].link}`);
        }

        const mass = await conn.sendMessage(from, { text: `${textw}\n${config.FOOTER}` }, { quoted: mek });
        const jsonmsg = { key: mass.key, numrep, method: 'nondecimal' };
        await require('../lib/nonbutton').storenumrepdata(jsonmsg);

        await conn.sendMessage(from, { react: { text: `✅`, key: mek.key } });
    } catch (e) {
        console.log(`Error in ytsmxs command: ${e.message}`);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});

// YTS.mx Search Command (Button-less, Text-based, Public)
cmd({
    pattern: "ytsmx",
    react: '📑',
    category: "search",
    desc: "YTS.mx movie downloader",
    filename: __filename
},
async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply('*Please give me text !..*');

        const url = `https://yts.mx/browse-movies/${encodeURIComponent(q)}/all/all/0/latest/0/all`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        let result = [];
        $("section > div.row > div").each((c, d) => {
            result.push({
                title: $(d).find("div.browse-movie-bottom > a").text().trim(),
                year: $(d).find("div.browse-movie-bottom > div").text().trim(),
                link: $(d).find("a").attr("href"),
                image: $(d).find("a > figure > img").attr("src"),
                rating: $(d).find("a > figure > figcaption > h4.rating").text().trim(),
                danne: $(d).find("a > figure > figcaption > h4").eq(1).text().trim(),
                danne1: $(d).find("a > figure > figcaption > h4").eq(2).text().trim(),
            });
        });

        if (result.length < 1) return await conn.sendMessage(from, { text: 'Error !' }, { quoted: mek });

        let textw = `📑 𝗧.𝗖 𝗬𝗧𝗦.𝗠𝗫 𝗦𝗘𝗔𝗥𝗖𝗛 \n\n`;
        let numrep = [];
        for (let i = 0; i < Math.min(result.length, 10); i++) { // Limit to 10 results
            textw += `*${i + 1} ||* *📃 Title:* ${result[i].title}\n`;
            textw += `    *📅 Year:* ${result[i].year}\n`;
            textw += `    *💫 Rating:* ${result[i].rating}\n`;
            textw += `    *📎 Link:* ${result[i].link}\n\n--------------------------------------------\n\n`;
            numrep.push(`.ytmx ${result[i].link}`);
        }

        const mass = await conn.sendMessage(from, { text: `${textw}\n${config.FOOTER}` }, { quoted: mek });
        const jsonmsg = { key: mass.key, numrep, method: 'nondecimal' };
        await require('../lib/nonbutton').storenumrepdata(jsonmsg);

        await conn.sendMessage(from, { react: { text: `✅`, key: mek.key } });
    } catch (e) {
        console.log(`Error in ytsmx command: ${e.message}`);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});

// YTS.mx Movie Details and Download Command (Button-less, Public)
cmd({
    pattern: "ytmx",
    react: '📑',
    category: "search",
    desc: "YTS.mx movie downloader",
    filename: __filename
},
async (conn, m, mek, { from, q, reply, prefix }) => {
    try {
        if (!q) return await reply('*Please give me text !..*');

        const response = await axios.get(q);
        const $ = cheerio.load(response.data);

        const title = $("#mobile-movie-info > h1").text().trim();
        const year = $("#mobile-movie-info > h2:nth-child(2)").eq(0).text().trim();
        const language = $("#mobile-movie-info > h2 > span").text().trim();
        const image = $("#movie-poster > img").attr("src");
        const enter = $("#mobile-movie-info > h2").eq(1).text().trim();
        let download_links = [];

        $("div.modal.modal-download.hidden-xs.hidden-sm > div > div > div").each((c, d) => {
            download_links.push({
                quality: $(d).find("div > span").text().trim(),
                type: $(d).find("p.quality-size").eq(0).text().trim(),
                size: $(d).find("p.quality-size").eq(1).text().trim(),
                torrent_file: $(d).find("a").attr("href"),
                magnet: $(d).find("a.magnet-download.download-torrent.magnet").attr("href"),
            });
        });

        if (download_links.length < 1) return await conn.sendMessage(from, { text: `🚫 Download Link Not Found: *${q}*` }, { quoted: mek });

        let textw = `📃 𝗧𝗖 𝗧𝗘𝗔𝗠 𝗬𝗧𝗦𝗠𝗫 𝗠𝗗𝗟 🎬\n\n📑 *Title:* ${title}\n🧬 *Year:* ${year}\n🫧 *Language:* ${language}\n\n`;
        let numrep = [];

        textw += `*1 ||* 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 𝐓𝐎𝐑𝐑𝐄𝐍𝐓 📂\n    *Link:* ${download_links[0].torrent_file}\n\n`;

        for (let i = 0; i < download_links.length; i++) {
            textw += `*${i + 2} ||* *Quality:* ${download_links[i].quality}\n`;
            textw += `    *Type:* ${download_links[i].type}\n`;
            textw += `    *Size:* ${download_links[i].size}\n`;
            textw += `    *Magnet Link:* ${download_links[i].magnet}\n\n--------------------------------------------\n\n`;
            numrep.push(`${prefix}ytmxdl ${download_links[i].magnet}`);
        }

        const mass = await conn.sendMessage(from, {
            image: { url: image },
            caption: `${textw}\n${config.FOOTER}`
        }, { quoted: mek });

        const jsonmsg = { key: mass.key, numrep, method: 'nondecimal' };
        await require('../lib/nonbutton').storenumrepdata(jsonmsg);

        await conn.sendMessage(from, { react: { text: `✅`, key: mek.key } });
    } catch (e) {
        console.log(`Error in ytmx command: ${e.message}`);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});

// YTS.mx Direct Download Command (Seedr Integration, Button-less, Public)
cmd({
    pattern: "ytmxdl",
    react: '⬆',
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, l, prefix, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const Seedr = require("seedr");
        const seedr = new Seedr();
        await seedr.login("ovimukthi256@gmail.com", "Oshada2005@");

        const ad_mg = await conn.sendMessage(from, { text: 'ᴜᴘʟᴏᴀᴅɪɴɢ magnet file...📥' }, { quoted: mek });
        const magnet = await seedr.addMagnet(q);

        const vajiralod = [
            "《 █▒▒▒▒▒▒▒▒▒▒▒》10%",
            "《 ████▒▒▒▒▒▒▒▒》30%",
            "《 ███████▒▒▒▒▒》50%",
            "《 ██████████▒▒》80%",
            "《 ████████████》100%",
            "ꜱᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ ᴜᴘʟᴏᴀᴅᴇᴅ ᴍᴀɢɴᴇᴛ ꜰɪʟᴇ ✅..."
        ];
        let { key } = await conn.sendMessage(from, { text: 'ꜱᴜᴄᴄᴇꜱꜰᴜʟʟʏ ᴜᴘʟᴏᴀᴅᴅ ᴍᴀɢɴᴇᴛ ꜰɪʟᴇ ✅...', edit: ad_mg.key }, { quoted: mek });

        for (let i = 0; i < vajiralod.length; i++) {
            await conn.sendMessage(from, { text: vajiralod[i], edit: key });
            await sleep(1000); // Add delay for progress display
        }

        if (magnet.code === 400 || magnet.result !== true) {
            console.log("Error adding magnet " + JSON.stringify(magnet, null, 2));
            throw new Error("Failed to add magnet link");
        }

        var contents = [];
        do {
            contents = await seedr.getVideos();
            await sleep(2000); // Add delay to prevent rate limiting
        } while (contents.length === 0);

        var file = await seedr.getFile(contents[0][0].id);
        var folder_id = contents[0][0].fid;

        const link = file.url;
        await conn.sendMessage(from, {
            document: await getBuffer(link),
            mimetype: "video/mp4",
            fileName: `${uploader}.mp4`,
            caption: `> ${file.name}\n\n${config.FOOTER}`
        });

        await seedr.deleteFolder(folder_id);
        await conn.sendMessage(from, { text: 'Movie send Successfully ✔' }, { quoted: mek });
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(`Error in ytmxdl command: ${e.message}`);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});

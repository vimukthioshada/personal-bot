const config = require('../config');
const { cmd, commands } = require('../command');
const { getBuffer, getRandom, runtime, sleep, fetchJson } = require('../lib/functions');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const Seedr = require("seedr");

const uploader = "🎬 TC TEAM MOVIE-DL 🎬 ";

// YTSMX Search Command
cmd({
    pattern: "ytsmxs",
    react: '🔎',
    category: "search",
    desc: "Search movies from yts.mx",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('*Please provide a search term!*');

        const url = `https://yts.mx/browse-movies/${encodeURIComponent(q)}/all/all/0/latest/0/all`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        let results = [];
        $("section > div.row > div").each((i, elem) => {
            results.push({
                title: $(elem).find("div.browse-movie-bottom > a").text(),
                year: $(elem).find("div.browse-movie-bottom > div").text(),
                link: $(elem).find("a").attr("href"),
                image: $(elem).find("a > figure > img").attr("src"),
                rating: $(elem).find("a > figure > figcaption > h4.rating").text(),
                category: $(elem).find("a > figure > figcaption > h4").eq(1).text(),
                number: $(elem).find("a > figure > figcaption > h4").eq(2).text()
            });
        });

        if (!results.length) return reply('No results found!');

        let message = `🔎 *TC MOVIE SEARCH*\n\n`;
        results.forEach(result => {
            message += `*📃 Title:* ${result.title}\n` +
                      `*⛓️ No:* ${result.number}\n` +
                      `*📚 Category:* ${result.category}\n` +
                      `*💫 Rating:* ${result.rating}\n` +
                      `*📅 Year:* ${result.year}\n` +
                      `*📎 Link:* ${result.link}\n\n--------------------------------------------\n\n`;
        });

        await conn.sendMessage(from, {
            image: { url: results[0].image },
            caption: message
        }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key }});

    } catch (e) {
        console.log(e);
        reply(`*Error:* ${e.message}`);
    }
});

// YTSMX Movie List
cmd({
    pattern: "ytsmx",
    react: '📑',
    category: "search",
    desc: "Search and list movies from yts.mx",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) return reply('*Please provide a search term!*');

        const url = `https://yts.mx/browse-movies/${encodeURIComponent(q)}/all/all/0/latest/0/all`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        let results = [];
        $("section > div.row > div").each((i, elem) => {
            results.push({
                title: $(elem).find("div.browse-movie-bottom > a").text(),
                year: $(elem).find("div.browse-movie-bottom > div").text(),
                link: $(elem).find("a").attr("href"),
                image: $(elem).find("a > figure > img").attr("src")
            });
        });

        if (!results.length) return reply('No results found!');

        let message = `📑 *TC YTS.MX SEARCH*\n\nSearch Term: ${q}\nShowing top ${results.length} results:\n\n`;
        results.forEach((result, i) => {
            message += `${i + 1}. *${result.title}*\n` +
                      `   Year: ${result.year}\n` +
                      `   Use: ${prefix}ytmx ${result.link}\n\n`;
        });

        await conn.sendMessage(from, {
            image: { url: results[0].image },
            caption: message
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply(`*Error:* ${e.message}`);
    }
});

// YTSMX Movie Details
cmd({
    pattern: "ytmx",
    react: '📑',
    category: "search",
    desc: "Get movie details and download links",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) return reply('*Please provide a movie URL!*');

        const response = await axios.get(q);
        const $ = cheerio.load(response.data);

        const movie = {
            title: $("#mobile-movie-info > h1").text(),
            year: $("#mobile-movie-info > h2:nth-child(2)").eq(0).text(),
            language: $("#mobile-movie-info > h2 > span").text(),
            image: $("#movie-poster > img").attr("src"),
            category: $("#mobile-movie-info > h2").eq(1).text(),
            downloads: []
        };

        $("div.modal.modal-download.hidden-xs.hidden-sm > div > div > div").each((i, elem) => {
            movie.downloads.push({
                quality: $(elem).find("div > span").text(),
                type: $(elem).find("p.quality-size").eq(0).text(),
                size: $(elem).find("p.quality-size").eq(1).text(),
                torrent: $(elem).find("a").attr("href"),
                magnet: $(elem).find("a.magnet-download.download-torrent.magnet").attr("href")
            });
        });

        if (!movie.downloads.length) return reply(`🚫 No download links found for: *${q}*`);

        let message = `📃 *TC TEAM YTSMX MDL* 🎬\n\n` +
                     `📑 *Title:* ${movie.title}\n` +
                     `🧬 *Year:* ${movie.year}\n` +
                     `🫧 *Language:* ${movie.language}\n` +
                     `📚 *Category:* ${movie.category}\n\n` +
                     `*Download Links:*\n`;

        movie.downloads.forEach((dl, i) => {
            message += `${i + 1}. *${dl.quality}* (${dl.type})\n` +
                      `   Size: ${dl.size}\n` +
                      `   Torrent: ${dl.torrent}\n` +
                      `   Use: ${prefix}ytmxdl ${dl.magnet}\n\n`;
        });

        await conn.sendMessage(from, {
            image: { url: movie.image },
            caption: message
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply(`*Error:* ${e.message}`);
    }
});

// YTSMX Download Command
cmd({
    pattern: "ytmxdl",
    react: '⬆',
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('*Please provide a magnet link!*');

        const seedr = new Seedr();
        await seedr.login("vajirarathnayaka891@gmail.com", "vajirarathnayaka891@");

        const statusMsg = await conn.sendMessage(from, { text: 'Uploading magnet file...📥' }, { quoted: mek });
        const magnet = await seedr.addMagnet(q);

        const progress = [
            "《 █▒▒▒▒▒▒▒▒▒▒▒》10%",
            "《 ████▒▒▒▒▒▒▒▒》30%",
            "《 ███████▒▒▒▒▒》50%",
            "《 ██████████▒▒》80%",
            "《 ████████████》100%",
            "Successfully uploaded magnet file ✅..."
        ];

        let key = statusMsg.key;
        for (let step of progress) {
            await sleep(500);
            await conn.sendMessage(from, { text: step, edit: key });
        }

        if (magnet.code === 400 || magnet.result !== true) {
            throw new Error("Failed to add magnet link");
        }

        let contents = [];
        do {
            contents = await seedr.getVideos();
            await sleep(1000);
        } while (!contents.length);

        const file = await seedr.getFile(contents[0][0].id);
        const folderId = contents[0][0].fid;

        await conn.sendMessage(config.JID, {
            document: await getBuffer(file.url),
            mimetype: "video/mp4",
            fileName: `${uploader}.mp4`,
            caption: `> ${file.name}`
        }, { quoted: mek });

        await seedr.deleteFolder(folderId);
        await conn.sendMessage(from, { text: 'Movie sent successfully ✔' }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key }});

    } catch (e) {
        console.log(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key }});
        reply(`❌ *Error:* ${e.message}`);
    }
});
const axios = require('axios');
const cheerio = require('cheerio');
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

// Embedded Anime Scraper Class
class AnimeScraper {
    constructor(baseUrl = 'https://slanimeclub.co') {
        this.baseUrl = baseUrl;
    }

    async scrapeSearchResults(searchTerm) {
        const url = `${this.baseUrl}/search/${encodeURIComponent(searchTerm)}/`;
        try {
            const response = await axios.get(url);
            const html = response.data;
            const $ = cheerio.load(html);
            const results = [];

            $('.result-item article').each((index, element) => {
                const name = $(element).find('.title a').text().trim() || 'N/A';
                const link = $(element).find('.thumbnail a').attr('href') || 'N/A';
                const type = $(element).find('.thumbnail span').text().trim() || 'N/A';

                if (type === 'TV' || type === 'Movie') {
                    results.push({ name, link });
                }
            });

            return results;
        } catch (error) {
            console.error(`Error fetching search results: ${error.message}`);
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    async scrapeMovie(detailUrl) {
        try {
            const response = await axios.get(detailUrl);
            const html = response.data;
            const $ = cheerio.load(html);

            const title = $('h1').text().trim() || 'N/A';
            const imdbRating = $('#repimdb strong').text().trim() || 'N/A';
            const thumbnail = $('.sheader .poster img').attr('src') || 'N/A';
            const downloadLink = await this.scrapeDownloadOrWatchOnlineLink(detailUrl);

            return { title, imdbRating, thumbnail, downloadLink };
        } catch (error) {
            console.error(`Error scraping movie ${detailUrl}: ${error.message}`);
            throw new Error(`Movie scrape failed: ${error.message}`);
        }
    }

    async scrapeTVSeries(detailUrl) {
        try {
            const response = await axios.get(detailUrl);
            const html = response.data;
            const $ = cheerio.load(html);

            const title = $('h1').text().trim() || 'N/A';
            const thumbnail = $('.sheader .poster img').attr('src') || 'N/A';
            const episodes = [];

            $('#seasons .episodios li').each((i, el) => {
                const episodeLink = $(el).find('.episodiotitle a').attr('href') || 'N/A';
                const episodeName = $(el).find('.episodiotitle a').text().trim() || 'N/A';
                episodes.push({ episodeNumber: i + 1, name: episodeName, url: episodeLink });
            });

            const episodeDetails = await Promise.all(episodes.map(async (ep) => {
                const downloadLink = await this.scrapeDownloadOrWatchOnlineLink(ep.url);
                return { episodeNumber: ep.episodeNumber, name: ep.name, downloadLink };
            }));

            return { title, thumbnail, episodes: episodeDetails };
        } catch (error) {
            console.error(`Error scraping TV series ${detailUrl}: ${error.message}`);
            throw new Error(`TV series scrape failed: ${error.message}`);
        }
    }

    async scrapeDownloadOrWatchOnlineLink(detailUrl) {
        try {
            const response = await axios.get(detailUrl);
            const html = response.data;
            const $ = cheerio.load(html);

            // Try to get watch online link
            let link = $('#videos .links_table tbody tr td a[href*="links/"]').attr('href');
            if (!link) {
                // Fallback to download link if no watch online link
                link = $('#download .links_table tbody tr td a').attr('href');
            }

            if (link) {
                const fullLink = `${this.baseUrl}${link}`;
                return await this.scrapeDownloadPage(fullLink);
            }
            return null;
        } catch (error) {
            console.error(`Error scraping download/watch online link from ${detailUrl}: ${error.message}`);
            throw new Error(`Download link scrape failed: ${error.message}`);
        }
    }

    async scrapeDownloadPage(downloadPageUrl) {
        try {
            const response = await axios.get(downloadPageUrl);
            const html = response.data;
            const $ = cheerio.load(html);

            const driveLink = $('#link').attr('href');
            if (driveLink) {
                return driveLink; // Returns the Google Drive view link
            }
            return null;
        } catch (error) {
            console.error(`Error scraping download page ${downloadPageUrl}: ${error.message}`);
            throw new Error(`Download page scrape failed: ${error.message}`);
        }
    }

    async convertToDownloadLink(driveLink) {
        if (!driveLink || !driveLink.includes('drive.google.com')) return driveLink;

        // Extract file ID from the Google Drive view link
        const fileIdMatch = driveLink.match(/\/d\/([a-zA-Z0-9_-]+)/) || driveLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (!fileIdMatch || !fileIdMatch[1]) return driveLink;

        const fileId = fileIdMatch[1];
        const initialUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

        try {
            // Try direct download URL first (no virus scan warning for public files)
            const directResponse = await axios.get(initialUrl, {
                maxRedirects: 5,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            // If successful, return the final redirect URL
            return directResponse.request.res.responseUrl || initialUrl;
        } catch (error) {
            console.error(`Error converting to download link for ${driveLink}: ${error.message}`);

            // Fallback: Try to handle virus scan warning if it's a private file
            const openUrl = `https://drive.google.com/open?id=${fileId}&authuser=0`;
            try {
                const response = await axios.get(openUrl, {
                    maxRedirects: 0,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                if (response.status === 302) {
                    const warningUrl = response.headers.location;
                    const warningResponse = await axios.get(warningUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                    });

                    const $ = cheerio.load(warningResponse.data);
                    const form = $('#download-form');
                    if (form) {
                        const action = form.attr('action');
                        const params = {};
                        form.find('input[type="hidden"]').each((i, el) => {
                            params[$(el).attr('name')] = $(el).attr('value');
                        });

                        const queryString = new URLSearchParams(params).toString();
                        return `${action}?${queryString}`;
                    }
                }
            } catch (innerError) {
                console.error(`Error handling virus scan warning for ${driveLink}: ${innerError.message}`);
                return initialUrl; // Fallback to basic view link if all else fails
            }

            return initialUrl; // Final fallback
        }
    }
}

// Initialize Scraper
const scraper = new AnimeScraper();

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

        // Search using Anime Scraper
        const results = await scraper.scrapeSearchResults(q);
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

        // Get movie details using Anime Scraper
        const movie = await scraper.scrapeMovie(q);

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

        // Get movie details using Anime Scraper
        const mov = await scraper.scrapeMovie(inp);

        if (!mov) return await reply(not_fo);

        let cot = `🎬 *𝖬𝖮𝖵𝖨𝖤 𝖣𝖮𝖶𝖭𝖫𝖮𝖠𝖣 𝖲𝖸𝖲𝗧𝗘𝗠* 🎬\n\n  📽️ Movie Name: ${mov.title}\n  🍟 Release Date: ${mov.imdbRating.split(' ').pop() || 'N/A'}\n  ⏱ Duration: ${mov.imdbRating.split(' ').pop() || 'N/A'}\n  🖇️ Movie Link: ${inp}\n  🎀 Category: ${mov.imdbRating.split(' ').pop() || 'N/A'}\n  ⭐ Imdb: ${mov.imdbRating.split(' ')[0] || 'N/A'}\n\n*${formatNumber(1)} ||* SEND DETAILS NORMAL IMG\n*${formatNumber(2)} ||* SEND IMAGES\n*${formatNumber(3)} ||* SEND MOVIE\n`;

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

        // Get TV series details using Anime Scraper
        const tvSeries = await scraper.scrapeTVSeries(q);

        if (!tvSeries) return await reply(not_fo);

        let cot = `📺 *𝖳𝖵 𝖲𝗛𝗢𝗪 𝖣𝖮𝗪𝗡𝗟𝗢𝗔𝗗 𝖲𝗬𝗦𝗧𝗘𝗂* 📺\n\n  📽 Tv Show Name: ${tvSeries.title}\n  ✨ First Air Date: ${tvSeries.imdbRating.split(' ').pop() || 'N/A'}\n  🤵‍♂️ Director: N/A\n  🖇️ Tv Show Link: ${q}\n\n*${formatNumber(1)} ||* SEND INBOX\n`;

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

        // Get TV series details using Anime Scraper
        const mov = await scraper.scrapeTVSeries(inp);

        if (!mov) return await reply(not_fo);

        let cot = `📺 *𝖳𝖵 𝖲𝗛𝗢𝗪 𝖣𝖮𝗪𝗡𝗟𝗢𝗔𝗗 𝖲𝗬𝗦𝗧𝗀* 📺\n\n  📽 Tv Show Name: ${mov.title}\n  ✨ First Air Date: ${mov.imdbRating.split(' ').pop() || 'N/A'}\n  🖇️ Tv Show Link: ${inp}\n  🎀 Categories: N/A\n  🤵‍♂️ Director: N/A\n  ⭐ IMDB RATIN: ${mov.imdbRating.split(' ')[0] || 'N/A'}\n\n*${formatNumber(1)} ||* SEND DETAILS\n`;

        let numrep = [`${prefix}sitvdet ${q}`];

        mov.episodes.forEach((episode, index) => {
            cot += `*${formatNumber(index + 2)} ||* ${episode.name} (Episode ${episode.episodeNumber})\n\n`;
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

        // Get episode details using Anime Scraper
        const episode = await scraper.scrapeMovie(inp);

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

        // Get movie details using Anime Scraper
        const mov = await scraper.scrapeMovie(inp);

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

        // Get TV series details using Anime Scraper
        const mov = await scraper.scrapeTVSeries(inp);

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

        // Get episode details using Anime Scraper
        const mov = await scraper.scrapeMovie(inp);

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
            // Get movie details using Anime Scraper
            const movie = await scraper.scrapeMovie(input);

            if (!movie || !movie.thumbnail) return await reply(not_fo);
            const jid = jidx || from;

            await conn.sendMessage(jid, { image: { url: movie.thumbnail }, caption: config.CAPTION });
            await conn.sendMessage(from, { text: 'Details Card Sended ✔' }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
            await sleep(1000 * 1);
        } else if (input.includes("slanimeclub.co/episodes")) {
            // Get episode details using Anime Scraper
            const episode = await scraper.scrapeMovie(input);

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

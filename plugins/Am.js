const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson, fetchApi } = require('../lib/functions');
const { search, getep, dl } = require('darksadasyt-anime');
const fs = require("fs-extra");

// Formatting constants
const oce = "`";
const oce3 = "```";
const oce2 = "*";
const pk = "`(";
const pk2 = ")`";

// Function to format numbers (padded with zeros)
function formatNumber(num) {
    return String(num).padStart(2, '0');
}

// Store numbered replies data
const { storenumrepdata } = require('../lib/nonbutton');

// Function to fetch and validate image URLs
async function fetchImage(url) {
    try {
        const response = await axios.get(url, { responseType: 'stream' });
        return url; // Return the URL if successful
    } catch (error) {
        console.error(`Failed to fetch image from ${url}: ${error.message}`);
        return config.LOGO || "https://ibb.co/PGz9FBTz"; // Fallback to config.LOGO or a default public image
    }
}

// Search for anime
cmd({
    pattern: "anime1",
    alias: ["animesearch", "animelookup"],
    react: "🎌",
    desc: "Search for anime using darksadasyt-anime",
    category: "anime",
    use: ".anime <Anime Name>",
    filename: __filename
},
async (conn, mek, m, { from, prefix, l, quoted, body, isCmd, command, args, q, msr, reply }) => {
    try {
        if (!q || q.trim() === '') {
            return await conn.sendMessage(from, { text: "*❗ Please provide a valid anime name.*" }, { quoted: mek });
        }

        const results = await search(q);
        if (!results || results.length === 0) {
            return await reply("*❗ No anime found for the given input.*");
        }

        let animeList = '';
        let numrep = [];

        for (let i = 0; i < results.length; i++) {
            animeList += ` *${formatNumber(i + 1)} ||* ${results[i].title}\n`;
            numrep.push(`${prefix}anime_detail ${results[i].link}`);
        }

        if (!animeList) {
            return await reply("*❗ No anime found.*");
        }

        const cot = `🎌 *𝖠𝖭𝖨𝖬𝖤-𝖷 𝖠𝖭𝖨𝖬𝖤 𝖲𝖤𝖠𝖱𝖢𝖧 𝖲𝖸𝖲𝖳𝖤𝖬* 🎌\n\n📲 Input: *${q}*\n\n*Anime Results*\n${animeList}`;

        const thumbnailUrl = results[0]?.image ? await fetchImage(results[0].image) : config.LOGO || "https://ibb.co/PGz9FBTz";

        const mass = await conn.sendMessage(
            from,
            {
                image: { url: thumbnailUrl },
                caption: `${cot}\n\n${config.FOOTER}`
            },
            { quoted: mek }
        );

        const jsonmsg = {
            key: mass.key,
            numrep,
            method: 'nondecimal'
        };

        await storenumrepdata(jsonmsg);
    } catch (e) {
        console.error("Error in anime search:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply('*❌ An Error Occurred:* ' + e.message);
    }
});

// Show anime details
cmd({
    pattern: "anime_detail1",
    react: "🎥",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, prefix, l, quoted, body, isCmd, command, args, q, msr, reply }) => {
    try {
        if (!q || !q.includes("animeheaven.me")) {
            return await reply("*❗ Please provide a valid anime link.*");
        }

        const animeDetails = await getep(q);
        if (!animeDetails || !animeDetails.result) {
            return await reply("*❗ No details found for this anime.*");
        }

        const details = animeDetails.result;
        const episodes = animeDetails.results || []; // Use 'results' as per example output

        let detailsText = `🎌 *𝖠𝖭𝖨𝖬𝖤-𝖷 𝖠𝖭𝖨𝖬𝖤 𝖣𝖤𝖳𝖠𝖨𝖫𝖲* 🎌\n\n`;
        detailsText += `${oce2}Title:${oce2} ${details.title || 'N/A'}\n`;
        detailsText += `${oce2}Release Date:${oce2} ${details.date || 'N/A'}\n`;
        detailsText += `${oce2}IMDb Rating:${oce2} ${details.imdb || 'N/A'}\n`;
        detailsText += `${oce2}Episodes:${oce2} ${details.episodes || episodes.length + '+'}\n\n`;
        detailsText += `*Episode List:*\n`;

        let numrep = [];
        if (episodes && Array.isArray(episodes) && episodes.length > 0) {
            episodes.forEach((episode, index) => {
                const episodeNumber = formatNumber(index + 1);
                const episodeInfo = episode.episode ? `Episode ${episode.episode}` : `Episode ${episodeNumber}`;
                const episodeUrl = episode.url ? `https://animeheaven.me/${episode.url}` : 'N/A';
                detailsText += `  *${episodeNumber} ||* ${episodeInfo}\n`;
                if (episode.url) {
                    numrep.push(`${prefix}anime_download ${episodeUrl}`);
                }
            });
        } else {
            detailsText += `  *No episodes found.*\n`;
            console.log("Debug: Episodes data:", episodes);
        }

        detailsText += `\n${oce2}Link:${oce2} ${q}\n`;

        const cot = `${detailsText}\n\n*Reply with a number (e.g., 01) to download an episode!*`;

        const thumbnailUrl = details.image ? await fetchImage(details.image) : config.LOGO || "https://ibb.co/PGz9FBTz";

        const mass = await conn.sendMessage(
            from,
            {
                image: { url: thumbnailUrl },
                caption: `${cot}\n\n${config.FOOTER}`
            },
            { quoted: mek }
        );

        const jsonmsg = {
            key: mass.key,
            numrep,
            method: 'nondecimal'
        };

        await storenumrepdata(jsonmsg);
    } catch (e) {
        console.error("Error in anime_detail:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply('*❌ An Error Occurred:* ' + e.message);
    }
});

// Download anime episode
cmd({
    pattern: "anime_download1",
    react: "⬆",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, l, quoted, body, prefix, isCmd, command, args, q, msr, reply }) => {
    try {
        if (!q || !q.includes("animeheaven.me/episode.php")) {
            return await reply("*❗ Please provide a valid episode link.*");
        }

        const upMsg = await conn.sendMessage(from, { text: "Uploading your anime episode... ⬆" }, { quoted: mek });

        const downloadResult = await dl(q);
        if (!downloadResult || !downloadResult.url) {
            return await reply("*❗ Could not fetch download link.*");
        }

        // Get anime details for thumbnail
        const episodeLinkParts = q.split('/');
        const animeLink = `https://animeheaven.me/anime.php?${episodeLinkParts[episodeLinkParts.length - 2]}`;
        const animeDetails = await getep(animeLink);
        const thumbnailUrl = animeDetails?.result?.image ? await fetchImage(animeDetails.result.image) : config.LOGO || "https://ibb.co/PGz9FBTz";

        await conn.sendMessage(from, {
            document: { url: downloadResult.url },
            fileName: `Episode_${q.split('episode.php?')[1]}.mp4`,
            mimetype: "video/mp4",
            thumbnailImageUrl: thumbnailUrl,
            caption: `Anime Episode Download: ${q}\n\n${config.CAPTION}`
        }, { quoted: mek });

        await conn.sendMessage(from, { delete: upMsg.key });
        await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
    } catch (e) {
        console.error("Error in anime_download:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply('*❌ An Error Occurred:* ' + e.message);
    }
});
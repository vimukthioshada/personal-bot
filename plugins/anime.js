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

// Function to sanitize file name (remove invalid characters)
function sanitizeFileName(fileName) {
    return fileName.replace(/[:]/g, '-').replace(/[/\\?%*:|"<>]/g, '_');
}

// Search for anime
cmd({
    pattern: "anime",
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
    pattern: "anime_detail",
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
        console.log("Anime Details Response:", animeDetails); // Debug log
        if (!animeDetails || !animeDetails.result) {
            return await reply("*❗ No details found for this anime.*");
        }

        const details = animeDetails.result;
        const episodes = animeDetails.results || [];

        if (!episodes || episodes.length === 0) {
            console.log("Debug: Episodes data is missing or empty:", episodes);
            return await reply("*❗ No episodes found for this anime.*");
        }

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
    pattern: "anime_download",
    react: "⬆",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, l, quoted, body, prefix, isCmd, command, args, q, msr, reply }) => {
    try {
        if (!q || !q.includes("animeheaven.me/episode.php")) {
            return await reply("*❗ Please provide a valid episode link.*");
        }

        const upMsg = await conn.sendMessage(from, { text: "*Your download has been started*" }, { quoted: mek });

        console.log("Attempting to download from URL:", q); // Debug log
        const downloadResult = await dl(q);
        console.log("Download Result:", downloadResult); // Debug log

        let downloadUrl = null;
        if (downloadResult && Array.isArray(downloadResult) && downloadResult.length >= 2) {
            // Extract the second URL (download link) as per your request
            downloadUrl = downloadResult[1]; // Second link should be the download URL
        } else if (downloadResult && typeof downloadResult === 'object' && downloadResult.url) {
            downloadUrl = downloadResult.url;
        } else {
            console.error("Download failed, unexpected result format:", downloadResult);
            await conn.sendMessage(from, { delete: upMsg.key });
            return await reply("*❗ Could not fetch download link. Unexpected result format.*");
        }

        if (!downloadUrl || typeof downloadUrl !== 'string' || !downloadUrl.startsWith('http')) {
            console.error("Invalid download URL:", downloadUrl);
            await conn.sendMessage(from, { delete: upMsg.key });
            return await reply("*❗ Invalid download URL. Expected a valid HTTP URL.*");
        }

        // Remove subdomain and use base domain (e.g., f1.animeheaven.me -> animeheaven.me)
        const originalDownloadUrl = downloadUrl;
        downloadUrl = downloadUrl.replace(/https:\/\/[^/]+.animeheaven\.me/, 'https://animeheaven.me');
        console.log("Using download URL with subdomain removed:", downloadUrl);

        // Verify URL accessibility
        try {
            const response = await axios.head(downloadUrl);
            if (response.status !== 200) {
                throw new Error(`HTTP status ${response.status}`);
            }
            console.log("URL is accessible:", downloadUrl);
        } catch (error) {
            console.error("URL accessibility check failed:", error.message);
            await conn.sendMessage(from, { delete: upMsg.key });
            return await reply("*❗ Download URL is inaccessible. Check network or server.*");
        }

        // Send progress message
        await conn.sendMessage(from, { text: "*Download in progress...*" }, { quoted: upMsg });

        // Get anime details for episode information and send details card
        const episodeLinkParts = q.split('/');
        const animeLink = `https://animeheaven.me/anime.php?${episodeLinkParts[episodeLinkParts.length - 2]}`;
        const animeDetails = await getep(animeLink);
        const episodes = animeDetails?.results || [];
        let episodeInfo = "Unknown Episode";
        let episodeImage = animeDetails?.result?.image || config.LOGO || "https://ibb.co/PGz9FBTz";
        if (episodes && Array.isArray(episodes)) {
            const episodeIndex = episodes.findIndex(ep => `https://animeheaven.me/${ep.url}` === q);
            if (episodeIndex !== -1) {
                const episodeNumber = formatNumber(episodeIndex + 1);
                episodeInfo = `Episode ${episodes[episodeIndex].episode || episodeNumber} - ${animeDetails.result.title}`;
            }
        }

        // Send episode details card
        const detailsCard = `
🎌 *EPISODE DETAILS* 🎌
${oce2}Title:${oce2} ${animeDetails.result.title || 'N/A'}
${oce2}Episode:${oce2} ${episodeInfo}
${oce2}Release Date:${oce2} ${animeDetails.result.date || 'N/A'}
${oce2}IMDb Rating:${oce2} ${animeDetails.result.imdb || 'N/A'}
${oce2}Link:${oce2} ${q}
        `;
        await conn.sendMessage(from, {
            image: { url: episodeImage },
            caption: `${detailsCard}\n\n${config.FOOTER}`
        }, { quoted: mek });

        // Download the episode with the episode name
        const fileName = sanitizeFileName(`${episodeInfo}.mp4`);
        const writer = fs.createWriteStream(fileName);
        const response = await axios({
            url: downloadUrl,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Send the downloaded file as a document with episode details
        await conn.sendMessage(from, {
            document: fs.readFileSync(fileName),
            fileName: fileName,
            mimetype: "video/mp4",
            thumbnailImageUrl: episodeImage,
            caption: `Anime Episode Download: ${q}\nTitle: ${animeDetails.result.title || 'N/A'}\nEpisode: ${episodeInfo}\n\n${config.CAPTION}`
        }, { quoted: mek });

        // Clean up
        fs.unlinkSync(fileName);
        await conn.sendMessage(from, { delete: upMsg.key });
        await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });
    } catch (e) {
        console.error("Error in anime_download:", e);
        const fileToDelete = fs.existsSync(fileName) ? fileName : 'temp_episode.mp4'; // Fallback to old name if exists
        if (fs.existsSync(fileToDelete)) {
            fs.unlinkSync(fileToDelete);
        }
        await conn.sendMessage(from, { delete: upMsg.key });
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply('*❌ An Error Occurred:* ' + e.message);
    }
});
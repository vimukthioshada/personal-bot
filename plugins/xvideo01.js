const config = require('../config');
const { cmd, commands } = require('../command');
const axios = require('axios');
const { storenumrepdata } = require('../lib/nonbutton');
const { getBuffer } = require('../lib/functions');

function formatNumber(num) {
    return String(num).padStart(2, '0');
}

cmd({
    pattern: "xvideo",
    react: "🎥",
    desc: "Search for videos from xvideos",
    category: "media",
    use: ".xvideo <search term>",
    filename: __filename
},
async (conn, mek, m, { from, quoted, args, q, reply }) => {
    try {
        const searchTerm = q && q.trim() !== '' ? q : "latest";
        const apiUrl = `https://www.dark-yasiya-api.site/search/xvideo?text=${encodeURIComponent(searchTerm)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Check if API response is valid
        if (!data || !data.status || !Array.isArray(data.result) || data.result.length === 0) {
            return await reply("*❗ No videos found for the given input.*");
        }

        let videoList = '';
        let numrep = [];
        const videos = data.result;

        for (let i = 0; i < videos.length; i++) {
            // Ensure video object has required properties
            if (!videos[i] || !videos[i].title || !videos[i].duration || !videos[i].url) {
                continue; // Skip invalid video entries
            }
            videoList += ` *${formatNumber(i + 1)} ||* ${videos[i].title} (${videos[i].duration})\n`;
            numrep.push(`${config.PREFIX}xvdl ${videos[i].url}`);
        }

        if (videoList === '') {
            return await reply("*❗ No valid video results found.*");
        }

        const header = `🎥 *XVIDEO SEARCH SYSTEM* 🎥\n\n🔍 Search: *${searchTerm}*\n\n*Results from Dark Yasiya API*\n${videoList}`;
        const footer = `\n${config.FOOTER}\n\n*Reply with a number (e.g., 01) to download!*`;

        const mass = await conn.sendMessage(from, { text: `${header}${footer}` }, { quoted: mek });

        // Store the numbered responses
        const jsonmsg = {
            key: mass.key,
            numrep,
            method: 'nondecimal'
        };
        await storenumrepdata(jsonmsg);

    } catch (e) {
        console.error("Error in xvideo command:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(`*❌ An Error Occurred:* ${e.message || 'Unknown error'}`);
    }
});

cmd({
    pattern: "xvdl",
    react: "⬇️",
    dontAddCommandList: true,
    desc: "Download a video from xvideos search results",
    filename: __filename
},
async (conn, mek, m, { from, quoted, args, q, reply }) => {
    try {
        if (!q || !q.includes('xvideos.com')) {
            return await reply("*❗ Invalid video URL. Please use a number from the search results.*");
        }

        const videoUrl = q.trim();
        const downloadApiUrl = `https://www.dark-yasiya-api.site/download/xvideo?url=${encodeURIComponent(videoUrl)}`;
        const response = await axios.get(downloadApiUrl);
        const data = response.data;

        // Validate download API response
        if (!data || !data.status || !data.result || !data.result.dl_link) {
            return await reply("*❗ Couldn’t fetch download details for this video.*");
        }

        const { title, views, image, like, dislike, size, dl_link } = data.result;

        // Ensure title is a string
        const videoTitle = title || 'Untitled Video';

        // Size check (if size is provided)
        let sizeInMB = size ? parseFloat(size.replace(' MB', '')) : null;
        if (sizeInMB && sizeInMB > config.MAX_SIZE) {
            return await reply(`*❗ File too large (${size}). Use this link to download manually:*\n${dl_link}`);
        }

        // Notify user about the download
        const uploadMsg = await conn.sendMessage(from, { text: `⬇️ Downloading ${videoTitle}${size ? ` (${size})` : ''}...` }, { quoted: mek });

        // Fetch the video file
        const videoBuffer = await getBuffer(dl_link);

        // Send the video as a document with thumbnail
        await conn.sendMessage(from, {
            video: videoBuffer,
            fileName: `${videoTitle}.mp4`,
            mimetype: 'video/mp4',
            thumbnailImageUrl: image || null, // Fallback to null if no image
            caption: `🎥 *${videoTitle}*\n👀 Views: ${views || 'N/A'}\n👍 Likes: ${like || 'N/A'}\n👎 Dislikes: ${dislike || 'N/A'}${size ? `\n📏 Size: ${size}` : ''}\n\n${config.CAPTION}`
        }, { quoted: mek });

        // Delete the "downloading" message
        await conn.sendMessage(from, { delete: uploadMsg.key });
        await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });

    } catch (e) {
        console.error("Error in xvdl command:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(`*❌ An Error Occurred:* ${e.message || 'Unknown error'}`);
    }
});
const ytdl = require('@distube/ytdl-core'); // Replace ytdl-core with this
const fs = require('fs');
const path = require('path');
const { cmd, commands } = require('../command');
const ytSearch = require('yt-search');

cmd({
    pattern: "ytdl",
    react: "🎥",
    alias: ["ytvideo", "ytdownload"],
    desc: "Search and download YouTube videos with quality selection",
    category: "download",
    use: '.ytdl <search query>',
    filename: __filename
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        if (!args.length) return reply("Please provide a search query! Example: `.ytdl shape of you`");

        const query = args.join(" ");
        reply("🔍 Searching YouTube for: " + query);
        const searchResults = await ytSearch(query);

        if (!searchResults.videos.length) return reply("No videos found for your query!");

        const topResults = searchResults.videos.slice(0, 5);
        let searchMsg = `*🎥 YouTube Search Results*\n\n`;
        topResults.forEach((video, index) => {
            searchMsg += `${index + 1}. *${video.title}*\n` +
                         `   ⏱️ Duration: ${video.timestamp}\n` +
                         `   👀 Views: ${video.views}\n` +
                         `   🔗 URL: ${video.url}\n\n`;
        });
        searchMsg += `*Reply with a number (1-5) to select a video!*`;

        const sentMsg = await conn.sendMessage(from, { text: searchMsg }, { quoted: mek });

        conn.ev.on('messages.upsert', async (msgUpdate) => {
            const msg = msgUpdate.messages[0];
            if (!msg.message || !msg.message.extendedTextMessage) return;

            const selectedOption = msg.message.extendedTextMessage.text.trim();
            if (msg.message.extendedTextMessage.contextInfo?.stanzaId !== sentMsg.key.id) return;

            const videoIndex = parseInt(selectedOption) - 1;
            if (isNaN(videoIndex) || videoIndex < 0 || videoIndex >= topResults.length) {
                reply("Invalid selection! Please reply with a number between 1 and 5.");
                return;
            }

            const selectedVideo = topResults[videoIndex];
            const videoUrl = selectedVideo.url;

            const info = await ytdl.getInfo(videoUrl);
            const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
            if (!audioFormats.length) return reply("No audio formats available for this video!");

            let qualityMsg = `*🎵 Audio Quality Options for "${info.videoDetails.title}"*\n\n`;
            audioFormats.forEach((format, idx) => {
                qualityMsg += `${idx + 1}. Bitrate: ${format.audioBitrate || 'Unknown'} kbps\n` +
                              `   Format: ${format.container}\n\n`;
            });
            qualityMsg += `*Reply with a number (1-${audioFormats.length}) to select quality!*\n` +
                          `*Reply "audio" or "doc" after selecting quality!*`;

            const qualitySentMsg = await conn.sendMessage(from, { text: qualityMsg }, { quoted: mek });

            conn.ev.on('messages.upsert', async (qualityMsgUpdate) => {
                const qMsg = qualityMsgUpdate.messages[0];
                if (!qMsg.message || !qMsg.message.extendedTextMessage) return;

                const qResponse = qMsg.message.extendedTextMessage.text.trim();
                if (qMsg.message.extendedTextMessage.contextInfo?.stanzaId !== qualitySentMsg.key.id) return;

                if (['audio', 'doc'].includes(qResponse.toLowerCase())) {
                    const format = audioFormats[conn.selectedQualityIndex];
                    const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, "_");
                    const filePath = path.join(__dirname, `${title}.mp3`);

                    reply(`⏳ Downloading "${info.videoDetails.title}" as ${qResponse.toLowerCase()}...`);
                    const stream = ytdl(videoUrl, { format: format });
                    stream.pipe(fs.createWriteStream(filePath)).on('finish', async () => {
                        if (qResponse.toLowerCase() === 'audio') {
                            await conn.sendMessage(from, {
                                audio: { url: filePath },
                                mimetype: 'audio/mpeg'
                            }, { quoted: mek });
                        } else {
                            await conn.sendMessage(from, {
                                document: { url: filePath },
                                mimetype: 'audio/mpeg',
                                fileName: `${title}.mp3`,
                                caption: "> Powered by Grok"
                            }, { quoted: mek });
                        }
                        fs.unlinkSync(filePath);
                        reply("✅ Download complete!");
                    }).on('error', (err) => {
                        console.error(err);
                        reply("⚠️ Error downloading the file!");
                        fs.unlinkSync(filePath);
                    });
                } else {
                    const qualityIndex = parseInt(qResponse) - 1;
                    if (isNaN(qualityIndex) || qualityIndex < 0 || qualityIndex >= audioFormats.length) {
                        reply(`Invalid quality selection! Please reply with a number between 1 and ${audioFormats.length}.`);
                        return;
                    }
                    conn.selectedQualityIndex = qualityIndex;
                    await conn.sendMessage(from, {
                        text: "🎶 Quality selected! Now reply with 'audio' or 'doc'."
                    }, { quoted: mek });
                }
            });
        });
    } catch (e) {
        console.error("Error in ytdl command:", e);
        reply(`⚠️ An error occurred: ${e.message}`);
    }
});
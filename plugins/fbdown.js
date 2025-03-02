const config = require('../config');
const { cmd, commands } = require('../command');
const { storenumrepdata } = require('../lib/nonbutton');
const { getBuffer } = require('../lib/functions');

function formatNumber(num) {
    return String(num).padStart(2, '0');
}

cmd({
    pattern: "fbdown",
    react: "🎥",
    desc: "Download Facebook videos in SD or HD",
    category: "download",
    use: ".fbdown <Facebook URL> [sd/hd]",
    filename: __filename
},
async (conn, mek, m, { from, quoted, args, q, reply }) => {
    try {
        if (!q) {
            return await reply("*❗ Please provide a valid Facebook URL.*\nExample: .fbdown https://www.facebook.com/share/r/19zyz6X8KJ/ [sd/hd]");
        }

        const input = q.trim().split(' ');
        const url = input[0];
        const quality = input[1] ? input[1].toLowerCase() : null;

        if (!url.includes('facebook.com')) {
            return await reply("*❗ Please provide a valid Facebook URL.*");
        }

        const apiUrl = `https://1234-seven-tau.vercel.app/download/fbdown?url=${encodeURIComponent(url)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.status || !data.result || (!data.result.sd && !data.result.hd)) {
            return await reply("*❗ Couldn’t fetch video details for this Facebook link.*");
        }

        const { thumb, title, desc, sd, hd } = data.result;

        if (quality === 'sd' && sd) {
            // Download SD as video
            const uploadMsg = await conn.sendMessage(from, { text: `⬇️ Downloading ${title || 'video'} (SD)...` }, { quoted: mek });
            const videoBuffer = await getBuffer(sd);

            await conn.sendMessage(from, {
                video: videoBuffer,
                caption: `🎥 *${title || 'No Title'}*\n📜 ${desc}\n📺 Quality: SD\n\n${config.CAPTION}`,
                thumbnail: thumb ? await getBuffer(thumb) : null
            }, { quoted: mek });

            await conn.sendMessage(from, { delete: uploadMsg.key });
            await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });

        } else if (quality === 'hd' && hd) {
            // Download HD as video
            const uploadMsg = await conn.sendMessage(from, { text: `⬇️ Downloading ${title || 'video'} (HD)...` }, { quoted: mek });
            const videoBuffer = await getBuffer(hd);

            await conn.sendMessage(from, {
                video: videoBuffer,
                caption: `🎥 *${title || 'No Title'}*\n📜 ${desc}\n📺 Quality: HD\n\n${config.CAPTION}`,
                thumbnail: thumb ? await getBuffer(thumb) : null
            }, { quoted: mek });

            await conn.sendMessage(from, { delete: uploadMsg.key });
            await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });

        } else {
            // Offer quality options
            let numrep = [];
            let options = `*Available Qualities:*\n`;
            if (sd) {
                options += ` *${formatNumber(1)} ||* SD\n`;
                numrep.push(`${config.PREFIX}fbdown ${url} sd`);
            }
            if (hd) {
                options += ` *${formatNumber(sd ? 2 : 1)} ||* HD\n`;
                numrep.push(`${config.PREFIX}fbdown ${url} hd`);
            }

            const header = `🎥 *FACEBOOK VIDEO DOWNLOAD*\n\n📜 *${title || 'No Title'}*\n${desc || 'No Description'}\n`;
            const footer = `\n${config.FOOTER}\n\n*Reply with a number (e.g., 01) to download!*`;

            const mass = await conn.sendMessage(
                from,
                {
                    image: { url: "https://ibb.co/PGz9FBTz" }, // Assuming 'thumbnail' is a variable with the image URL
                    caption: `${header}${options}${footer}`
                },
                { quoted: mek }
            );
            const jsonmsg = {
                key: mass.key,
                numrep,
                method: 'nondecimal'
            };
            await storenumrepdata(jsonmsg);
        }

    } catch (e) {
        console.error("Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`*❌ An Error Occurred:* ${e.message}`);
    }
});
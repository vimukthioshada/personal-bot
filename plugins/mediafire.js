const config = require('../config');
const { cmd, commands } = require('../command');
const axios = require('axios');
const { getBuffer } = require('../lib/functions');

cmd({
    pattern: "mfire",
    react: "⬇️",
    desc: "Download files from MediaFire",
    category: "download",
    use: ".mfire <MediaFire URL>",
    filename: __filename
},
async (conn, mek, m, { from, quoted, args, q, reply }) => {
    try {
        if (!q || !q.includes('mediafire.com')) {
            return await reply("*❗ Please provide a valid MediaFire URL.*\nExample: .mfire https://www.mediafire.com/file/yce2h1da3kqzh27/WhatsApp+Installer.exe/file");
        }

        const mediafireUrl = q.trim();
        const apiUrl = `https://www.dark-yasiya-api.site/download/mfire?url=${encodeURIComponent(mediafireUrl)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data.status || !data.result || !data.result.dl_link) {
            return await reply("*❗ Couldn’t fetch download details for this MediaFire link.*");
        }

        const { fileName, fileType, size, date, dl_link } = data.result;

        let sizeInMB = null;
        if (size) {
            if (size.includes('KB')) sizeInMB = parseFloat(size.replace('KB', '')) / 1024;
            else if (size.includes('MB')) sizeInMB = parseFloat(size.replace('MB', ''));
            else if (size.includes('GB')) sizeInMB = parseFloat(size.replace('GB', '')) * 1024;
        }

        if (sizeInMB && sizeInMB > config.MAX_SIZE) {
            return await reply(`*❗ File too large (${size}). Use this link to download manually:*\n${dl_link}`);
        }

        const uploadMsg = await conn.sendMessage(from, { text: `⬇️ Downloading ${fileName || 'file'} (${size || 'Unknown size'})...` }, { quoted: mek });
        const fileBuffer = await getBuffer(dl_link);

        await conn.sendMessage(from, {
            document: fileBuffer,
            fileName: fileName || 'MediaFire_File',
            mimetype: fileType || 'application/octet-stream',
            caption: `📁 *${fileName || 'Unnamed File'}*\n📏 Size: ${size || 'Unknown'}\n📅 Date: ${date || 'N/A'}\n\n${config.CAPTION}`
        }, { quoted: mek });

        await conn.sendMessage(from, { delete: uploadMsg.key });
        await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });

    } catch (e) {
        console.error("Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`*❌ An Error Occurred:* ${e.message}`);
    }
});
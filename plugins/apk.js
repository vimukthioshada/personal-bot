const config = require('../config');
const { cmd, commands } = require('../command');
const axios = require('axios');
const { storenumrepdata } = require('../lib/nonbutton');
const { getBuffer } = require('../lib/functions');

function formatNumber(num) {
    return String(num).padStart(2, '0');
}

cmd({
    pattern: "apk",
    react: "📱",
    desc: "Search for WhatsApp-related APKs",
    category: "search",
    use: ".apk <search term>",
    filename: __filename
},
async (conn, mek, m, { from, quoted, args, q, reply }) => {
    try {
        const searchTerm = q && q.trim() !== '' ? q : "whatsapp";
        const apiUrl = `https://www.dark-yasiya-api.site/search/apk?text=${encodeURIComponent(searchTerm)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data.status || !data.result || !data.result.data || data.result.data.length === 0) {
            return await reply("*❗ No APKs found for the given input.*");
        }

        const apkData = data.result.data;
        let apkList = '';
        let numrep = [];

        for (let i = 0; i < apkData.length; i++) {
            apkList += ` *${formatNumber(i + 1)} ||* ${apkData[i].name}\n`;
            numrep.push(`${config.PREFIX}apkdl ${apkData[i].id}`);
        }

        const message = `
📱 *APK SEARCH SYSTEM* 📱
📲 Search: *${searchTerm}*
*Results from Dark Yasiya API*

${apkList}
*${config.FOOTER}*

*Reply with a number (e.g., 01) to download!*`;

        const mass = await conn.sendMessage(from, { text: message }, { quoted: mek });

        // Store the numbered responses for reply functionality
        const jsonmsg = {
            key: mass.key,
            numrep,
            method: 'nondecimal'
        };
        await storenumrepdata(jsonmsg);

    } catch (e) {
        console.error("Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`*❌ An Error Occurred:* ${e.message}`);
    }
});

cmd({
    pattern: "apkdl",
    react: "⬇️",
    dontAddCommandList: true,
    desc: "Download an APK from search results",
    filename: __filename
},
async (conn, mek, m, { from, quoted, args, q, reply }) => {
    try {
        if (!q || !q.includes('com.')) {
            return await reply("*❗ Invalid package ID. Please use a number from the search results.*");
        }

        const packageId = q.trim();
        const apiUrl = `https://www.dark-yasiya-api.site/download/apk?id=${encodeURIComponent(packageId)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data.status || !data.result || !data.result.dl_link) {
            return await reply("*❗ Couldn’t fetch download details for this APK.*");
        }

        const { name, size, dl_link, image } = data.result;

        // Check file size (assuming config.MAX_SIZE is in MB)
        const sizeInMB = parseFloat(size.replace(' MB', ''));
        if (sizeInMB > config.MAX_SIZE) {
            return await reply(`*❗ File too large (${size}). Use this link to download manually:*\n${dl_link}`);
        }

        // Notify user about the download
        const uploadMsg = await conn.sendMessage(from, { text: `⬇️ Downloading ${name} (${size})...` }, { quoted: mek });

        // Fetch the APK file
        const apkBuffer = await getBuffer(dl_link);

        // Send the APK as a document with thumbnail
        await conn.sendMessage(from, {
            document: apkBuffer,
            fileName: `${name}.apk`,
            mimetype: 'application/vnd.android.package-archive',
            thumbnail: image ? await getBuffer(image) : null,
            caption: `📱 *${name}*\n📏 Size: ${size}\n\n${config.CAPTION}`
        }, { quoted: mek });

        // Delete the "downloading" message and react
        await conn.sendMessage(from, { delete: uploadMsg.key });
        await conn.sendMessage(from, { react: { text: '✔', key: mek.key } });

    } catch (e) {
        console.error("Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`*❌ An Error Occurred:* ${e.message}`);
    }
});
const config = require('../config');
const os = require('os');
const { cmd, commands } = require('../command');
const { getBuffer, runtime } = require('../lib/functions');

cmd({
    pattern: "alive",
    react: "🍬",
    alias: ["online", "test", "bot"],
    desc: "Check if bot is online.",
    category: "other",
    use: '.alive',
    filename: __filename
},
async (conn, mek, m, { from, pushname, reply }) => {
    try {
        const hostname = os.hostname().length === 12 ? 'Replit' : 
                        os.hostname().length === 36 ? 'Heroku' : 
                        os.hostname().length === 8 ? 'Koyeb' : os.hostname();
        
        const aliveMsg = `
*🌟 Nebula-MD is Alive! 🌟*
👋 Hello ${pushname}!

*Bot Info:*
> Version: ${require("../package.json").version}
> Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
> Runtime: ${runtime(process.uptime())}
> Platform: ${hostname}

*🍭 Enjoy your day! 🍭*`;

        const buttons = [
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: config.BTN, url: config.BTNURL, merchant_url: config.BTNURL }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📋 Menu", id: ".menu" }) }
        ];

        const opts = {
            image: config.LOGO,
            header: '',
            footer: config.FOOTER,
            body: aliveMsg
        };
        await conn.sendButtonMessage(from, buttons, m, opts);
    } catch (e) {
        reply('*⚠️ Error!*');
        console.log(e);
    }
});

cmd({
    pattern: "menu",
    react: "🗃️",
    alias: ["panel", "list", "commands"],
    desc: "Display bot command list with category selection.",
    category: "other",
    use: ".menu",
    filename: __filename
},
async (conn, mek, m, { from, pushname, args, reply }) => {
    try {
        const hostname = os.hostname().length === 12 ? 'Replit' : 
                        os.hostname().length === 36 ? 'Heroku' : 
                        os.hostname().length === 8 ? 'Koyeb' : os.hostname();

        const botInfo = `
*🌌 Nebula-MD Command Menu 🌌*
👋 Hi ${pushname}!

*Bot Stats:*
> Version: ${require("../package.json").version}
> Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
> Runtime: ${runtime(process.uptime())}
> Platform: ${hostname}`;

        // Organize commands into categories
        const categoryMap = new Map();
        for (const cmd of commands) {
            if (!cmd.dontAddCommandList && cmd.pattern) {
                const category = cmd.category.toUpperCase();
                if (!categoryMap.has(category)) categoryMap.set(category, []);
                categoryMap.get(category).push(cmd.pattern);
            }
        }

        // If a category is specified, show its commands
        if (args[0]) {
            const selectedCategory = args[0].toUpperCase();
            if (categoryMap.has(selectedCategory)) {
                const cmdList = categoryMap.get(selectedCategory)
                    .map(cmd => `> .${cmd}`).join('\n');
                const categoryMsg = `
*${selectedCategory} Commands* ✨
${cmdList}

*${config.FOOTER}*`;

                const buttons = [
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🔙 Back to Menu", id: ".menu" }) }
                ];
                const opts = {
                    image: config.LOGO,
                    header: '',
                    footer: '',
                    body: categoryMsg
                };
                return await conn.sendButtonMessage(from, buttons, m, opts);
            } else {
                return reply("*⚠️ Invalid category!* Use `.menu` to see available categories.");
            }
        }

        // Show category selection
        const categories = Array.from(categoryMap.keys());
        const rows = categories.map(category => ({
            header: '',
            title: `📂 ${category}`,
            description: `${categoryMap.get(category).length} Commands`,
            id: `.menu ${category.toLowerCase()}`
        }));

        const buttons = [
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: config.BTN, url: config.BTNURL, merchant_url: config.BTNURL }) },
            { 
                name: "single_select", 
                buttonParamsJson: JSON.stringify({
                    title: '📜 Select a Category',
                    sections: [{
                        title: '🛠 Command Categories',
                        highlight_label: 'Choose One',
                        rows: rows
                    }]
                })
            }
        ];

        const opts = {
            image: config.LOGO,
            header: '📋 Command Menu',
            footer: config.FOOTER,
            body: botInfo
        };

        await conn.sendButtonMessage(from, buttons, m, opts);
    } catch (e) {
        reply('*⚠️ Error Occurred!*');
        console.error(e);
    }
});
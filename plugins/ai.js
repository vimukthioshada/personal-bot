const config = require('../config');
const { cmd, commands } = require('../command');
const { fetchJson } = require('../lib/functions');

cmd(
    {
        pattern: "ai",
        alias: ["gpt", "bot"],
        react: "📑",
        desc: "AI chat using GPT.",
        category: "main",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            isGroup,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isAdmins,
            reply,
        }
    ) => {
        try {
            // Input Validation
            if (!q || q.trim().length === 0) {
                return reply("Please ask something");
            }

            // Fetching API Response
            let data;
            try {
                data = await fetchJson(
                    `https://www.dark-yasiya-api.site/ai/letmegpt?q=${encodeURIComponent(q)}`
                );
            } catch (fetchError) {
                console.error("API Fetch Error:", fetchError);
                return reply("❌ Unable to connect to the API. Please try again later.");
            }

            // Validate API Response Structure
            if (!data || !data.result) {
                console.error("Invalid API Response:", data);
                return reply("❌ API returned an invalid response. Please contact the administrator.");
            }

            // Sending AI Response
            return reply(`🤖 *CHATGPT RESPONCE:*\n\n ~${pushname}~ ${data.result}`);
        } catch (error) {
            console.error("Unexpected Error:", error);

            // Handle Unexpected Errors
            return reply("❌ An unexpected error occurred. Please try again.");
        }
    }
);

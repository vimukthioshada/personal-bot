const config = require("../config");
const { cmd, commands } = require("../command");
const { fetchJson } = require("../lib/functions");
const axios = require("axios");
const fs = require("fs/promises");
const path = require("path");

// Temporary state to track ongoing interactions
const userState = {};

cmd(
    {
        pattern: "mvs",
        alias: ["searchtv", "searchmovies"],
        react: "🎬",
        desc: "Search for TV shows and movies.",
        category: "entertainment",
        filename: __filename,
    },
    async (conn, mek, m, { from, body, q, reply, pushname }) => {
        try {
            // Validate Input
            if (!q || q.trim().length === 0) {
                return reply(
                    "❌ Please specify the TV show or movie name. Example: .tvs The 100",
                );
            }

            // API URL for search query
            const apiURL = `https://api-cine-dyxt-gilt.vercel.app/api/pirate/movie?url=${encodeURIComponent(q)}&apikey=private999apikey`;
            let data;

            try {
                data = await fetchJson(apiURL);
            } catch (error) {
                console.error("API Fetch Error:", error);
                return reply(
                    "❌ Unable to connect to the API. Please try again later.",
                );
            }

            if (data.data.data) {
                console.error("Invalid API Response:", data);
                return reply(`❌ No results found for "${q}".`);
            }

            const results =  data.data.data;
            let response = `🔍 *Search Results for "${q}":*\n\n`;

            results.forEach((item) => {
                response += `
🎬 *Title:* ${item.title} (${item.year})
📌 *Type:* ${item.type}
📝 *Description:* ${item.description}
🔗 *Link:* [Click here](${item.link})
🖼️ *Image:* ${item.image}
                `;
            });

            await reply(response);
        } catch (error) {
            console.error("Unexpected Error:", error);
            return reply("❌ An unexpected error occurred. Please try again.");
        }
    },
);

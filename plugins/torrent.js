const { cmd } = require("../command");
const fetch = require("node-fetch"); // Import node-fetch
const fs = require("fs").promises;
const path = require("path");

cmd(
    {
        pattern: "firemovie",
        alias: ["moviefire", "moviesearch"],
        react: "🎬",
        desc: "Search Movies on Fire Movies Hub",
        category: "media",
        use: ".firemovie <movie name>",
        filename: __filename,
    },
    async (conn, mek, m, { from, reply, args, q }) => {
        try {
            if (!q) {
                return await reply(`
*🎬 FIRE MOVIE SEARCH*

Usage: .firemovie <movie name>

Examples:
.firemovie Iron Man
.firemovie Avengers
.firemovie Spider-Man

*Tips:*
- Be specific with movie name
- Use full movie titles`);
            }

            await m.react("🔍");
            const encodedQuery = encodeURIComponent(q);
            const searchResponse = await fetch(
                `https://www.dark-yasiya-api.site/movie/firemovie/search?text=${encodedQuery}`
            );

            const searchData = await searchResponse.json();

            if (!searchData || !searchData.status) {
                return await reply("❌ No movies found or API error.");
            }

            const movies = searchData.result.data;

            // Filter out explicit content based on title
            const filteredMovies = movies.filter(movie => 
                !/porn|sex|adult|nude|xxx/i.test(movie.title) // Filter out titles with adult content
            );

            if (filteredMovies.length === 0) {
                return await reply(`❌ No valid movies found for "${q}".`);
            }

            let desc = `*乂 THENU-MD MOVIE SEARCH ◉◉►*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓

${filteredMovies
    .map(
        (movie, index) => `*${index + 1}. ${movie.title} (${movie.year})*
   📄 Type: ${movie.type}
   🔗 Link: ${movie.link}
   imdb: ${movie.imdb}
   link : ${movie.link}
   
`,
    )
    .join("\n")}

┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

*乂◉◉► REPLY THE NUMBER FOR DETAILS* 

┌───────────────────────────────────
*Choose a number to get movie details*
└───────────────────────────────────
> `;

            const sentMsg = await conn.sendMessage(
                from,
                {
                    text: desc,
                    contextInfo: {
                        externalAdReply: {
                            title: `Thenu-MD Movie Search`,
                            body: `Search results for: ${q}`,
                            thumbnailUrl: filteredMovies[0].thumb,
                            sourceUrl: filteredMovies[0].link,
                            mediaType: 1,
                            renderLargerThumbnail: true,
                        },
                    },
                },
                { quoted: mek },
            );

            const messageID = sentMsg.key.id;

            conn.ev.on("messages.upsert", async (messageUpdate) => {
                const mek = messageUpdate.messages[0];
                if (!mek.message) return;

                const messageType =
                    mek.message.conversation ||
                    mek.message.extendedTextMessage?.text;

                const isReplyToSentMsg =
                    mek.message.extendedTextMessage &&
                    mek.message.extendedTextMessage.contextInfo.stanzaId ===
                        messageID;

                if (isReplyToSentMsg) {
                    const selectedIndex = parseInt(messageType) - 1;

                    if (selectedIndex >= 0 && selectedIndex < filteredMovies.length) {
                        const selectedMovie = filteredMovies[selectedIndex];
                        try {
                          const detailResponse = await fetch(
                            `https://www.dark-yasiya-api.site/download/xvideo?url=${encodeURIComponent(selectedMovie.link)}`
                        );
                        
                        const detailData = await detailResponse.json();
                        
                        if (!detailData || !detailData.status) {
                            return await reply("❌ Failed to fetch movie details.");
                        }
                        
                        const movieDetails = {
                            title: detailData.result.title,
                            date: "N/A", // Since no release date is available in the response, you might want to handle it accordingly.
                            duration: "N/A", // Same as for date, there is no duration available in the provided API response.
                            category: ["N/A"], // You can also add default categories if none are available.
                            director: "N/A", // Similarly, handle the director as needed.
                            tmdbRate: "N/A", // No rating available in the response.
                            cast: ["N/A"], // No cast info available in the response, handle accordingly.
                            mainImage: detailData.result.image,
                            dl_links: [
                                {
                                    quality: "Unknown",
                                    size: "Unknown",
                                    link: detailData.result.dl_link
                                }
                            ]
                        };
                        
                        await conn.sendMessage(from, {
                            react: { text: "🎬", key: mek.key },
                        });
                        
                        const detailMessage = `
                        *🎬 MOVIE DETAILS*
                        
                        📽️ *Title*: ${movieDetails.title}\n
                        📅 *Release Date*: ${movieDetails.date}\n
                        ⏱️ *Duration*: ${movieDetails.duration}\n
                        
                        🏷️ *Categories*: 
                        ${movieDetails.category.join(", ")}
                        
                        🎥 *Director*: ${movieDetails.director}\n
                        ⭐ *TMDB Rating*: ${movieDetails.tmdbRate}
                        
                        *🌟 CAST*:
                        ${movieDetails.cast.join("\n")}
                        
                        *🔗 DOWNLOAD OPTIONS*:
                        ${movieDetails.dl_links
                            .map((link, index) => `*${index + 1}. ${link.quality}* (${link.size})`)
                            .join("\n")}
                        
                        > Powered by Fire Movies Hub`;
                        
                        const mediaMessage = await conn.sendMessage(
                            from,
                            {
                                image: { url: movieDetails.mainImage },
                                caption: detailMessage,
                            },
                            { quoted: mek }
                        );
                        
                        global.movieDownloadDetails = {
                            links: movieDetails.dl_links,
                            title: movieDetails.title,
                        };
                        
                        await conn.sendMessage(from, {
                            text: `
                        *🔽 DOWNLOAD OPTIONS*
                        
                        Reply with the number corresponding to the download quality:
                        ${movieDetails.dl_links.map((link, index) =>
                            `*${index + 1}.* ${link.quality} (${link.size})`
                        ).join('\n')}
                        
                        > Choose your preferred download option`,
                        }, { quoted: mediaMessage });                        
                        } catch (detailError) {
                            console.error("Movie Detail Fetch Error:", detailError);
                            await reply("❌ Failed to fetch movie details.");
                        }
                    } else {
                        await conn.sendMessage(from, {
                            react: { text: "❓", key: mek.key },
                        });
                        reply("Please enter a valid movie number!");
                    }
                } 
            });
        } catch (error) {
            console.error("Movie Search Error:", error);
            await reply("❌ An error occurred during the movie search.");
        }
    }
);

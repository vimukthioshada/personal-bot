const config = require('../config')
const { cmd, commands } = require('../command')
const axios = require('axios')
const fs = require('fs')

// Define owner number (you can also get this from config if it's already there)
const OWNER_NUMBER = '94755773910' // Same as in your main code

// File to store active group IDs
const GROUPS_FILE = './activeGroups.json'

// Load active groups from file on startup
let activeGroups = new Set()
if (fs.existsSync(GROUPS_FILE)) {
    const data = fs.readFileSync(GROUPS_FILE, 'utf8')
    activeGroups = new Set(JSON.parse(data))
}

// Store sent news titles
let sentNews = new Set()

// Function to save active groups to file
function saveActiveGroups() {
    fs.writeFileSync(GROUPS_FILE, JSON.stringify([...activeGroups]), 'utf8')
}

// Function to fetch news from API
async function fetchNews() {
    try {
        const response = await axios.get('https://deneth-dev-api-links.vercel.app/api/hiru?&api_key=deneth-md')
        return response.data
    } catch (error) {
        console.log('Error fetching news:', error)
        return null
    }
}

// Command to activate news sending for a group (Owner only)
cmd({
    pattern: "active",
    desc: "Activate news sending for this group (owner only)",
    category: "news",
    filename: __filename
},
async (conn, mek, m, { from, sender, isGroup, reply }) => {
    try {
        // Check if the sender is the owner
        const senderNumber = sender.split('@')[0]
        if (senderNumber !== OWNER_NUMBER) {
            return reply("⛔ This command can only be used by the bot owner.")
        }

        if (!isGroup) {
            return reply("⛔ This command can only be used in groups.")
        }

        if (activeGroups.has(from)) {
            return reply("✅ This group is already activated for news updates.")
        }

        activeGroups.add(from)
        saveActiveGroups()
        reply("✅ News updates activated for this group! New news will be sent as it arrives.")
        
    } catch (e) {
        console.log(e)
        reply(`Error: ${e.message}`)
    }
})

// Command to deactivate news sending (Owner only)
cmd({
    pattern: "deactive",
    desc: "Deactivate news sending for this group (owner only)",
    category: "news",
    filename: __filename
},
async (conn, mek, m, { from, sender, isGroup, reply }) => {
    try {
        // Check if the sender is the owner
        const senderNumber = sender.split('@')[0]
        if (senderNumber !== OWNER_NUMBER) {
            return reply("⛔ This command can only be used by the bot owner.")
        }

        if (!isGroup) {
            return reply("⛔ This command can only be used in groups.")
        }

        if (!activeGroups.has(from)) {
            return reply("❌ This group is not activated for news updates.")
        }

        activeGroups.delete(from)
        saveActiveGroups()
        reply("✅ News updates deactivated for this group.")
        
    } catch (e) {
        console.log(e)
        reply(`Error: ${e.message}`)
    }
})

// Function to send news to active groups
async function sendNewsToGroups(conn) {
    if (!conn) {
        console.log("WhatsApp connection not available")
        return
    }

    const newsData = await fetchNews()
    if (!newsData || !newsData.status || !newsData.result) {
        console.log("No valid news data received.")
        return
    }

    const news = newsData.result
    const newsTitle = news.title

    if (sentNews.has(newsTitle)) return

    const newsMessage = `
📰 *${news.title}*  
📅 ${news.date}  
📝 ${news.desc}  
🔗 ${news.link}
`.trim()

    for (let groupId of activeGroups) {
        try {
            await conn.sendMessage(groupId, {
                image: { url: news.img },
                caption: newsMessage
            })
            sentNews.add(newsTitle)
        } catch (error) {
            console.log(`Error sending news to group ${groupId}:`, error)
        }
    }
}

// Export function to start news service with connection
let intervalId = null
module.exports = {
    startNewsService: (conn) => {
        if (intervalId) {
            clearInterval(intervalId)
        }

        intervalId = setInterval(() => {
            if (activeGroups.size > 0 && conn) {
                sendNewsToGroups(conn)
            }
        }, 300000) // 5 minutes

        return () => {
            if (intervalId) {
                clearInterval(intervalId)
                intervalId = null
            }
        }
    }
}
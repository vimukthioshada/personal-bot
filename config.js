const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });
 
function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
ALIVE_IMG : process.env.ALIVE_IMG || "https://pomf2.lain.la/f/id9p5zqm.jpg",
AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || "true",
    SESSION_ID: process.env.SESSION_ID || "",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "94755773910",
    AUTO_VIEW_STATUS: process.env.AUTO_VIEW_STATUS || "true",
    MODE: process.env.MODE || "public",
    ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/r4decc.jpg",
    PREFIX: process.env.PREFIX || ".",
    OWNER_REACT: process.env.OWNER_REACT || "true",
    AUTO_REACT: process.env.AUTO_REACT || "true",
    OWNER_NAME: process.env.OWNER_NAME || "wolf",
    BOT_NAME: process.env.BOT_NAME || "wolf",
    MONGODB: process.env.MONGODB || "mongodb+srv://oshadavimukthi555:<db_password>@filmxyz.xptc9.mongodb.net/?",
   CAPTION: process.env.CAPTION || "Made By Wolf",
    FOOTER: process.env.FOOTER || "Wolf",
    JIDS: ["120363045197379067@g.us"], // MOVIE GROUP WALA JIDs
    SUDO: ['94755773910'],

  //========================================- OTHER - CONFIGS -=====================================================================
  AUTO_VOICE: process.env.AUTO_VOICE || "false",
  ANTI_BAD_WORDS_ENABLED: process.env.ANTI_BAD_WORDS_ENABLED || "true",
  AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || "true",
  ANTI_BAD_WORDS: (process.env.ANTI_BAD_WORDS || "pakayo,huththo").split(','),
  ANTI_LINK: process.env.ANTILINK || "false",
  ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "true",
  ALWAYS_TYPING: process.env.ALWAYS_TYPING || "true",
  ALWAYS_RECORDING: process.env.ALWAYS_RECORDING || "false",
  ANTI_BOT: process.env.ANTI_BOT || "true",
  ANTI_DELETE: process.env.ANTI_DELETE || "true",
  packname: process.env.packname || "🪄BHASHI",
  author: process.env.author || "BHASHI x VISHWA",
};

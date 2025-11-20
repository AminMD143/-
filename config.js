// /pesho/config.js  (lines 1..120)
require('dotenv').config();

function toBool(s, defaultValue = false) {
  if (typeof s === 'boolean') return s;
  if (!s && defaultValue !== undefined) return defaultValue;
  return String(s).toLowerCase() === 'true';
}

module.exports = {
  // core
  SESSION_ID: process.env.SESSION_ID || '',
  PREFIX: process.env.PREFIX || '.',
  BOT_NAME: process.env.BOT_NAME || 'PESHO',
  MODE: process.env.MODE || 'public',

  // owner
  OWNER_NUMBER: process.env.OWNER_NUMBER || '',
  OWNER_NAME: process.env.OWNER_NAME || 'Owner',

  // utils
  PORT: parseInt(process.env.PORT || '8080', 10),

  // features (toggle via ENV)
  AUTO_REPLY: toBool(process.env.AUTO_REPLY, false),
  AUTO_STICKER: toBool(process.env.AUTO_STICKER, false),
  ANTI_DELETE: process.env.ANTI_DELETE || 'true',
  ANTI_LINK: process.env.ANTI_LINK || 'true',

  // media / images
  MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || 'https://files.catbox.moe/4964gx.jpg'
};

// /pesho/index.js (lines 1..220)
'use strict';
const fs = require('fs');
const path = require('path');
const express = require('express');
const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const config = require('./config');

const logger = pino({ level: 'info' });
const app = express();
app.use(express.json());

const PORT = config.PORT || 8080;
const SESS_FILE = path.join(__dirname, 'session.json');

// Express endpoints (pairing / status)
app.get('/', (req, res) => res.send(`${config.BOT_NAME} alive`));

// Optional pairing endpoint for pairing proxies (Katabump -> external pairing)
app.post('/pair', async (req, res) => {
  // simple pairing payload handler (bridge with pairing proxy)
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'missing token' });
  // implement your pairing handshake if needed
  return res.json({ ok: true, token });
});

// Start HTTP server
app.listen(PORT, () => {
  logger.info(`${config.BOT_NAME} running on port ${PORT}`);
});

// Session management helper (single-file state)
const { state, saveState } = useSingleFileAuthState(SESS_FILE);

// create the socket
async function start() {
  try {
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
      logger,
      printQRInTerminal: true,
      auth: state,
      version
    });

    // save state on updates
    sock.ev.on('creds.update', saveState);

    // basic connection handling
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'close') {
        const status = (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output) || lastDisconnect;
        logger.error('connection closed: %o', status);
        // if logout or bad auth, exit to let process manager restart and create new session
        if (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode === DisconnectReason.loggedOut) {
          logger.error('logged out - deleting session file and exiting');
          try { fs.unlinkSync(SESS_FILE); } catch (e) {}
          process.exit(0);
        } else {
          // attempt restart
          start().catch(err => logger.error(err));
        }
      } else if (connection === 'open') {
        logger.info('Baileys connection open');
      }
    });

    // message handling skeleton
    sock.ev.on('messages.upsert', async (m) => {
      try {
        const msg = m.messages && m.messages[0];
        if (!msg || msg.key && msg.key.remoteJid === 'status@broadcast') return;
        // auto-read, simple auto-reply placeholder
        if (config.AUTO_REPLY) {
          const jid = msg.key.remoteJid;
          await sock.sendMessage(jid, { text: 'Auto-reply is active' });
        }
        // placeholder: dispatch commands (prefix)
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        if (text.startsWith(config.PREFIX)) {
          const [cmd, ...rest] = text.slice(config.PREFIX.length).trim().split(/\s+/);
          // load commands on demand from ./commands
          const cmdPath = path.join(__dirname, 'commands', `${cmd}.js`);
          if (fs.existsSync(cmdPath)) {
            try {
              const handler = require(cmdPath);
              if (typeof handler.run === 'function') {
                await handler.run({ sock, msg, args: rest, config });
              }
            } catch (e) {
              logger.error('command handler error: %o', e);
            }
          }
        }
      } catch (e) {
        logger.error(e);
      }
    });

    // load commands list (optional)
    const commandsDir = path.join(__dirname, 'commands');
    if (!fs.existsSync(commandsDir)) fs.mkdirSync(commandsDir);
    // copy sample command if none exists
    const sampleCmdFile = path.join(commandsDir, 'ping.js');
    if (!fs.existsSync(sampleCmdFile)) {
      fs.writeFileSync(sampleCmdFile, `exports.run = async ({ sock, msg }) => {
  await sock.sendMessage(msg.key.remoteJid, { text: 'PONG' });
};`);
    }

  } catch (err) {
    logger.error('start error', err);
    process.exit(1);
  }
}

start();

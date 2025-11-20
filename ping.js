// /pesho/commands/ping.js
exports.run = async ({ sock, msg }) => {
  await sock.sendMessage(msg.key.remoteJid, { text: 'PESHO pong' });
};

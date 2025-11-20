// /pesho/lib/command.js (lines 1..60)
const commands = [];

function cmd(info, fn) {
  const data = Object.assign({}, info);
  data.function = fn;
  if (typeof data.dontAddCommandList === 'undefined') data.dontAddCommandList = false;
  if (!data.desc) data.desc = '';
  if (typeof data.fromMe === 'undefined') data.fromMe = false;
  if (!data.category) data.category = 'misc';
  if (!data.filename) data.filename = 'Not Provided';
  commands.push(data);
  return data;
}

module.exports = {
  cmd,
  AddCommand: cmd,
  Function: cmd,
  Module: cmd,
  commands
};

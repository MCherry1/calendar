// Messaging utilities: send, whisper, warnGM, etc.
// Separated to avoid circular dependencies between commands, rendering, and weather.
import { script_name } from './constants.js';

export function cleanWho(who){
  return String(who||'').replace(/\s+\(GM\)$/,'').replace(/["\\]/g,'').trim();
}

export function send(opts, html){
  opts = opts || {};
  var to = cleanWho(opts.to);
  var prefix;
  if (opts.broadcast)   prefix = '/direct ';
  else if (opts.gmOnly) prefix = '/w gm ';
  else if (to)          prefix = '/w "' + to + '" ';
  else                  prefix = '/direct ';
  sendChat(script_name, prefix + html);
}

export function sendToAll(html){ send({ broadcast:true }, html); }
export function sendToGM(html){  send({ gmOnly:true }, html); }
export function whisper(to, html){ send({ to:to }, html); }
export function warnGM(msg){ sendChat(script_name, '/w gm ' + msg); }

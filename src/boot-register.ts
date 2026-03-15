// Section 19: Boot
import { LABELS } from './constants.js';
import { checkInstall } from './state.js';
import { _normalizePackedWords, cleanWho, whisper } from './commands.js';
import { maybeHandleSetupGate } from './setup.js';
import { commands } from './today.js';


/* ============================================================================
 * 19) BOOT
 * ==========================================================================*/

export function handleInput(msg){
  if (msg.type!=='api' || !/^!cal\b/i.test(msg.content)) return;
  checkInstall();
  var args = msg.content.trim().split(/\s+/);
  args = args.slice(0,2).concat(_normalizePackedWords(args.slice(2).join(' ')).split(/\s+/).filter(Boolean));
  if (maybeHandleSetupGate(msg, args)) return;
  var sub = String(args[1]||'').toLowerCase();
  var cmd = commands[sub] || commands[''];
  if (typeof cmd === 'function'){ cmd(msg, args); return; }
  if (cmd.gm && !playerIsGM(msg.playerid)){
    whisper(cleanWho(msg.who), LABELS.gmOnlyNotice);
    return;
  }
  cmd.run(msg, args);
}

export function register(){ on('chat:message', handleInput); }




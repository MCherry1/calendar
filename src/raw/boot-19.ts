/* ============================================================================
 * 19) BOOT
 * ==========================================================================*/

function handleInput(msg){
  if (msg.type!=='api' || !/^!cal\b/i.test(msg.content)) return;
  checkInstall();
  var args = msg.content.trim().split(/\s+/);
  args = args.slice(0,2).concat(_normalizePackedWords(args.slice(2).join(' ')).split(/\s+/).filter(Boolean));
  var sub = String(args[1]||'').toLowerCase();
  var cmd = commands[sub] || commands[''];
  if (typeof cmd === 'function'){ cmd(msg, args); return; }
  if (cmd.gm && !playerIsGM(msg.playerid)){
    whisper(cleanWho(msg.who), LABELS.gmOnlyNotice);
    return;
  }
  cmd.run(msg, args);
}

function register(){ on('chat:message', handleInput); }


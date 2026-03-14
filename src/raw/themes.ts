/* ============================================================================
 * 15) THEMES, NAMES, SOURCES
 * ==========================================================================*/

function _orderedKeys(obj, preferred){
  var ks = Object.keys(obj), seen = {}, out = [];
  if (preferred && preferred.length){
    for (var i=0;i<preferred.length;i++){ var k=preferred[i]; if (ks.indexOf(k)!==-1 && !seen[k]){ out.push(k); seen[k]=1; } }
  }
  ks.sort().forEach(function(k){ if (!seen[k]) out.push(k); });
  return out;
}

function themeListHtml(readOnly){
  var cur = ensureSettings().colorTheme;
  var names = _orderedKeys(COLOR_THEMES, THEME_ORDER);
  if(!names.length) return '<div style="opacity:.7;">No themes available.</div>';

  var rows = names.map(function(n){
    var label = titleCase(n);
    var head = readOnly
      ? '<b>'+esc(label)+':</b>' + (n===cur ? ' <span style="opacity:.7">(current)</span>' : '')
      : button('Set '+label+':', 'theme '+n) + (n===cur ? ' <span style="opacity:.7">(current)</span>' : '');
    var swatches = (COLOR_THEMES[n]||[]).slice(0,12).map(function(c){
      return '<span title="'+esc(c)+'" style="display:inline-block;width:12px;height:12px;border:1px solid #000;margin-right:2px;background:'+esc(c)+';"></span>';
    }).join('');
    return '<div style="margin:6px 0;">'+ head + '<br>' + swatches + '<br></div>';
  });

  return '<div style="margin:4px 0;"><b>Color Themes</b></div>' + rows.join('');
}

function colorsNamedListHtml(){
  var items = Object.keys(NAMED_COLORS);
  if(!items.length) return '<div style="opacity:.7;">No named colors.</div>';

  var rows = items.map(function(k){
    var c = NAMED_COLORS[k];
    return '<div style="margin:2px 0;">'+swatchHtml(c)+' <code>'+esc(k)+'</code> — '+esc(c)+'</div>';
  }).join('');

  return '<div style="margin:4px 0;"><b>Named Colors</b></div>'+rows;
}


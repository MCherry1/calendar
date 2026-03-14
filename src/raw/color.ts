/* ============================================================================
 * 4) COLOR UTILITIES
 * ==========================================================================*/

var _contrastCache  = Object.create(null);
var _headerStyleCache = Object.create(null);

function _cullCacheIfLarge(obj, max){
  var limit = max || 256;
  if (Object.keys(obj).length > limit){
    for (var k in obj){ if (Object.prototype.hasOwnProperty.call(obj,k)) delete obj[k]; }
  }
}

function _resetColorCaches(){
  _contrastCache    = Object.create(null);
  _headerStyleCache = Object.create(null);
}

function sanitizeHexColor(s){
  if(!s) return null;
  var hex = String(s).trim().replace(/^#/, '');
  if(/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/(.)/g,'$1$1');
  if(/^[0-9a-f]{6}$/i.test(hex)) return '#'+hex.toUpperCase();
  return null;
}

function resolveColor(s){
  if (!s) return null;
  var hex = sanitizeHexColor(s);
  if (hex) return hex;
  var key = String(s).trim().toLowerCase();
  return NAMED_COLORS[key] || null;
}

function popColorIfPresent(tokens, allowBareName){
  tokens = (tokens || []).slice();
  if (!tokens.length) return { color:null, tokens:tokens };
  var last = String(tokens[tokens.length-1]||'').trim();

  var col = null;
  if (allowBareName){
    col = resolveColor(last) || _parseSharpColorToken(last);
  } else {
    if (last[0] === '#') col = _parseSharpColorToken(last);
  }

  if (col){
    tokens.pop();
    return { color: col, tokens: tokens };
  }
  return { color: null, tokens: tokens };
}

function _stableHash(str){
  var h = 5381; str = String(str||'');
  for (var i=0;i<str.length;i++){ h = ((h<<5)+h) + str.charCodeAt(i); h|=0; }
  return Math.abs(h);
}

// Render small colored dots for secondary events on a multi-event day.
// First event owns the cell background; events 2 and 3 appear as dots below
// the numeral. Each dot's color is set explicitly to override cell text color.
function _eventDotsHtml(events){
  if (!events || events.length <= 1) return '';
  var dots = events.slice(1, 3).map(function(e){
    var col = getEventColor(e);
    return '<span style="color:'+col+';line-height:1;">&#9679;</span>';
  });
  return '<div style="font-size:.45em;line-height:1;margin-top:1px;">'+dots.join('&thinsp;')+'</div>';
}

function _relLum(hex){
  hex = (hex||'').toString().replace(/^#/, '');
  if (hex.length===3) hex = hex.replace(/(.)/g,'$1$1');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return 0;
  var n = parseInt(hex,16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  function lin(c){ c/=255; return c<=0.04045? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
  return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
}

function _contrast(bgHex, textHex){ var L1=_relLum(bgHex), L2=_relLum(textHex); var hi=Math.max(L1,L2), lo=Math.min(L1,L2); return (hi+0.05)/(lo+0.05); }

function textColor(bgHex){
  var k = 't:'+bgHex;
  if (_contrastCache[k]) return _contrastCache[k];
  var v = (_contrast(bgHex, '#000') >= _contrast(bgHex, '#fff')) ? '#000' : '#fff';
  _contrastCache[k] = v;
  _cullCacheIfLarge(_contrastCache);
  return v;
}

function textOutline(tc, bgHex, minTarget){
  var ratio = _contrast(bgHex, tc);
  if (ratio >= (minTarget||CONTRAST_MIN_HEADER)) return '';
  if (tc === '#fff'){
    var off = 1;
    return 'text-shadow:'+(-off)+'px '+(-off)+'px 0 rgba(0,0,0,.95),'+(off)+'px '+(-off)+'px 0 rgba(0,0,0,.95),'+(-off)+'px '+(off)+'px 0 rgba(0,0,0,.95),'+(off)+'px '+(off)+'px 0 rgba(0,0,0,.95);';
  } else {
    var off2 = .5;
    return 'text-shadow:'+(-off2)+'px '+(-off2)+'px 0 rgba(255,255,255,.70),'+(off2)+'px '+(-off2)+'px 0 rgba(255,255,255,.70),'+(-off2)+'px '+(off2)+'px 0 rgba(255,255,255,.70),'+(off2)+'px '+(off2)+'px 0 rgba(255,255,255,.70);';
  }
}

function applyBg(style, bgHex, minTarget){
  var t = textColor(bgHex);
  style += 'background-color:'+bgHex+';';
  style += 'background-clip:padding-box;';
  style += 'color:'+t+';';
  style += textOutline(t, bgHex, (minTarget||CONTRAST_MIN_HEADER));
  return style;
}

var colorsAPI = {
  textColor: textColor,
  applyBg: applyBg,
  styleMonthHeader: function(monthHex){
    var k = 'hdr:'+monthHex;
    if (_headerStyleCache[k]) return _headerStyleCache[k];
    var t = textColor(monthHex);
    var v = 'background-color:'+monthHex+';color:'+t+';'+textOutline(t, monthHex, CONTRAST_MIN_HEADER);
    _headerStyleCache[k] = v;
    _cullCacheIfLarge(_headerStyleCache);
    return v;
  },
  reset: _resetColorCaches
};


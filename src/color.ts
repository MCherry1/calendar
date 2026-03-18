// Section 4: Color Utilities
import { CONTRAST_MIN_HEADER, NAMED_COLORS } from './constants.js';
import { getEventColor } from './events.js';
import { _parseSharpColorToken } from './ui.js';


/* ============================================================================
 * 4) COLOR UTILITIES
 * ==========================================================================*/

export var _contrastCache = Object.create(null);
export var _headerStyleCache = Object.create(null);

export function _cullCacheIfLarge(obj, max?){
  var limit = max || 256;
  if (Object.keys(obj).length > limit){
    for (var k in obj){ if (Object.prototype.hasOwnProperty.call(obj,k)) delete obj[k]; }
  }
}

export function _resetColorCaches(){
  _contrastCache    = Object.create(null);
  _headerStyleCache = Object.create(null);
}

export function sanitizeHexColor(s){
  if(!s) return null;
  var hex = String(s).trim().replace(/^#/, '');
  if(/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/(.)/g,'$1$1');
  if(/^[0-9a-f]{6}$/i.test(hex)) return '#'+hex.toUpperCase();
  return null;
}

export function resolveColor(s){
  if (!s) return null;
  var hex = sanitizeHexColor(s);
  if (hex) return hex;
  var key = String(s).trim().toLowerCase();
  return NAMED_COLORS[key] || null;
}

export function popColorIfPresent(tokens, allowBareName){
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

export function _stableHash(str){
  var h = 5381; str = String(str||'');
  for (var i=0;i<str.length;i++){ h = ((h<<5)+h) + str.charCodeAt(i); h|=0; }
  return Math.abs(h);
}

// Render small colored dots for events on a calendar day.
// In normal mode: first event owns the cell background; events 2-3 as dots.
// In dot-only mode (moon multi-system): all events rendered as dots, no bg fill.
export function _eventDotsHtml(events, dotOnly?){
  if (!events || !events.length) return '';
  var startIdx = dotOnly ? 0 : 1;
  var slice = events.slice(startIdx, startIdx + 3);
  if (!slice.length) return '';
  var dots = slice.map(function(e){
    var col = getEventColor(e);
    return '<span style="color:'+col+';line-height:1;">&#9679;</span>';
  });
  return '<div style="font-size:.45em;line-height:1;margin-top:1px;">'+dots.join('&thinsp;')+'</div>';
}

export function _relLum(hex){
  hex = (hex||'').toString().replace(/^#/, '');
  if (hex.length===3) hex = hex.replace(/(.)/g,'$1$1');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return 0;
  var n = parseInt(hex,16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  function lin(c){ c/=255; return c<=0.04045? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
  return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
}

export function _contrast(bgHex, textHex){ var L1=_relLum(bgHex), L2=_relLum(textHex); var hi=Math.max(L1,L2), lo=Math.min(L1,L2); return (hi+0.05)/(lo+0.05); }

export function textColor(bgHex){
  var k = 't:'+bgHex;
  if (_contrastCache[k]) return _contrastCache[k];
  var v = (_contrast(bgHex, '#000') >= _contrast(bgHex, '#fff')) ? '#000' : '#fff';
  _contrastCache[k] = v;
  _cullCacheIfLarge(_contrastCache);
  return v;
}

export function textOutline(tc, bgHex, minTarget){
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

export function applyBg(style, bgHex, minTarget){
  var t = textColor(bgHex);
  style += 'background-color:'+bgHex+';';
  style += 'background-clip:padding-box;';
  style += 'color:'+t+';';
  style += textOutline(t, bgHex, (minTarget||CONTRAST_MIN_HEADER));
  return style;
}

export var colorsAPI = {
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




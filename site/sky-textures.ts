// Procedural texture generation for the sky canvas renderer.
// All textures are drawn once onto offscreen canvases and cached.

var TEX_SIZE = 128;

// ── FNV-1a hash (duplicated from main.ts to avoid circular imports) ──
function _h(input: string | number){
  var text = String(input);
  var hash = 2166136261;
  for (var i = 0; i < text.length; i++){
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

// ── helpers ──
function _offscreen(w: number, h: number): { cv: HTMLCanvasElement; cx: CanvasRenderingContext2D } {
  var cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  var cx = cv.getContext('2d')!;
  return { cv, cx };
}

function _hexToRgb(hex: string): [number, number, number] {
  var v = parseInt(hex.replace('#', ''), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function _noisePass(cx: CanvasRenderingContext2D, w: number, h: number, seed: string, amplitude: number){
  var id = cx.getImageData(0, 0, w, h);
  var d = id.data;
  for (var i = 0; i < d.length; i += 4){
    var px = i / 4;
    var n = (_h(seed + ':' + px) - 0.5) * 2 * amplitude;
    d[i]     = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  cx.putImageData(id, 0, 0);
}

function _limbDarkening(cx: CanvasRenderingContext2D, w: number, h: number){
  var r = w / 2;
  var grad = cx.createRadialGradient(r, r, r * 0.3, r, r, r);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.7, 'rgba(0,0,0,0.08)');
  grad.addColorStop(1, 'rgba(0,0,0,0.45)');
  cx.fillStyle = grad;
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.fill();
}

function _baseGradient(cx: CanvasRenderingContext2D, w: number, h: number, centerColor: string, edgeColor: string){
  var r = w / 2;
  var grad = cx.createRadialGradient(r * 0.9, r * 0.85, r * 0.05, r, r, r);
  grad.addColorStop(0, centerColor);
  grad.addColorStop(1, edgeColor);
  cx.fillStyle = grad;
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.fill();
}

function _crater(cx: CanvasRenderingContext2D, x: number, y: number, radius: number){
  cx.beginPath();
  cx.arc(x, y, radius, 0, Math.PI * 2);
  cx.fillStyle = 'rgba(0,0,0,0.18)';
  cx.fill();
  cx.beginPath();
  cx.arc(x - radius * 0.2, y - radius * 0.2, radius * 0.85, 0, Math.PI * 2);
  cx.fillStyle = 'rgba(255,255,255,0.08)';
  cx.fill();
}

// ── per-moon generators ──

function _genZarantyr(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#fcfcff', '#d8dce8');
  // color shift bands
  cx.globalCompositeOperation = 'overlay';
  var bands = [
    { color: 'rgba(180,200,255,0.12)', yOff: -0.15 },
    { color: 'rgba(255,200,210,0.09)', yOff: 0.1 },
    { color: 'rgba(200,255,210,0.08)', yOff: 0.3 }
  ];
  for (var b of bands){
    cx.beginPath();
    cx.arc(r, r + r * b.yOff, r * 0.7, 0, Math.PI * 2);
    cx.fillStyle = b.color;
    cx.fill();
  }
  cx.globalCompositeOperation = 'source-over';
  _noisePass(cx, s, s, 'zarantyr', 8);
  _limbDarkening(cx, s, s);
  return cv;
}

function _genOlarune(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#ffe0b0', '#cc8844');
  // hazy atmosphere layers
  cx.beginPath();
  cx.arc(r, r, r * 0.85, 0, Math.PI * 2);
  cx.fillStyle = 'rgba(255,190,120,0.12)';
  cx.fill();
  // shield rim fringe
  cx.beginPath();
  cx.arc(r, r, r * 0.96, 0, Math.PI * 2);
  cx.lineWidth = 3;
  cx.strokeStyle = 'rgba(255,220,160,0.5)';
  cx.shadowColor = 'rgba(255,200,130,0.6)';
  cx.shadowBlur = 4;
  cx.stroke();
  cx.shadowBlur = 0;
  _noisePass(cx, s, s, 'olarune', 6);
  _limbDarkening(cx, s, s);
  return cv;
}

function _genTherendor(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#f0f0f0', '#b8b8b8');
  // faint ice cracks
  cx.strokeStyle = 'rgba(180,200,220,0.12)';
  cx.lineWidth = 0.7;
  var cracks = [
    [[0.3, 0.2], [0.5, 0.55], [0.7, 0.4]],
    [[0.2, 0.6], [0.45, 0.7], [0.6, 0.65]]
  ];
  for (var crack of cracks){
    cx.beginPath();
    cx.moveTo(crack[0][0] * s, crack[0][1] * s);
    for (var k = 1; k < crack.length; k++) cx.lineTo(crack[k][0] * s, crack[k][1] * s);
    cx.stroke();
  }
  _noisePass(cx, s, s, 'therendor', 4);
  _limbDarkening(cx, s, s);
  return cv;
}

function _genEyre(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#dcdcdc', '#a0a0a0');
  // scattered craters
  for (var i = 0; i < 12; i++){
    var cx2 = r + ((_h('eyre:c:' + i) - 0.5) * s * 0.7);
    var cy2 = r + ((_h('eyre:cy:' + i) - 0.5) * s * 0.7);
    var cr = 1.5 + _h('eyre:cr:' + i) * 4;
    _crater(cx, cx2, cy2, cr);
  }
  // anvil marking (dark, center)
  cx.fillStyle = 'rgba(40,40,50,0.28)';
  // anvil base (trapezoid)
  var aw = s * 0.22, ah = s * 0.12;
  var acx = r, acy = r + s * 0.04;
  cx.beginPath();
  cx.moveTo(acx - aw / 2, acy + ah / 2);
  cx.lineTo(acx + aw / 2, acy + ah / 2);
  cx.lineTo(acx + aw * 0.35, acy - ah / 2);
  cx.lineTo(acx - aw * 0.35, acy - ah / 2);
  cx.closePath();
  cx.fill();
  // anvil top (small rectangle)
  cx.fillRect(acx - aw * 0.18, acy - ah / 2 - s * 0.08, aw * 0.36, s * 0.08);
  _noisePass(cx, s, s, 'eyre', 6);
  _limbDarkening(cx, s, s);
  return cv;
}

function _genDravago(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#f0eeff', '#c8c0e8');
  // nitrogen ice patches
  for (var i = 0; i < 6; i++){
    cx.beginPath();
    cx.arc(
      r + (_h('drav:px:' + i) - 0.5) * s * 0.6,
      r + (_h('drav:py:' + i) - 0.5) * s * 0.6,
      s * 0.12 + _h('drav:ps:' + i) * s * 0.08,
      0, Math.PI * 2
    );
    cx.fillStyle = 'rgba(210,200,240,0.08)';
    cx.fill();
  }
  _noisePass(cx, s, s, 'dravago', 5);
  _limbDarkening(cx, s, s);
  return cv;
}

function _genNymm(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#fff5d0', '#c8a030');
  // radial sovereign lines
  cx.strokeStyle = 'rgba(255,240,180,0.06)';
  cx.lineWidth = 0.8;
  for (var i = 0; i < 8; i++){
    var angle = (i / 8) * Math.PI * 2;
    cx.beginPath();
    cx.moveTo(r + Math.cos(angle) * r * 0.15, r + Math.sin(angle) * r * 0.15);
    cx.lineTo(r + Math.cos(angle) * r * 0.85, r + Math.sin(angle) * r * 0.85);
    cx.stroke();
  }
  _noisePass(cx, s, s, 'nymm', 4);
  _limbDarkening(cx, s, s);
  return cv;
}

function _genLharvion(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#eeeeee', '#a0a0a0');
  // pocked sponge-like craters
  for (var i = 0; i < 18; i++){
    var px = r + (_h('lhar:cx:' + i) - 0.5) * s * 0.75;
    var py = r + (_h('lhar:cy:' + i) - 0.5) * s * 0.75;
    var pr = 1 + _h('lhar:cr:' + i) * 3;
    _crater(cx, px, py, pr);
  }
  // THE EYE — black chasm (vertical slit)
  cx.fillStyle = '#0a0a0a';
  cx.beginPath();
  cx.ellipse(r, r, s * 0.07, s * 0.3, 0, 0, Math.PI * 2);
  cx.fill();
  // dark border around chasm
  cx.strokeStyle = 'rgba(40,40,40,0.4)';
  cx.lineWidth = 1.5;
  cx.beginPath();
  cx.ellipse(r, r, s * 0.09, s * 0.33, 0, 0, Math.PI * 2);
  cx.stroke();
  _noisePass(cx, s, s, 'lharvion', 7);
  _limbDarkening(cx, s, s);
  return cv;
}

function _genBarrakas(s: number){
  var { cv, cx } = _offscreen(s, s);
  _baseGradient(cx, s, s, '#ffffff', '#dce8f4');
  _noisePass(cx, s, s, 'barrakas', 3);
  _limbDarkening(cx, s, s);
  return cv;
}

function _genRhaan(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#c4d8ff', '#7090c0');
  // scribbled "writing" lines
  cx.strokeStyle = 'rgba(60,80,120,0.14)';
  cx.lineWidth = 0.6;
  for (var i = 0; i < 18; i++){
    var ly = s * 0.12 + (i / 18) * s * 0.76;
    cx.beginPath();
    cx.moveTo(s * 0.2, ly);
    for (var t = 0.25; t <= 0.8; t += 0.05){
      cx.lineTo(s * t, ly + (_h('rhaan:w:' + i + ':' + t) - 0.5) * 2.5);
    }
    cx.stroke();
  }
  // vertical margin lines
  cx.strokeStyle = 'rgba(60,80,120,0.1)';
  cx.lineWidth = 0.5;
  cx.beginPath();
  cx.moveTo(s * 0.2, s * 0.1);
  cx.lineTo(s * 0.2, s * 0.9);
  cx.stroke();
  cx.beginPath();
  cx.moveTo(s * 0.8, s * 0.1);
  cx.lineTo(s * 0.8, s * 0.9);
  cx.stroke();
  _noisePass(cx, s, s, 'rhaan', 5);
  _limbDarkening(cx, s, s);
  return cv;
}

function _genSypheros(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#808080', '#3a3a3a');
  // jagged central crack
  cx.strokeStyle = '#1a1a1a';
  cx.lineWidth = 2;
  cx.beginPath();
  cx.moveTo(r + (_h('syph:t') - 0.5) * s * 0.08, s * 0.1);
  for (var i = 1; i <= 7; i++){
    var frac = 0.1 + (i / 7) * 0.8;
    cx.lineTo(r + (_h('syph:c:' + i) - 0.5) * s * 0.15, s * frac);
  }
  cx.stroke();
  // lighter parallel line for depth
  cx.strokeStyle = 'rgba(140,140,140,0.3)';
  cx.lineWidth = 1;
  cx.beginPath();
  cx.moveTo(r + (_h('syph:t') - 0.5) * s * 0.08 + 1.5, s * 0.1);
  for (var i = 1; i <= 7; i++){
    var frac = 0.1 + (i / 7) * 0.8;
    cx.lineTo(r + (_h('syph:c:' + i) - 0.5) * s * 0.15 + 1.5, s * frac);
  }
  cx.stroke();
  _noisePass(cx, s, s, 'sypheros', 10);
  _limbDarkening(cx, s, s);
  return cv;
}

function _genAryth(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  // clip to disk
  cx.save();
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.clip();
  // trailing bright half (right)
  cx.fillStyle = '#FF4500';
  cx.fillRect(0, 0, s, s);
  // leading coal-black half (left)
  var grad = cx.createLinearGradient(r - s * 0.04, 0, r + s * 0.04, 0);
  grad.addColorStop(0, '#1a0a0a');
  grad.addColorStop(1, 'rgba(26,10,10,0)');
  cx.fillStyle = '#1a0a0a';
  cx.fillRect(0, 0, r, s);
  // blend at boundary
  cx.fillStyle = grad;
  cx.fillRect(r - s * 0.04, 0, s * 0.08, s);
  cx.restore();
  _noisePass(cx, s, s, 'aryth', 7);
  _limbDarkening(cx, s, s);
  return cv;
}

function _genVult(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#b8b0a8', '#706860');
  // heavy cratering
  for (var i = 0; i < 28; i++){
    var px = r + (_h('vult:cx:' + i) - 0.5) * s * 0.8;
    var py = r + (_h('vult:cy:' + i) - 0.5) * s * 0.8;
    var pr = 1 + _h('vult:cr:' + i) * (i < 5 ? 6 : 3.5);
    _crater(cx, px, py, pr);
    // dark deposits in crater floors
    if (i < 8){
      cx.beginPath();
      cx.arc(px, py, pr * 0.6, 0, Math.PI * 2);
      cx.fillStyle = 'rgba(50,40,35,0.12)';
      cx.fill();
    }
  }
  _noisePass(cx, s, s, 'vult', 8);
  _limbDarkening(cx, s, s);
  return cv;
}

// generic fallback for non-Eberron moons
function _genGeneric(s: number, color: string){
  var { cv, cx } = _offscreen(s, s);
  var [r, g, b] = _hexToRgb(color);
  var center = 'rgb(' + Math.min(255, r + 30) + ',' + Math.min(255, g + 30) + ',' + Math.min(255, b + 30) + ')';
  var edge = 'rgb(' + Math.max(0, r - 40) + ',' + Math.max(0, g - 40) + ',' + Math.max(0, b - 40) + ')';
  _baseGradient(cx, s, s, center, edge);
  _noisePass(cx, s, s, color, 6);
  _limbDarkening(cx, s, s);
  return cv;
}

// ── generator dispatch ──

var GENERATORS: Record<string, (s: number) => HTMLCanvasElement> = {
  Zarantyr: _genZarantyr,
  Olarune: _genOlarune,
  Therendor: _genTherendor,
  Eyre: _genEyre,
  Dravago: _genDravago,
  Nymm: _genNymm,
  Lharvion: _genLharvion,
  Barrakas: _genBarrakas,
  Rhaan: _genRhaan,
  Sypheros: _genSypheros,
  Aryth: _genAryth,
  Vult: _genVult
};

// ── texture cache ──

var _cache = new Map<string, HTMLCanvasElement>();

export function getMoonTexture(moonName: string, baseColor: string, radius: number): HTMLCanvasElement {
  // quantize radius to avoid cache churn from sub-pixel changes
  var texSize = Math.max(TEX_SIZE, Math.ceil(radius * 2 * (typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1)));
  // snap to 16px increments for cache stability
  texSize = Math.ceil(texSize / 16) * 16;
  var key = moonName + ':' + texSize;
  var cached = _cache.get(key);
  if (cached) return cached;
  var gen = GENERATORS[moonName];
  var tex = gen ? gen(texSize) : _genGeneric(texSize, baseColor);
  _cache.set(key, tex);
  return tex;
}

export function clearTextureCache(){
  _cache.clear();
}

// ── star field ──

export type StarData = {
  az: number;   // azimuth in degrees (0–360)
  alt: number;  // altitude in degrees (0–PANO_ALT_MAX)
  size: number;
  r: number;
  g: number;
  b: number;
  baseAlpha: number;
  twinkleFreq: number;
  twinklePhase: number;
  tier: number; // 0=bright, 1=medium, 2=dim
};

export function generateStarField(width: number, height: number, worldId: string, topMargin: number, bottomMargin: number): StarData[] {
  var altMax = 75; // matches PANO_ALT_MAX
  var stars: StarData[] = [];
  var total = 1400; // more stars for full 360° sky
  var brightCount = 35;
  var medCount = 140;
  var colors: [number, number, number][] = [
    [255, 247, 225], // warm white
    [200, 220, 255], // cool blue
    [255, 230, 200], // warm orange
    [180, 200, 255], // blue
    [255, 255, 240], // neutral
  ];
  for (var i = 0; i < total; i++){
    var tier = i < brightCount ? 0 : i < brightCount + medCount ? 1 : 2;
    var seed = _h(i + ':star:' + worldId);
    var az = _h('sx:' + i + ':' + worldId) * 360;
    var alt = _h('sy:' + i + ':' + worldId) * altMax;
    var ci = Math.floor(_h('sc:' + i + ':' + worldId) * colors.length);
    var col = colors[ci];
    var size = tier === 0 ? 1.5 + seed * 1.5 : tier === 1 ? 0.8 + seed * 0.7 : 0.3 + seed * 0.5;
    var baseAlpha = tier === 0 ? 0.7 + seed * 0.3 : tier === 1 ? 0.3 + seed * 0.35 : 0.08 + seed * 0.18;
    var twinkleFreq = tier === 0 ? 2 + seed * 2 : tier === 1 ? 4 + seed * 5 : 6 + seed * 8;
    var twinklePhase = _h('sp:' + i + ':' + worldId) * Math.PI * 2;
    stars.push({ az, alt, size, r: col[0], g: col[1], b: col[2], baseAlpha, twinkleFreq, twinklePhase, tier });
  }
  return stars;
}

// ── milky-way band ──

export type MilkyWayParticle = {
  az: number;   // azimuth 0–360
  alt: number;  // altitude in degrees
  size: number;
  alpha: number;
};

export function generateMilkyWay(width: number, height: number, worldId: string, topMargin: number, bottomMargin: number): MilkyWayParticle[] {
  var altMax = 75;
  var bandCenterAlt = altMax * 0.65;
  var bandHalfAlt = altMax * 0.18;
  var particles: MilkyWayParticle[] = [];
  for (var i = 0; i < 3000; i++){
    var az = _h('mw:x:' + i + ':' + worldId) * 360;
    var altOff = (_h('mw:y1:' + i) + _h('mw:y2:' + i) + _h('mw:y3:' + i) - 1.5) / 1.5 * bandHalfAlt;
    var alt = bandCenterAlt + altOff;
    if (alt < 0 || alt > altMax) continue;
    var sz = 0.3 + _h('mw:s:' + i) * 0.7;
    var alpha = 0.04 + _h('mw:a:' + i) * 0.08;
    particles.push({ az, alt, size: sz, alpha });
  }
  return particles;
}

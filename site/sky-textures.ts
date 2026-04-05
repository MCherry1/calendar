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
  // scattered craters across surface
  for (var i = 0; i < 20; i++){
    var cx2 = r + ((_h('eyre:c:' + i) - 0.5) * s * 0.8);
    var cy2 = r + ((_h('eyre:cy:' + i) - 0.5) * s * 0.8);
    var cr = 1.5 + _h('eyre:cr:' + i) * 4.5;
    _crater(cx, cx2, cy2, cr);
  }
  // anvil marking: organic dark region using overlapping ellipses instead of hard geometry
  cx.save();
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.clip();
  // broad base region
  cx.fillStyle = 'rgba(40,40,55,0.14)';
  cx.beginPath();
  cx.ellipse(r, r + s * 0.03, s * 0.11, s * 0.07, 0, 0, Math.PI * 2);
  cx.fill();
  // narrower top region
  cx.fillStyle = 'rgba(40,40,55,0.12)';
  cx.beginPath();
  cx.ellipse(r, r - s * 0.06, s * 0.06, s * 0.08, 0, 0, Math.PI * 2);
  cx.fill();
  // connecting blended middle
  cx.fillStyle = 'rgba(40,40,55,0.10)';
  cx.beginPath();
  cx.ellipse(r - s * 0.01, r - s * 0.01, s * 0.08, s * 0.10, 0.15, 0, Math.PI * 2);
  cx.fill();
  // subtle dark deposits in the central anvil region
  for (var j = 0; j < 5; j++){
    cx.fillStyle = 'rgba(30,30,45,' + (0.04 + _h('eyre:dep:' + j) * 0.06) + ')';
    cx.beginPath();
    cx.ellipse(
      r + (_h('eyre:dx:' + j) - 0.5) * s * 0.12,
      r + (_h('eyre:dy:' + j) - 0.5) * s * 0.12,
      s * 0.03 + _h('eyre:ds:' + j) * s * 0.04,
      s * 0.02 + _h('eyre:ds2:' + j) * s * 0.03,
      _h('eyre:da:' + j) * Math.PI, 0, Math.PI * 2
    );
    cx.fill();
  }
  cx.restore();
  _noisePass(cx, s, s, 'eyre', 7);
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
  var r = s / 2;
  _baseGradient(cx, s, s, '#ffffff', '#dce8f4');
  // luminous bright patches (The Lantern glows from within)
  cx.save();
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.clip();
  for (var i = 0; i < 8; i++){
    var px = r + (_h('barr:px:' + i) - 0.5) * s * 0.6;
    var py = r + (_h('barr:py:' + i) - 0.5) * s * 0.6;
    var pr = s * 0.06 + _h('barr:ps:' + i) * s * 0.1;
    var grad = cx.createRadialGradient(px, py, 0, px, py, pr);
    grad.addColorStop(0, 'rgba(255,255,240,0.15)');
    grad.addColorStop(0.5, 'rgba(255,250,230,0.06)');
    grad.addColorStop(1, 'rgba(255,250,230,0)');
    cx.fillStyle = grad;
    cx.beginPath();
    cx.arc(px, py, pr, 0, Math.PI * 2);
    cx.fill();
  }
  // faint radial light rays from center
  cx.globalCompositeOperation = 'overlay';
  for (var j = 0; j < 6; j++){
    var angle = (j / 6) * Math.PI * 2 + 0.3;
    cx.beginPath();
    cx.moveTo(r, r);
    cx.lineTo(r + Math.cos(angle) * r * 0.85, r + Math.sin(angle) * r * 0.85);
    cx.lineWidth = 2 + _h('barr:rw:' + j) * 3;
    cx.strokeStyle = 'rgba(255,255,240,0.04)';
    cx.stroke();
  }
  cx.globalCompositeOperation = 'source-over';
  // subtle warm tint variations
  for (var k = 0; k < 5; k++){
    cx.beginPath();
    cx.ellipse(
      r + (_h('barr:tx:' + k) - 0.5) * s * 0.5,
      r + (_h('barr:ty:' + k) - 0.5) * s * 0.5,
      s * 0.08 + _h('barr:ts:' + k) * s * 0.06,
      s * 0.06 + _h('barr:ts2:' + k) * s * 0.04,
      _h('barr:ta:' + k) * Math.PI, 0, Math.PI * 2
    );
    cx.fillStyle = 'rgba(255,248,220,0.05)';
    cx.fill();
  }
  cx.restore();
  _noisePass(cx, s, s, 'barrakas', 4);
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
  // trailing bright half (right) - warm orange base
  cx.fillStyle = '#FF4500';
  cx.fillRect(0, 0, s, s);
  // leading coal-black half (left) with wide, organic gradient blend
  var grad = cx.createLinearGradient(r - s * 0.15, 0, r + s * 0.15, 0);
  grad.addColorStop(0, '#1a0a0a');
  grad.addColorStop(0.35, '#1a0a0a');
  grad.addColorStop(0.65, 'rgba(26,10,10,0.3)');
  grad.addColorStop(1, 'rgba(26,10,10,0)');
  cx.fillStyle = grad;
  cx.fillRect(0, 0, s, s);
  // irregular boundary using overlapping dark patches for organic feel
  for (var i = 0; i < 10; i++){
    var py = s * 0.05 + (_h('aryth:by:' + i)) * s * 0.9;
    var px = r + (_h('aryth:bx:' + i) - 0.5) * s * 0.2;
    var pr = s * 0.04 + _h('aryth:bs:' + i) * s * 0.06;
    cx.beginPath();
    cx.ellipse(px, py, pr, pr * 0.7, _h('aryth:ba:' + i) * Math.PI, 0, Math.PI * 2);
    cx.fillStyle = 'rgba(26,10,10,' + (0.15 + _h('aryth:bo:' + i) * 0.2) + ')';
    cx.fill();
  }
  // surface detail on the bright half: faint craters and variations
  for (var j = 0; j < 10; j++){
    var cx2 = r + s * 0.1 + _h('aryth:cx:' + j) * s * 0.35;
    var cy2 = r + (_h('aryth:cy:' + j) - 0.5) * s * 0.7;
    var cr = 1.5 + _h('aryth:cr:' + j) * 3;
    cx.beginPath();
    cx.arc(cx2, cy2, cr, 0, Math.PI * 2);
    cx.fillStyle = 'rgba(200,60,0,0.12)';
    cx.fill();
  }
  // surface detail on the dark half: very faint texture
  for (var k = 0; k < 8; k++){
    var dx = _h('aryth:dx:' + k) * r * 0.8;
    var dy = r + (_h('aryth:dy:' + k) - 0.5) * s * 0.7;
    var dr = 1 + _h('aryth:dr:' + k) * 2.5;
    cx.beginPath();
    cx.arc(dx, dy, dr, 0, Math.PI * 2);
    cx.fillStyle = 'rgba(40,20,15,0.15)';
    cx.fill();
  }
  cx.restore();
  _noisePass(cx, s, s, 'aryth', 8);
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

// ── Forgotten Realms ──

function _genSelune(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#d8e4f8', '#95a8c8');
  // Maria-like dark regions
  for (var i = 0; i < 6; i++){
    cx.beginPath();
    cx.ellipse(
      r + (_h('sel:mx:' + i) - 0.5) * s * 0.5,
      r + (_h('sel:my:' + i) - 0.5) * s * 0.5,
      s * 0.08 + _h('sel:ms:' + i) * s * 0.1,
      s * 0.06 + _h('sel:ms2:' + i) * s * 0.08,
      _h('sel:ma:' + i) * Math.PI, 0, Math.PI * 2
    );
    cx.fillStyle = 'rgba(120,140,170,0.12)';
    cx.fill();
  }
  // craters
  for (var j = 0; j < 16; j++){
    _crater(cx, r + (_h('sel:cx:' + j) - 0.5) * s * 0.75, r + (_h('sel:cy:' + j) - 0.5) * s * 0.75, 1.5 + _h('sel:cr:' + j) * 4);
  }
  // Tears of Selune - trailing debris streaks on the right side
  cx.save();
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.clip();
  for (var k = 0; k < 4; k++){
    var ty = r * 0.5 + _h('sel:ty:' + k) * r;
    cx.beginPath();
    cx.moveTo(r + s * 0.2, ty);
    cx.lineTo(r + s * 0.45, ty + (_h('sel:td:' + k) - 0.5) * s * 0.05);
    cx.lineWidth = 0.5 + _h('sel:tw:' + k) * 1;
    cx.strokeStyle = 'rgba(200,215,240,0.08)';
    cx.stroke();
  }
  cx.restore();
  _noisePass(cx, s, s, 'selune', 6);
  _limbDarkening(cx, s, s);
  return cv;
}

// ── Greyhawk ──

function _genCelene(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#c8e8f0', '#88b0c0');
  // smooth surface with faint swirl markings
  cx.save();
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.clip();
  for (var i = 0; i < 4; i++){
    cx.beginPath();
    cx.ellipse(
      r + (_h('cel:sx:' + i) - 0.5) * s * 0.4,
      r + (_h('cel:sy:' + i) - 0.5) * s * 0.4,
      s * 0.12 + _h('cel:ss:' + i) * s * 0.1,
      s * 0.08 + _h('cel:ss2:' + i) * s * 0.06,
      _h('cel:sa:' + i) * Math.PI * 2, 0, Math.PI * 2
    );
    cx.fillStyle = 'rgba(140,190,200,0.06)';
    cx.fill();
  }
  cx.restore();
  // very few, subtle craters
  for (var j = 0; j < 6; j++){
    _crater(cx, r + (_h('cel:cx:' + j) - 0.5) * s * 0.6, r + (_h('cel:cy:' + j) - 0.5) * s * 0.6, 1 + _h('cel:cr:' + j) * 2.5);
  }
  _noisePass(cx, s, s, 'celene', 4);
  _limbDarkening(cx, s, s);
  return cv;
}

// ── Dragonlance ──

function _genSolinari(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#f0f0f0', '#b8b8c8');
  // craters with slight silvery shimmer
  for (var i = 0; i < 18; i++){
    _crater(cx, r + (_h('soli:cx:' + i) - 0.5) * s * 0.75, r + (_h('soli:cy:' + i) - 0.5) * s * 0.75, 1.5 + _h('soli:cr:' + i) * 4);
  }
  // magical shimmer: faint bright spots
  cx.save();
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.clip();
  for (var j = 0; j < 5; j++){
    var gx = r + (_h('soli:gx:' + j) - 0.5) * s * 0.5;
    var gy = r + (_h('soli:gy:' + j) - 0.5) * s * 0.5;
    var gr = s * 0.04 + _h('soli:gs:' + j) * s * 0.06;
    var shimmer = cx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    shimmer.addColorStop(0, 'rgba(220,220,255,0.12)');
    shimmer.addColorStop(1, 'rgba(220,220,255,0)');
    cx.fillStyle = shimmer;
    cx.beginPath();
    cx.arc(gx, gy, gr, 0, Math.PI * 2);
    cx.fill();
  }
  cx.restore();
  _noisePass(cx, s, s, 'solinari', 5);
  _limbDarkening(cx, s, s);
  return cv;
}

function _genLunitari(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#cd6060', '#8a3030');
  // volcanic surface: magma cracks
  cx.save();
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.clip();
  cx.strokeStyle = 'rgba(255,100,40,0.15)';
  cx.lineWidth = 1;
  for (var i = 0; i < 8; i++){
    cx.beginPath();
    var sx = s * 0.15 + _h('luni:sx:' + i) * s * 0.7;
    var sy = s * 0.15 + _h('luni:sy:' + i) * s * 0.7;
    cx.moveTo(sx, sy);
    for (var seg = 0; seg < 5; seg++){
      sx += (_h('luni:dx:' + i + ':' + seg) - 0.5) * s * 0.12;
      sy += (_h('luni:dy:' + i + ':' + seg) - 0.5) * s * 0.12;
      cx.lineTo(sx, sy);
    }
    cx.stroke();
  }
  // dark volcanic patches
  for (var j = 0; j < 8; j++){
    cx.beginPath();
    cx.ellipse(
      r + (_h('luni:px:' + j) - 0.5) * s * 0.6,
      r + (_h('luni:py:' + j) - 0.5) * s * 0.6,
      s * 0.04 + _h('luni:ps:' + j) * s * 0.06,
      s * 0.03 + _h('luni:ps2:' + j) * s * 0.04,
      0, 0, Math.PI * 2
    );
    cx.fillStyle = 'rgba(80,20,15,0.12)';
    cx.fill();
  }
  cx.restore();
  // craters
  for (var k = 0; k < 12; k++){
    _crater(cx, r + (_h('luni:cx:' + k) - 0.5) * s * 0.7, r + (_h('luni:cy:' + k) - 0.5) * s * 0.7, 1 + _h('luni:cr:' + k) * 3);
  }
  _noisePass(cx, s, s, 'lunitari', 8);
  _limbDarkening(cx, s, s);
  return cv;
}

function _genNuitari(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  // Near-invisible dark moon - very dark with barely visible features
  _baseGradient(cx, s, s, '#1e1e30', '#0a0a18');
  // Barely perceptible surface variations
  for (var i = 0; i < 8; i++){
    cx.beginPath();
    cx.ellipse(
      r + (_h('nui:px:' + i) - 0.5) * s * 0.6,
      r + (_h('nui:py:' + i) - 0.5) * s * 0.6,
      s * 0.05 + _h('nui:ps:' + i) * s * 0.08,
      s * 0.04 + _h('nui:ps2:' + i) * s * 0.06,
      0, 0, Math.PI * 2
    );
    cx.fillStyle = 'rgba(20,15,40,0.08)';
    cx.fill();
  }
  _noisePass(cx, s, s, 'nuitari', 3);
  _limbDarkening(cx, s, s);
  return cv;
}

// ── Exandria ──

function _genCatha(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#f5ece0', '#c0b098');
  // warm ivory surface with craters
  for (var i = 0; i < 20; i++){
    _crater(cx, r + (_h('cath:cx:' + i) - 0.5) * s * 0.8, r + (_h('cath:cy:' + i) - 0.5) * s * 0.8, 1 + _h('cath:cr:' + i) * 4);
  }
  // subtle warm highlands
  cx.save();
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.clip();
  for (var j = 0; j < 4; j++){
    cx.beginPath();
    cx.ellipse(
      r + (_h('cath:hx:' + j) - 0.5) * s * 0.5,
      r + (_h('cath:hy:' + j) - 0.5) * s * 0.5,
      s * 0.1 + _h('cath:hs:' + j) * s * 0.08,
      s * 0.08 + _h('cath:hs2:' + j) * s * 0.06,
      0, 0, Math.PI * 2
    );
    cx.fillStyle = 'rgba(220,200,170,0.08)';
    cx.fill();
  }
  cx.restore();
  _noisePass(cx, s, s, 'catha', 6);
  _limbDarkening(cx, s, s);
  return cv;
}

function _genRuidus(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#a02020', '#500808');
  // "Bloody Eye" - veined, unsettling appearance
  cx.save();
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.clip();
  // dark vein-like lines radiating from center
  cx.strokeStyle = 'rgba(60,0,0,0.2)';
  cx.lineWidth = 1.2;
  for (var i = 0; i < 10; i++){
    cx.beginPath();
    var angle = _h('rui:va:' + i) * Math.PI * 2;
    cx.moveTo(r + Math.cos(angle) * r * 0.1, r + Math.sin(angle) * r * 0.1);
    var ex = r + Math.cos(angle) * r * 0.85;
    var ey = r + Math.sin(angle) * r * 0.85;
    var midX = (r + ex) / 2 + (_h('rui:vx:' + i) - 0.5) * s * 0.15;
    var midY = (r + ey) / 2 + (_h('rui:vy:' + i) - 0.5) * s * 0.15;
    cx.quadraticCurveTo(midX, midY, ex, ey);
    cx.stroke();
  }
  // central dark pupil-like area
  var pupilGrad = cx.createRadialGradient(r, r, 0, r, r, r * 0.25);
  pupilGrad.addColorStop(0, 'rgba(40,0,0,0.3)');
  pupilGrad.addColorStop(1, 'rgba(40,0,0,0)');
  cx.fillStyle = pupilGrad;
  cx.beginPath();
  cx.arc(r, r, r * 0.25, 0, Math.PI * 2);
  cx.fill();
  cx.restore();
  _noisePass(cx, s, s, 'ruidus', 10);
  _limbDarkening(cx, s, s);
  return cv;
}

// ── Mystara ──

function _genMatera(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#f5f0dc', '#c0b898');
  // Classic Earth-moon-like with maria and highlands
  var maria = [
    { x: 0.40, y: 0.38, rx: 0.12, ry: 0.09 },
    { x: 0.55, y: 0.45, rx: 0.08, ry: 0.10 },
    { x: 0.35, y: 0.58, rx: 0.10, ry: 0.07 }
  ];
  for (var m of maria){
    cx.beginPath();
    cx.ellipse(s * m.x, s * m.y, s * m.rx, s * m.ry, 0.2, 0, Math.PI * 2);
    cx.fillStyle = 'rgba(140,130,105,0.14)';
    cx.fill();
  }
  for (var i = 0; i < 20; i++){
    _crater(cx, r + (_h('mat:cx:' + i) - 0.5) * s * 0.8, r + (_h('mat:cy:' + i) - 0.5) * s * 0.8, 1 + _h('mat:cr:' + i) * 4);
  }
  _noisePass(cx, s, s, 'matera', 6);
  _limbDarkening(cx, s, s);
  return cv;
}

function _genPatera(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  // Invisible moon - dark ethereal purple-gray
  _baseGradient(cx, s, s, '#5a5a78', '#2a2a40');
  // ethereal wisps
  cx.save();
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.clip();
  cx.globalCompositeOperation = 'screen';
  for (var i = 0; i < 6; i++){
    cx.beginPath();
    cx.ellipse(
      r + (_h('pat:wx:' + i) - 0.5) * s * 0.5,
      r + (_h('pat:wy:' + i) - 0.5) * s * 0.5,
      s * 0.1 + _h('pat:ws:' + i) * s * 0.08,
      s * 0.06 + _h('pat:ws2:' + i) * s * 0.05,
      _h('pat:wa:' + i) * Math.PI * 2, 0, Math.PI * 2
    );
    cx.fillStyle = 'rgba(100,90,140,0.06)';
    cx.fill();
  }
  cx.globalCompositeOperation = 'source-over';
  cx.restore();
  _noisePass(cx, s, s, 'patera', 5);
  _limbDarkening(cx, s, s);
  return cv;
}

// ── Birthright ──

function _genAelies(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#d8d8d8', '#a0a0a8');
  // Silver moon with craters
  for (var i = 0; i < 18; i++){
    _crater(cx, r + (_h('ael:cx:' + i) - 0.5) * s * 0.8, r + (_h('ael:cy:' + i) - 0.5) * s * 0.8, 1.5 + _h('ael:cr:' + i) * 4);
  }
  // slight blue-silver tint patches
  cx.save();
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.clip();
  for (var j = 0; j < 4; j++){
    cx.beginPath();
    cx.ellipse(
      r + (_h('ael:px:' + j) - 0.5) * s * 0.5,
      r + (_h('ael:py:' + j) - 0.5) * s * 0.5,
      s * 0.08 + _h('ael:ps:' + j) * s * 0.06,
      s * 0.06 + _h('ael:ps2:' + j) * s * 0.05,
      0, 0, Math.PI * 2
    );
    cx.fillStyle = 'rgba(180,185,210,0.06)';
    cx.fill();
  }
  cx.restore();
  _noisePass(cx, s, s, 'aelies', 6);
  _limbDarkening(cx, s, s);
  return cv;
}

// ── Gregorian (Earth) ──

function _genLunaEarth(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#e0dcd0', '#a8a090');
  // Realistic Earth moon: prominent maria
  var maria = [
    { x: 0.38, y: 0.32, rx: 0.16, ry: 0.12, label: 'Imbrium' },
    { x: 0.52, y: 0.48, rx: 0.10, ry: 0.12, label: 'Serenitatis' },
    { x: 0.42, y: 0.56, rx: 0.08, ry: 0.06, label: 'Tranquillitatis' },
    { x: 0.58, y: 0.35, rx: 0.06, ry: 0.08, label: 'Crisium' },
    { x: 0.35, y: 0.65, rx: 0.09, ry: 0.07, label: 'Nubium' },
    { x: 0.48, y: 0.38, rx: 0.05, ry: 0.06, label: 'Vaporum' }
  ];
  cx.save();
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.clip();
  for (var m of maria){
    cx.beginPath();
    cx.ellipse(s * m.x, s * m.y, s * m.rx, s * m.ry, 0.1, 0, Math.PI * 2);
    cx.fillStyle = 'rgba(100,95,80,0.18)';
    cx.fill();
  }
  cx.restore();
  // craters with bright ray systems
  for (var i = 0; i < 25; i++){
    var px = r + (_h('luna:cx:' + i) - 0.5) * s * 0.85;
    var py = r + (_h('luna:cy:' + i) - 0.5) * s * 0.85;
    var pr = 1 + _h('luna:cr:' + i) * (i < 3 ? 5 : 3.5);
    _crater(cx, px, py, pr);
    // bright ray ejecta for the largest craters
    if (i < 3){
      cx.save();
      cx.beginPath();
      cx.arc(r, r, r, 0, Math.PI * 2);
      cx.clip();
      for (var ray = 0; ray < 5; ray++){
        var angle = _h('luna:ray:' + i + ':' + ray) * Math.PI * 2;
        var len = pr * 2 + _h('luna:rl:' + i + ':' + ray) * pr * 3;
        cx.beginPath();
        cx.moveTo(px, py);
        cx.lineTo(px + Math.cos(angle) * len, py + Math.sin(angle) * len);
        cx.lineWidth = 0.6;
        cx.strokeStyle = 'rgba(220,215,200,0.06)';
        cx.stroke();
      }
      cx.restore();
    }
  }
  _noisePass(cx, s, s, 'lunaearth', 6);
  _limbDarkening(cx, s, s);
  return cv;
}

// generic fallback for non-Eberron moons
function _genGeneric(s: number, color: string){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  var [rr, gg, bb] = _hexToRgb(color);
  var center = 'rgb(' + Math.min(255, rr + 30) + ',' + Math.min(255, gg + 30) + ',' + Math.min(255, bb + 30) + ')';
  var edge = 'rgb(' + Math.max(0, rr - 40) + ',' + Math.max(0, gg - 40) + ',' + Math.max(0, bb - 40) + ')';
  _baseGradient(cx, s, s, center, edge);
  // add some craters so even fallback moons have texture
  for (var i = 0; i < 14; i++){
    _crater(cx, r + (_h('gen:cx:' + i + color) - 0.5) * s * 0.75, r + (_h('gen:cy:' + i + color) - 0.5) * s * 0.75, 1 + _h('gen:cr:' + i + color) * 3.5);
  }
  _noisePass(cx, s, s, color, 6);
  _limbDarkening(cx, s, s);
  return cv;
}

// ── generator dispatch ──

var GENERATORS: Record<string, (s: number) => HTMLCanvasElement> = {
  // Eberron
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
  Vult: _genVult,
  // Forgotten Realms
  'Selûne': _genSelune,
  // Greyhawk + Gregorian (both named Luna)
  Luna: _genLunaEarth,
  Celene: _genCelene,
  // Dragonlance
  Solinari: _genSolinari,
  Lunitari: _genLunitari,
  Nuitari: _genNuitari,
  // Exandria
  Catha: _genCatha,
  Ruidus: _genRuidus,
  // Mystara
  Matera: _genMatera,
  Patera: _genPatera,
  // Birthright
  Aelies: _genAelies
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

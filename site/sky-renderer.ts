// Canvas 2D panoramic sky renderer — no WebGL / Three.js dependency.
// Renders a south-facing panoramic sky view (East to West) onto a plain <canvas>.
import { getMoonTexture, generateStarField, generateMilkyWay, StarData, MilkyWayParticle } from './sky-textures.js';
import type { SkyScene, SkySceneMoon } from '../src/showcase/sky-scene.js';

// ── Constants ──
var LAND_FRAC = 0.12;
var SKY_AZ_MIN = 81;          // East edge (90° - 5% padding)
var SKY_AZ_MAX = 279;         // West edge (270° + 5% padding)
var SKY_AZ_RANGE = SKY_AZ_MAX - SKY_AZ_MIN; // 198°
var PANO_ALT_MAX = 70;        // degrees of sky altitude visible
var SUN_ANGULAR_DIAM = 0.53;  // degrees
var DEG2RAD = Math.PI / 180;

// ── Module state ──
var _canvas: HTMLCanvasElement | null = null;
var _ctx: CanvasRenderingContext2D | null = null;
var _logicalW = 1120;
var _logicalH = 630;

// Stars
var _starWorldId = '';
var _starData: StarData[] | null = null;
var _milkyWayData: MilkyWayParticle[] | null = null;

// Clouds
var _cloudSeeds: { az: number; alt: number; rx: number; ry: number; alpha: number; speed: number }[] = [];

// Moon screen positions (for click/hover detection)
var _moonScreenPositions: { name: string; x: number; y: number; radius: number; moon: any }[] = [];

// ── Coordinate helpers ──
// Convert (azimuth°, altitude°) → canvas (x, y).
// Azimuth 90 = E (left edge), 180 = S (centre), 270 = W (right edge).
function _azAltToXY(azDeg: number, altDeg: number, w: number, h: number): { x: number; y: number } {
  var skyH = h * (1 - LAND_FRAC);
  var az = ((azDeg - SKY_AZ_MIN) % 360 + 360) % 360;
  var x = (az / SKY_AZ_RANGE) * w;
  var alt = Math.max(-5, Math.min(PANO_ALT_MAX, altDeg));
  // Power curve gently compresses zenith — removes funhouse-mirror stretching
  var altNorm = Math.max(0, alt / PANO_ALT_MAX);
  var y = skyH * (1 - Math.pow(altNorm, 0.85));
  return { x, y };
}

function _smoothstep(edge0: number, edge1: number, x: number): number {
  var t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function _moonRadiusPx(angularDiameterDeg: number, mode: string, canvasH: number): number {
  if (mode === 'true') {
    var skyH = canvasH * (1 - LAND_FRAC);
    var pxPerDegree = skyH / PANO_ALT_MAX;
    return Math.max(0.5, (Math.max(0, angularDiameterDeg) * pxPerDegree) / 2);
  }
  return Math.max(25, Math.min(50, angularDiameterDeg * 22)) / 2;
}

function _hash(input: string | number): number {
  var text = String(input);
  var hash = 2166136261;
  for (var i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

// ── Colour helpers ──
function _lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function _lerpRgb(a: number[], b: number[], t: number): number[] {
  return [_lerp(a[0], b[0], t), _lerp(a[1], b[1], t), _lerp(a[2], b[2], t)];
}
function _rgbStr(c: number[]): string {
  return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')';
}
function _rgbaStr(c: number[], a: number): string {
  return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + a.toFixed(3) + ')';
}

// ── Sky gradient colours ──
var _nightTop = [6, 14, 30];
var _nightBot = [30, 21, 16];
var _dayTop = [30, 80, 160];
var _dayMid = [70, 140, 210];
var _dayBot = [140, 190, 230];
var _sunsetWarm = [255, 140, 51];
var _sunsetDeep = [204, 64, 31];

// ── Initialization ──
export function initSkyRenderer(canvas: HTMLCanvasElement): void {
  _canvas = canvas;
  // DPI scaling for crisp text on Retina displays
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  _logicalW = canvas.clientWidth || canvas.width;
  _logicalH = canvas.clientHeight || canvas.height;
  canvas.width = _logicalW * dpr;
  canvas.height = _logicalH * dpr;
  canvas.style.width = _logicalW + 'px';
  canvas.style.height = _logicalH + 'px';
  _ctx = canvas.getContext('2d')!;
  _ctx.scale(dpr, dpr);
  _initCloudSeeds();
}

// ── Sky background ──
function _drawSkyGradient(ctx: CanvasRenderingContext2D, w: number, h: number, sunAlt: number, sunAz: number) {
  var skyH = h * (1 - LAND_FRAC);
  var nightFade = _smoothstep(-18, -6, sunAlt);   // 0 deep night → 1 twilight edge
  var dayFade = _smoothstep(0, 12, sunAlt);        // 0 twilight → 1 full day
  var twilightFade = _smoothstep(-6, 0, sunAlt);   // 0 → 1 through sunrise/set band

  // Column-by-column gradient for localised sunset glow
  var cols = Math.min(w, 360);
  var colW = Math.ceil(w / cols);
  for (var ci = 0; ci < cols; ci++) {
    var cx = ci * colW;
    var colAz = SKY_AZ_MIN + (ci / cols) * SKY_AZ_RANGE;  // azimuth at this column
    // Angular proximity of this column to sun azimuth
    var dAz = Math.abs(((colAz - sunAz + 540) % 360) - 180);
    var sunProximity = Math.max(0, 1 - dAz / 90);   // 1 at sun, 0 at 90° away
    var horizonGlow = sunProximity * sunProximity;

    // Vertical gradient
    var grad = ctx.createLinearGradient(cx, 0, cx, skyH);
    var steps = 8;
    for (var si = 0; si <= steps; si++) {
      var t = si / steps;            // 0 = top, 1 = horizon
      var altNorm = 1 - t;           // 1 at top, 0 at horizon

      // Base night / day colour at this altitude
      var nightC = _lerpRgb(_nightBot, _nightTop, altNorm);
      var dayC = _lerpRgb(_dayBot, _lerpRgb(_dayMid, _dayTop, altNorm), altNorm);
      var baseC = _lerpRgb(nightC, dayC, dayFade);

      // Localised sunset / sunrise tint
      var twilightStrength = Math.sin(twilightFade * Math.PI) * (1 - dayFade);
      var sunsetC = _lerpRgb(_sunsetDeep, _sunsetWarm, sunProximity * sunProximity);
      var glowAmount = twilightStrength * horizonGlow * (1 - altNorm) * 0.7;
      baseC = _lerpRgb(baseC, sunsetC, glowAmount);

      grad.addColorStop(t, _rgbStr(baseC));
    }
    ctx.fillStyle = grad;
    ctx.fillRect(cx, 0, colW + 1, skyH);
  }
}

// ── Stars ──
function _ensureStars(worldId: string) {
  if (worldId === _starWorldId && _starData) return;
  _starWorldId = worldId;
  var w = _canvas ? _canvas.width : 1120;
  var h = _canvas ? _canvas.height : 630;
  _starData = generateStarField(w, h, worldId, 0, 0);
  _milkyWayData = generateMilkyWay(w, h, worldId, 0, 0);
}

// Spherical trig: convert celestial coords (RA-like az, dec-like alt) to horizon
// coords (azimuth, altitude) for a given observer latitude and hour-angle offset.
function _celestialToHorizon(raAz: number, dec: number, latRad: number, haOffset: number): { az: number; alt: number } | null {
  var decRad = dec * DEG2RAD;
  var H = (raAz + haOffset - 180) * DEG2RAD;
  var sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(H);
  var altDeg = Math.asin(Math.max(-1, Math.min(1, sinAlt))) / DEG2RAD;
  if (altDeg < -5) return null; // well below horizon
  var azRad = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(latRad) - Math.tan(decRad) * Math.cos(latRad));
  var azDeg = ((azRad / DEG2RAD) + 180 + 360) % 360;
  return { az: azDeg, alt: altDeg };
}

function _drawStars(ctx: CanvasRenderingContext2D, w: number, h: number, sunAlt: number, timeFrac: number, worldId: string, observerLat: number) {
  var starAlpha = 1 - _smoothstep(-12, 6, sunAlt);
  if (starAlpha < 0.01) return;
  _ensureStars(worldId);
  var skyH = h * (1 - LAND_FRAC);
  var latRad = observerLat * DEG2RAD;
  var haOffset = timeFrac * 360; // hour-angle rotation from time of day

  // Milky Way (draw first, behind stars)
  if (_milkyWayData && worldId !== 'eberron') {
    for (var mi = 0; mi < _milkyWayData.length; mi++) {
      var mp = _milkyWayData[mi];
      var mhz = _celestialToHorizon(mp.az, mp.alt, latRad, haOffset);
      if (!mhz) continue;
      // Skip stars outside our view range
      var mAzNorm = ((mhz.az - SKY_AZ_MIN) % 360 + 360) % 360;
      if (mAzNorm > SKY_AZ_RANGE + 5) continue;
      var pos = _azAltToXY(mhz.az, mhz.alt, w, h);
      if (pos.y > skyH) continue;
      var mwA = mp.alpha * 0.3 * starAlpha;
      if (mwA < 0.005) continue;
      ctx.globalAlpha = mwA;
      ctx.fillStyle = 'rgb(219,214,199)';
      var sz = mp.size * 1.5;
      ctx.fillRect(pos.x - sz / 2, pos.y - sz / 2, sz, sz);
    }
  }

  // Stars — treat star.az as RA (celestial longitude) and star.alt as declination
  if (_starData) {
    for (var i = 0; i < _starData.length; i++) {
      var s = _starData[i];
      var hz = _celestialToHorizon(s.az, s.alt, latRad, haOffset);
      if (!hz) continue;
      // Skip stars outside our view range
      var azNorm = ((hz.az - SKY_AZ_MIN) % 360 + 360) % 360;
      if (azNorm > SKY_AZ_RANGE + 5) continue;
      var pos = _azAltToXY(hz.az, hz.alt, w, h);
      if (pos.y > skyH) continue;
      // Twinkle
      var twinkle = Math.sin(timeFrac * 6.28318 * s.twinkleFreq + s.twinklePhase);
      var amp = s.tier === 0 ? 0.25 : s.tier === 1 ? 0.15 : 0.08;
      var alpha = Math.max(0, s.baseAlpha + twinkle * amp) * starAlpha;
      if (alpha < 0.01) continue;
      ctx.globalAlpha = alpha;
      if (s.tier === 0) {
        // Bright stars: diffraction cross + halo glow
        ctx.fillStyle = 'rgba(' + s.r + ',' + s.g + ',' + s.b + ',' + alpha + ')';
        ctx.fillRect(pos.x - s.size * 2.5, pos.y - 0.4, s.size * 5, 0.8);
        ctx.fillRect(pos.x - 0.4, pos.y - s.size * 2.5, 0.8, s.size * 5);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, s.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        var halo = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, s.size * 4);
        halo.addColorStop(0, 'rgba(' + s.r + ',' + s.g + ',' + s.b + ',' + (alpha * 0.12) + ')');
        halo.addColorStop(1, 'rgba(' + s.r + ',' + s.g + ',' + s.b + ',0)');
        ctx.fillStyle = halo;
        ctx.fillRect(pos.x - s.size * 4, pos.y - s.size * 4, s.size * 8, s.size * 8);
      } else if (s.tier === 1) {
        // Medium: circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + s.r + ',' + s.g + ',' + s.b + ',' + alpha + ')';
        ctx.fill();
      } else {
        // Dim: pixel
        ctx.fillStyle = 'rgba(' + s.r + ',' + s.g + ',' + s.b + ',' + alpha + ')';
        ctx.fillRect(pos.x, pos.y, s.size * 2, s.size * 2);
      }
    }
  }
  ctx.globalAlpha = 1;
}

// ── Sun ──
function _drawSun(ctx: CanvasRenderingContext2D, w: number, h: number, sunAlt: number, sunAz: number, lunarSizeMode: string, sunName: string | undefined) {
  if (sunAlt < -2) return;
  var pos = _azAltToXY(sunAz, sunAlt, w, h);
  var r = _moonRadiusPx(SUN_ANGULAR_DIAM, lunarSizeMode, h);
  r = Math.max(r, 6);
  // Glow
  var grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r * 8);
  grad.addColorStop(0, 'rgba(255,255,240,1)');
  grad.addColorStop(0.05, 'rgba(255,250,200,0.9)');
  grad.addColorStop(0.15, 'rgba(255,230,150,0.3)');
  grad.addColorStop(0.4, 'rgba(255,200,100,0.05)');
  grad.addColorStop(1, 'rgba(255,180,80,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(pos.x - r * 8, pos.y - r * 8, r * 16, r * 16);

  // Label
  if (sunName && sunAlt >= 2) {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(255,240,200,0.85)';
    ctx.font = '12px "Trebuchet MS", "Gill Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(sunName, pos.x, pos.y + r + 14);
    ctx.globalAlpha = 1;
  }
}

// ── Moons ──
var _moonTexCache = new Map<string, HTMLCanvasElement>();

function _drawMoonDisk(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, phase: { illum: number; waxing: boolean }, retrograde: boolean, albedo: number, moonName: string, timeFrac: number) {
  var albedoScale = Math.max(0.25, Math.min(2.2, albedo / 0.12));
  var isBarrakas = moonName === 'Barrakas';
  var glowRadius = radius * (1.5 + albedoScale * 0.5) * (isBarrakas ? 1.8 : 1);

  // Atmospheric glow halo
  var glowAlpha = Math.max(0.04, Math.min(0.18, 0.05 + albedoScale * 0.04)) * (isBarrakas ? 2.2 : 1);
  var glowGrad = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
  glowGrad.addColorStop(0, color);
  glowGrad.addColorStop(0.3, color);
  glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = glowAlpha;
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();
  // Second wider pass for faint outer haze
  var outerGlow = ctx.createRadialGradient(x, y, glowRadius * 0.3, x, y, glowRadius * 1.6);
  outerGlow.addColorStop(0, color);
  outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = glowAlpha * 0.3;
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw cached procedural texture, clipped to circle
  var texKey = moonName + ':' + Math.round(radius);
  var tex = _moonTexCache.get(texKey);
  if (!tex) {
    tex = getMoonTexture(moonName, color, radius);
    _moonTexCache.set(texKey, tex);
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(tex, x - radius, y - radius, radius * 2, radius * 2);

  // Zarantyr storm rotation effect
  if (moonName === 'Zarantyr') {
    ctx.globalAlpha = 0.15;
    ctx.translate(x, y);
    ctx.rotate(timeFrac * Math.PI * 0.3);
    ctx.drawImage(tex, -radius, -radius, radius * 2, radius * 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Re-apply clip after transform reset
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = 1;
  }

  // Phase shadow — elliptical terminator
  var illum = Math.max(0, Math.min(1, phase.illum));
  var waxing = retrograde ? !phase.waxing : phase.waxing;
  ctx.fillStyle = 'rgba(3, 6, 12, 0.92)';
  if (illum < 0.995) {
    ctx.beginPath();
    var terminatorX = Math.cos(illum * Math.PI) * radius;
    if (waxing) {
      // Shadow on the left (waxing: lit from right)
      ctx.arc(x, y, radius, Math.PI * 0.5, Math.PI * 1.5);
      ctx.ellipse(x, y, Math.abs(terminatorX), radius, 0, Math.PI * 1.5, Math.PI * 0.5, terminatorX > 0);
    } else {
      // Shadow on the right (waning: lit from left)
      ctx.arc(x, y, radius, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.ellipse(x, y, Math.abs(terminatorX), radius, 0, Math.PI * 0.5, -Math.PI * 0.5, terminatorX > 0);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Edge highlight
  var edgeAlpha = Math.max(0.2, Math.min(0.7, 0.3 + albedoScale * 0.15));
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = 'rgba(255, 255, 255, ' + edgeAlpha + ')';
  ctx.stroke();
}

function _drawMoons(ctx: CanvasRenderingContext2D, w: number, h: number, scene: SkyScene, lunarSizeMode: string, sunAlt: number, timeFrac: number) {
  _moonScreenPositions = [];
  var moonDimming = Math.max(0.4, 1 - _smoothstep(-6, 12, sunAlt) * 0.6);

  // Collect visible moons
  var visible: SkySceneMoon[] = [];
  for (var i = 0; i < scene.moons.length; i++) {
    var moon = scene.moons[i];
    if (moon.category === 'below') continue;
    if (moon.altitudeExact < -3) continue;
    visible.push(moon);
  }
  // Sort by orbital distance descending — farthest drawn first (behind), closest on top
  visible.sort(function(a, b) { return (b.orbitalDistance || 0) - (a.orbitalDistance || 0); });

  for (var vi = 0; vi < visible.length; vi++) {
    var moon = visible[vi];
    var radiusPx = _moonRadiusPx(moon.angularDiameterDeg, lunarSizeMode, h);
    var pos = _azAltToXY(moon.azimuth, moon.altitudeExact, w, h);
    var color = moon.color || '#d8dee7';

    ctx.save();
    ctx.globalAlpha = moonDimming;
    _drawMoonDisk(ctx, pos.x, pos.y, radiusPx, color, moon.phase, !!moon.retrograde, Number(moon.albedo || 0.12), moon.name, timeFrac);
    ctx.restore();

    // Label
    if (moon.altitudeExact >= 2) {
      ctx.globalAlpha = moonDimming * 0.9;
      ctx.fillStyle = 'rgba(247,242,232,0.9)';
      ctx.font = '13px "Trebuchet MS", "Gill Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(moon.name, pos.x, pos.y + radiusPx + 14);
      ctx.globalAlpha = 1;
    }

    _moonScreenPositions.push({ name: moon.name, x: pos.x, y: pos.y, radius: radiusPx, moon: moon });
  }
}

// ── Ring of Siberys ── (proper celestial equator arc with Saturn-analog bands)
function _drawSiberysRing(ctx: CanvasRenderingContext2D, w: number, h: number, observerLatDeg: number, serial: number, timeFrac: number) {
  var lat = observerLatDeg * DEG2RAD;
  var steps = 120;
  var outerPts: {x: number; y: number}[] = [];
  var innerPts: {x: number; y: number}[] = [];
  var centerPts: {x: number; y: number}[] = [];
  var halfWidthDeg = 6;

  // Trace the celestial equator arc across the sky
  for (var i = 0; i <= steps; i++) {
    var H = (-180 + 360 * i / steps) * DEG2RAD;
    var sinAlt = Math.cos(lat) * Math.cos(H);
    var altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
    var altDeg = altRad / DEG2RAD;
    if (altDeg < halfWidthDeg) continue; // skip near-horizon to prevent edge flaring

    var azRaw = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat));
    var azDeg = ((azRaw / DEG2RAD) + 180 + 360) % 360;

    centerPts.push(_azAltToXY(azDeg, altDeg, w, h));
    outerPts.push(_azAltToXY(azDeg, altDeg + halfWidthDeg, w, h));
    innerPts.push(_azAltToXY(azDeg, altDeg - halfWidthDeg, w, h));
  }

  if (centerPts.length < 2) return;

  ctx.save();

  // Interpolate between inner and outer at fraction f (0=inner, 1=outer)
  function _bandPts(f: number): {x: number; y: number}[] {
    var pts: {x: number; y: number}[] = [];
    for (var j = 0; j < innerPts.length; j++) {
      pts.push({
        x: innerPts[j].x + (outerPts[j].x - innerPts[j].x) * f,
        y: innerPts[j].y + (outerPts[j].y - innerPts[j].y) * f
      });
    }
    return pts;
  }

  // Saturn-analog multi-band structure
  var bandDefs = [
    { f0: 0.00, f1: 0.04, color: 'rgba(180,155,80,0.02)' },   // D Ring
    { f0: 0.04, f1: 0.22, color: 'rgba(200,175,100,0.07)' },   // C Ring
    { f0: 0.22, f1: 0.38, color: 'rgba(248,220,140,0.22)' },   // B Ring inner
    { f0: 0.38, f1: 0.56, color: 'rgba(240,212,130,0.18)' },   // B Ring outer
    { f0: 0.56, f1: 0.62, color: 'rgba(160,140,70,0.01)' },    // Cassini Division
    { f0: 0.62, f1: 0.82, color: 'rgba(232,203,118,0.13)' },   // A Ring inner
    { f0: 0.82, f1: 0.84, color: 'rgba(160,140,70,0.01)' },    // Encke Gap
    { f0: 0.84, f1: 0.92, color: 'rgba(220,195,110,0.10)' },   // A Ring outer
    { f0: 0.96, f1: 1.00, color: 'rgba(200,175,100,0.04)' }    // F Ring
  ];
  for (var bd = 0; bd < bandDefs.length; bd++) {
    var def = bandDefs[bd];
    var lo = _bandPts(def.f0);
    var hi = _bandPts(def.f1);
    ctx.beginPath();
    ctx.moveTo(hi[0].x, hi[0].y);
    for (var j = 1; j < hi.length; j++) ctx.lineTo(hi[j].x, hi[j].y);
    for (var k = lo.length - 1; k >= 0; k--) ctx.lineTo(lo[k].x, lo[k].y);
    ctx.closePath();
    ctx.fillStyle = def.color;
    ctx.fill();
  }

  // Edge softening
  var edgeInner = _bandPts(0.02);
  var edgeOuter = _bandPts(0.98);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(232,203,118,0.04)';
  ctx.shadowColor = 'rgba(232,203,118,0.15)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(edgeOuter[0].x, edgeOuter[0].y);
  for (var eo = 1; eo < edgeOuter.length; eo++) ctx.lineTo(edgeOuter[eo].x, edgeOuter[eo].y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(edgeInner[0].x, edgeInner[0].y);
  for (var ei = 1; ei < edgeInner.length; ei++) ctx.lineTo(edgeInner[ei].x, edgeInner[ei].y);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Orbital drift particles — dragonshard fragments with Keplerian motion
  var DRIFT_INNER = 1666;
  var DRIFT_OUTER = 895;
  var particleCount = 400;
  function _bandDensity(f: number): number {
    if (f < 0.04) return 0.1;
    if (f < 0.22) return 0.4;
    if (f < 0.56) return 1.0;
    if (f < 0.62) return 0.03;
    if (f < 0.82) return 0.7;
    if (f < 0.84) return 0.03;
    if (f < 0.92) return 0.55;
    if (f < 0.96) return 0.0;
    return 0.2;
  }
  var driftTime = serial + timeFrac;
  for (var s = 0; s < particleCount; s++) {
    var bandFrac = _hash('sib:band:' + s);
    if (_hash('sib:keep:' + s) > _bandDensity(bandFrac)) continue;
    var baseAngle = _hash('sib:angle:' + s) * 360;
    var driftRate = DRIFT_INNER - bandFrac * (DRIFT_INNER - DRIFT_OUTER);
    var angle = ((baseAngle + driftTime * driftRate) % 360 + 360) % 360;
    // Convert to hour angle for spherical projection (ring is equatorial, dec=0)
    var pH = (angle - 180) * DEG2RAD;
    var pSinAlt = Math.cos(lat) * Math.cos(pH);
    var pAltDeg = Math.asin(Math.max(-1, Math.min(1, pSinAlt))) / DEG2RAD;
    if (pAltDeg < 0) continue;
    var pAzRaw = Math.atan2(Math.sin(pH), Math.cos(pH) * Math.sin(lat));
    var pAzDeg = ((pAzRaw / DEG2RAD) + 180 + 360) % 360;
    // Interpolate between inner and outer ring edges
    var ptInner = _azAltToXY(pAzDeg, Math.max(0, pAltDeg - halfWidthDeg), w, h);
    var ptOuter = _azAltToXY(pAzDeg, pAltDeg + halfWidthDeg, w, h);
    var pt = {
      x: ptInner.x + (ptOuter.x - ptInner.x) * bandFrac,
      y: ptInner.y + (ptOuter.y - ptInner.y) * bandFrac
    };
    // Shimmer
    var shimmerFreq = 0.3 + _hash('sib:freq:' + s) * 1.2;
    var shimmerPhase = _hash('sib:phase:' + s) * Math.PI * 2;
    var shimmer = 0.6 + 0.4 * Math.sin(driftTime * shimmerFreq * Math.PI * 2 + shimmerPhase);
    var bandBright = bandFrac < 0.22 ? 0.4 : (bandFrac < 0.56 ? 1.0 : 0.7);
    var pAlpha = (0.08 + shimmer * 0.27) * bandBright;
    var r = 0.8 + _hash('sib:size:' + s) * 1.7 * (bandFrac < 0.56 ? 1.0 : 0.8);
    // Soft glow dot
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,237,178,' + pAlpha.toFixed(3) + ')';
    ctx.fill();
    if (pAlpha > 0.18) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,237,178,' + (pAlpha * 0.15).toFixed(3) + ')';
      ctx.fill();
    }
  }

  // Label near the crest
  var crest = centerPts[Math.floor(centerPts.length * 0.55)];
  if (crest) {
    ctx.fillStyle = 'rgba(255, 235, 191, 0.8)';
    ctx.font = '12px "Trebuchet MS", "Gill Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Ring of Siberys', crest.x + 10, crest.y - 8);
  }
  ctx.restore();
}

// ── Landscape with farmstead ──
function _drawLandscape(ctx: CanvasRenderingContext2D, w: number, h: number, sunAlt: number) {
  var skyH = h * (1 - LAND_FRAC);
  var landH = h - skyH;

  var isDark = sunAlt < 0;
  var backColor = isDark ? '#080c16' : '#0e1820';
  var midColor = isDark ? '#060a12' : '#0a1418';
  var frontColor = isDark ? '#040810' : '#080e14';

  // ── Back ridge: tall, smooth mountains ──
  ctx.fillStyle = backColor;
  ctx.beginPath();
  ctx.moveTo(0, skyH);
  for (var x = 0; x <= w; x += 2) {
    var t = x / w;
    var ridge =
      Math.sin(t * Math.PI * 2.3 + 0.5) * 0.4 +
      Math.sin(t * Math.PI * 4.7 + 1.2) * 0.25 +
      Math.sin(t * Math.PI * 7.1 + 2.8) * 0.12 +
      Math.sin(t * Math.PI * 11.3 + 0.3) * 0.06;
    var peakH = landH * (0.6 + ridge * 0.7);
    ctx.lineTo(x, skyH - peakH + landH * 0.4);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // ── Mid ridge: medium detail ──
  ctx.fillStyle = midColor;
  ctx.beginPath();
  ctx.moveTo(0, skyH);
  for (var x2 = 0; x2 <= w; x2 += 2) {
    var t2 = x2 / w;
    var ridge2 =
      Math.sin(t2 * Math.PI * 3.1 + 2.1) * 0.35 +
      Math.sin(t2 * Math.PI * 6.3 + 0.7) * 0.2 +
      Math.sin(t2 * Math.PI * 13.7 + 1.9) * 0.08;
    var peakH2 = landH * (0.35 + ridge2 * 0.5);
    ctx.lineTo(x2, skyH - peakH2 + landH * 0.5);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // ── Farmhouse on mid ridge (at ~70% from left) ──
  var farmX = w * 0.7;
  var farmBaseY = skyH + landH * 0.15;
  var farmW = 18;
  var farmH = 14;
  ctx.fillStyle = frontColor;
  // Walls
  ctx.fillRect(farmX - farmW / 2, farmBaseY - farmH, farmW, farmH);
  // Peaked roof
  ctx.beginPath();
  ctx.moveTo(farmX - farmW / 2 - 3, farmBaseY - farmH);
  ctx.lineTo(farmX, farmBaseY - farmH - 10);
  ctx.lineTo(farmX + farmW / 2 + 3, farmBaseY - farmH);
  ctx.closePath();
  ctx.fill();
  // Chimney
  ctx.fillRect(farmX + farmW / 4, farmBaseY - farmH - 14, 4, 8);

  // ── Trees (conifers scattered on ridges) ──
  var treePositions = [
    { x: w * 0.08, baseY: skyH + landH * 0.18, h: 22 },
    { x: w * 0.15, baseY: skyH + landH * 0.14, h: 28 },
    { x: w * 0.22, baseY: skyH + landH * 0.2, h: 18 },
    { x: w * 0.55, baseY: skyH + landH * 0.16, h: 24 },
    { x: w * 0.62, baseY: skyH + landH * 0.12, h: 20 },
    { x: w * 0.85, baseY: skyH + landH * 0.18, h: 26 },
    { x: w * 0.92, baseY: skyH + landH * 0.22, h: 16 },
  ];
  ctx.fillStyle = frontColor;
  for (var ti = 0; ti < treePositions.length; ti++) {
    var tree = treePositions[ti];
    // Triangle conifer
    ctx.beginPath();
    ctx.moveTo(tree.x, tree.baseY - tree.h);
    ctx.lineTo(tree.x - tree.h * 0.3, tree.baseY);
    ctx.lineTo(tree.x + tree.h * 0.3, tree.baseY);
    ctx.closePath();
    ctx.fill();
    // Trunk
    ctx.fillRect(tree.x - 1.5, tree.baseY, 3, 5);
  }

  // ── Front ridge: low rolling hills ──
  ctx.fillStyle = frontColor;
  ctx.beginPath();
  ctx.moveTo(0, skyH + landH * 0.35);
  for (var x3 = 0; x3 <= w; x3 += 2) {
    var t3 = x3 / w;
    var ridge3 =
      Math.sin(t3 * Math.PI * 5.7 + 0.3) * 0.3 +
      Math.sin(t3 * Math.PI * 9.2 + 2.1) * 0.15;
    var y3 = skyH + landH * (0.35 + ridge3 * 0.15);
    ctx.lineTo(x3, y3);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // ── Fence posts along bottom ──
  ctx.strokeStyle = isDark ? '#0a0e18' : '#101820';
  ctx.lineWidth = 1.5;
  var fenceY = h - landH * 0.15;
  // Horizontal rails
  ctx.beginPath();
  ctx.moveTo(0, fenceY);
  ctx.lineTo(w, fenceY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, fenceY - 6);
  ctx.lineTo(w, fenceY - 6);
  ctx.stroke();
  // Vertical posts
  for (var fp = 0; fp < w; fp += 40) {
    ctx.beginPath();
    ctx.moveTo(fp, fenceY + 4);
    ctx.lineTo(fp, fenceY - 10);
    ctx.stroke();
  }

  // Fill the very bottom solid
  ctx.fillStyle = frontColor;
  ctx.fillRect(0, h - 8, w, 8);
}

// ── Clouds ──
function _initCloudSeeds() {
  _cloudSeeds = [];
  for (var layer = 0; layer < 3; layer++) {
    var numBlobs = 5 + layer * 3;
    var baseAlt = 10 + layer * 15;
    var speed = 0.02 + layer * 0.01;
    for (var b = 0; b < numBlobs; b++) {
      _cloudSeeds.push({
        az: SKY_AZ_MIN + _hash('cloud:' + layer + ':' + b + ':x') * SKY_AZ_RANGE,
        alt: baseAlt + (_hash('cloud:' + layer + ':' + b + ':y') - 0.5) * 10,
        rx: 30 + _hash('cloud:' + layer + ':' + b + ':rx') * 40,
        ry: 16 + _hash('cloud:' + layer + ':' + b + ':rx') * 24,
        alpha: 0.015 + _hash('cloud:' + layer + ':' + b + ':a') * 0.035,
        speed: speed * (0.7 + _hash('cloud:' + layer + ':' + b + ':x') * 0.6)
      });
    }
  }
}

function _drawClouds(ctx: CanvasRenderingContext2D, w: number, h: number, timeFrac: number, sunAlt: number) {
  var isNight = sunAlt < -6;
  var isTwilight = sunAlt >= -6 && sunAlt < 6;
  var cloudR = isNight ? 100 : isTwilight ? 255 : 220;
  var cloudG = isNight ? 110 : isTwilight ? 180 : 225;
  var cloudB = isNight ? 130 : isTwilight ? 140 : 240;
  var baseFade = isNight ? 0.4 : 0.7;

  for (var i = 0; i < _cloudSeeds.length; i++) {
    var c = _cloudSeeds[i];
    var driftAz = (c.az + timeFrac * c.speed * 3600) % 360;
    var pos = _azAltToXY(driftAz, c.alt, w, h);
    var alpha = c.alpha * baseFade;
    if (alpha < 0.005) continue;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, c.rx, c.ry, 0, 0, Math.PI * 2);
    var grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, c.rx);
    grad.addColorStop(0, 'rgba(' + cloudR + ',' + cloudG + ',' + cloudB + ',' + alpha + ')');
    grad.addColorStop(0.5, 'rgba(' + cloudR + ',' + cloudG + ',' + cloudB + ',' + (alpha * 0.4) + ')');
    grad.addColorStop(1, 'rgba(' + cloudR + ',' + cloudG + ',' + cloudB + ',0)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }
}

// ── Main render function ──
export function renderSkyFrame(
  scene: SkyScene,
  sunAlt: number,
  sunAz: number,
  lunarSizeMode: 'useful' | 'true',
  timeFrac: number,
  serial: number,
  worldId: string
): void {
  if (!_ctx || !_canvas) return;
  var w = _logicalW;
  var h = _logicalH;
  var ctx = _ctx;

  // Clear (use full backing-store size)
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, _canvas.width, _canvas.height);
  ctx.restore();

  // 1. Sky gradient background
  _drawSkyGradient(ctx, w, h, sunAlt, sunAz);

  // 2. Stars and Milky Way (behind everything else)
  _drawStars(ctx, w, h, sunAlt, timeFrac, worldId, scene.observerLatitude);

  // 3. Ring of Siberys (Eberron only)
  if (worldId === 'eberron') {
    var ringAlpha = Math.max(0.15, 1 - _smoothstep(-12, 6, sunAlt));
    ctx.save();
    ctx.globalAlpha = ringAlpha;
    _drawSiberysRing(ctx, w, h, scene.observerLatitude, serial, timeFrac);
    ctx.restore();
  }

  // 4. Clouds
  _drawClouds(ctx, w, h, timeFrac, sunAlt);

  // 5. Sun
  _drawSun(ctx, w, h, sunAlt, sunAz, lunarSizeMode, scene.sunName);

  // 6. Moons
  _drawMoons(ctx, w, h, scene, lunarSizeMode, sunAlt, timeFrac);

  // 7. Landscape (foreground)
  _drawLandscape(ctx, w, h, sunAlt);
}

// ── Cleanup ──
export function disposeSkyRenderer(): void {
  _ctx = null;
  _canvas = null;
  _moonTexCache.clear();
  _moonScreenPositions = [];
  _starData = null;
  _milkyWayData = null;
}

// ── Moon screen positions for click/hover ──
export function getMoonScreenPositions(): { name: string; x: number; y: number; radius: number; moon: any }[] {
  return _moonScreenPositions;
}

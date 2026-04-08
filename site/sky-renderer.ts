// Canvas 2D panoramic sky renderer — no WebGL / Three.js dependency.
// Renders a full 360° panoramic sky view onto a plain <canvas>.
import { getMoonTexture, generateStarField, generateMilkyWay, StarData, MilkyWayParticle } from './sky-textures.js';
import type { SkyScene, SkySceneMoon } from '../src/showcase/sky-scene.js';

// ── Constants ──
var LAND_FRAC = 0.12;
var PANO_ALT_MAX = 75;       // degrees of sky altitude visible
var SUN_ANGULAR_DIAM = 0.53; // degrees
var DEG2RAD = Math.PI / 180;

// ── Module state ──
var _canvas: HTMLCanvasElement | null = null;
var _ctx: CanvasRenderingContext2D | null = null;

// Stars
var _starWorldId = '';
var _starData: StarData[] | null = null;
var _milkyWayData: MilkyWayParticle[] | null = null;

// Ring of Siberys
var _ringCacheKey = '';
var _ringParticleSeeds: { bandFrac: number; baseAngle: number; driftRate: number; shimmerFreq: number; shimmerPhase: number; bandBright: number; size: number }[] = [];

// Clouds
var _cloudSeeds: { az: number; alt: number; rx: number; ry: number; alpha: number; speed: number }[] = [];

// Moon screen positions (for click/hover detection)
var _moonScreenPositions: { name: string; x: number; y: number; radius: number; moon: any }[] = [];

// ── Coordinate helpers ──
// Convert (azimuth°, altitude°) → canvas (x, y).
// Azimuth 0 = N, 90 = E, 180 = S (centre of view), 270 = W.
function _azAltToXY(azDeg: number, altDeg: number, w: number, h: number): { x: number; y: number } {
  var skyH = h * (1 - LAND_FRAC);
  // Horizontal: azimuth 180° maps to centre, full 360° wraps across width.
  var x = ((azDeg - 180 + 540) % 360 - 180) / 180 * (w / 2) + w / 2;
  // Vertical: altitude 0° at horizon, PANO_ALT_MAX° at top.
  var y = skyH * (1 - Math.min(altDeg, PANO_ALT_MAX) / PANO_ALT_MAX);
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
  _ctx = canvas.getContext('2d')!;
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
    var colAz = 180 + (ci / cols - 0.5) * 360;  // azimuth at this column
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

function _drawStars(ctx: CanvasRenderingContext2D, w: number, h: number, sunAlt: number, timeFrac: number, worldId: string) {
  var starAlpha = 1 - _smoothstep(-12, 6, sunAlt);
  if (starAlpha < 0.01) return;
  _ensureStars(worldId);

  // Milky Way (draw first, behind stars)
  if (_milkyWayData && worldId !== 'eberron') {
    for (var mi = 0; mi < _milkyWayData.length; mi++) {
      var mp = _milkyWayData[mi];
      // Apply daily rotation via timeFrac
      var rotAz = (mp.az + timeFrac * 360) % 360;
      var pos = _azAltToXY(rotAz, mp.alt, w, h);
      var mwA = mp.alpha * 0.3 * starAlpha;
      if (mwA < 0.005) continue;
      ctx.globalAlpha = mwA;
      ctx.fillStyle = 'rgb(219,214,199)';
      var sz = mp.size * 1.5;
      ctx.fillRect(pos.x - sz / 2, pos.y - sz / 2, sz, sz);
    }
  }

  // Stars
  if (_starData) {
    for (var i = 0; i < _starData.length; i++) {
      var s = _starData[i];
      var rotAz = (s.az + timeFrac * 360) % 360;
      var pos = _azAltToXY(rotAz, s.alt, w, h);
      // Twinkle
      var twinkle = Math.sin(timeFrac * 6.28318 * s.twinkleFreq + s.twinklePhase);
      var amp = s.tier === 0 ? 0.25 : s.tier === 1 ? 0.15 : 0.08;
      var alpha = Math.max(0, s.baseAlpha + twinkle * amp) * starAlpha;
      if (alpha < 0.01) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgb(' + s.r + ',' + s.g + ',' + s.b + ')';
      if (s.tier === 0) {
        // Bright stars: soft glow
        var r = s.size * 1.5;
        var grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r + 2);
        grad.addColorStop(0, 'rgba(' + s.r + ',' + s.g + ',' + s.b + ',' + alpha.toFixed(3) + ')');
        grad.addColorStop(0.4, 'rgba(' + s.r + ',' + s.g + ',' + s.b + ',' + (alpha * 0.4).toFixed(3) + ')');
        grad.addColorStop(1, 'rgba(' + s.r + ',' + s.g + ',' + s.b + ',0)');
        ctx.fillStyle = grad;
        ctx.fillRect(pos.x - r - 2, pos.y - r - 2, (r + 2) * 2, (r + 2) * 2);
      } else {
        // Medium / dim: simple rectangle
        var sz = s.tier === 1 ? s.size : Math.max(0.5, s.size * 0.7);
        ctx.fillRect(pos.x - sz / 2, pos.y - sz / 2, sz, sz);
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
    ctx.fillText(sunName, pos.x, pos.y + r * 8 + 14);
    ctx.globalAlpha = 1;
  }
}

// ── Moons ──
var _moonTexCache = new Map<string, HTMLCanvasElement>();

function _drawMoons(ctx: CanvasRenderingContext2D, w: number, h: number, scene: SkyScene, lunarSizeMode: string, sunAlt: number) {
  _moonScreenPositions = [];
  var moonDimming = Math.max(0.4, 1 - _smoothstep(-6, 12, sunAlt) * 0.6);

  for (var i = 0; i < scene.moons.length; i++) {
    var moon = scene.moons[i];
    if (moon.category === 'below') continue;
    if (moon.altitudeExact < -3) continue;

    var radiusPx = _moonRadiusPx(moon.angularDiameterDeg, lunarSizeMode, h);
    var pos = _azAltToXY(moon.azimuth, moon.altitudeExact, w, h);

    // Get or generate texture
    var color = moon.color || '#d8dee7';
    var texKey = moon.name + ':' + Math.round(radiusPx);
    var texCv = _moonTexCache.get(texKey);
    if (!texCv) {
      texCv = getMoonTexture(moon.name, color, radiusPx);
      _moonTexCache.set(texKey, texCv);
    }

    ctx.globalAlpha = moonDimming;
    ctx.drawImage(texCv, pos.x - radiusPx, pos.y - radiusPx, radiusPx * 2, radiusPx * 2);

    // Label
    if (moon.altitudeExact >= 2) {
      ctx.globalAlpha = moonDimming * 0.9;
      ctx.fillStyle = 'rgba(247,242,232,0.9)';
      ctx.font = '13px "Trebuchet MS", "Gill Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(moon.name, pos.x, pos.y + radiusPx + 14);
    }
    ctx.globalAlpha = 1;

    // Track screen position for click detection
    _moonScreenPositions.push({
      name: moon.name,
      x: pos.x,
      y: pos.y,
      radius: radiusPx,
      moon: moon
    });
  }
}

// ── Ring of Siberys ──
function _ensureRingSeeds(worldId: string, observerLat: number) {
  var cacheKey = worldId + ':' + observerLat;
  if (cacheKey === _ringCacheKey) return;
  _ringCacheKey = cacheKey;
  _ringParticleSeeds = [];
  if (worldId !== 'eberron') return;

  var DRIFT_INNER = 1666;
  var DRIFT_OUTER = 895;
  var particleCount = 400;
  for (var s = 0; s < particleCount; s++) {
    var bandFrac = _hash('sib:band:' + s);
    var density = bandFrac < 0.04 ? 0.1 : bandFrac < 0.22 ? 0.4 : bandFrac < 0.56 ? 1.0 : bandFrac < 0.62 ? 0.03 : bandFrac < 0.82 ? 0.7 : bandFrac < 0.84 ? 0.03 : bandFrac < 0.92 ? 0.55 : bandFrac < 0.96 ? 0.0 : 0.2;
    if (_hash('sib:keep:' + s) > density) continue;

    _ringParticleSeeds.push({
      bandFrac,
      baseAngle: _hash('sib:angle:' + s) * 360,
      driftRate: DRIFT_INNER - bandFrac * (DRIFT_INNER - DRIFT_OUTER),
      shimmerFreq: 0.3 + _hash('sib:freq:' + s) * 1.2,
      shimmerPhase: _hash('sib:phase:' + s) * Math.PI * 2,
      bandBright: bandFrac < 0.22 ? 0.4 : (bandFrac < 0.56 ? 1.0 : 0.7),
      size: 1.5 + _hash('sib:size:' + s) * 2.5
    });
  }
}

function _drawRing(ctx: CanvasRenderingContext2D, w: number, h: number, worldId: string, observerLat: number, serial: number, timeFrac: number, sunAlt: number) {
  if (worldId !== 'eberron') return;
  _ensureRingSeeds(worldId, observerLat);

  var ringAlpha = Math.max(0.15, 1 - _smoothstep(-12, 6, sunAlt));
  if (ringAlpha < 0.01) return;
  var driftTime = serial + timeFrac;

  // Ring band — draw as an arc band across the sky.
  // The ring lies in the equatorial plane; from observer latitude it appears
  // as a band tilted by (90 - lat)° from the horizon.  We project individual
  // particles rather than trying to draw a full torus, which keeps the code
  // simple and matches the Three.js version's visual fidelity.
  var latRad = observerLat * DEG2RAD;

  for (var i = 0; i < _ringParticleSeeds.length; i++) {
    var seed = _ringParticleSeeds[i];
    var angle = ((seed.baseAngle + (driftTime / seed.driftRate) * 360) % 360 + 360) % 360;
    var angleRad = angle * DEG2RAD;

    // Particle in equatorial-ring local coords (flat ring in XZ plane)
    // Inner radius 80, outer radius 140 in the original — normalise to angular position
    var innerR = 15;  // degrees inner radius on sky
    var outerR = 35;  // degrees outer radius on sky
    var pRadius = innerR + seed.bandFrac * (outerR - innerR);

    // Project ring particle: treat as point on a circle tilted by latitude
    var ringX = Math.cos(angleRad) * pRadius;
    var ringZ = Math.sin(angleRad) * pRadius;
    // Tilt by latitude — ring is equatorial, viewer tilts it
    var alt = ringZ * Math.cos(latRad) + 45;  // offset to mid-sky
    var azOffset = ringX;
    var az = 200 + azOffset;  // centre ring slightly west of south

    if (alt < 0 || alt > PANO_ALT_MAX) continue;
    var pos = _azAltToXY(az, alt, w, h);

    // Shimmer
    var shimmer = 0.6 + 0.4 * Math.sin(timeFrac * 6.28 * seed.shimmerFreq + seed.shimmerPhase);
    var alpha = ringAlpha * seed.bandBright * shimmer * 0.6;
    if (alpha < 0.01) continue;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffedB2';
    ctx.fillRect(pos.x - seed.size / 2, pos.y - seed.size / 2, seed.size, seed.size);
  }

  // Ring label
  var labelPos = _azAltToXY(200, 45, w, h);
  ctx.globalAlpha = ringAlpha * 0.8;
  ctx.fillStyle = 'rgba(255,235,191,0.8)';
  ctx.font = '12px "Trebuchet MS", "Gill Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Ring of Siberys', labelPos.x, labelPos.y - 20);
  ctx.globalAlpha = 1;
}

// ── Landscape ──
function _drawLandscape(ctx: CanvasRenderingContext2D, w: number, h: number, sunAlt: number) {
  var skyH = h * (1 - LAND_FRAC);

  // Day/night ridge colours
  var dayFade = _smoothstep(-6, 12, sunAlt);
  var ridges = [
    { nightColor: [8, 12, 22], dayColor: [14, 24, 32], yScale: 0.7, seed: 1 },
    { nightColor: [6, 10, 18], dayColor: [10, 20, 24], yScale: 0.5, seed: 2 },
    { nightColor: [4, 8, 16], dayColor: [8, 14, 20], yScale: 0.35, seed: 3 }
  ];

  for (var ri = ridges.length - 1; ri >= 0; ri--) {
    var ridge = ridges[ri];
    var col = _lerpRgb(ridge.nightColor, ridge.dayColor, dayFade);
    ctx.fillStyle = _rgbStr(col);
    ctx.beginPath();
    ctx.moveTo(0, h);
    var segments = 200;
    for (var si = 0; si <= segments; si++) {
      var t = si / segments;
      var x = t * w;
      var s1 = Math.sin(t * Math.PI * 2.3 * (ridge.seed + 0.5) + ridge.seed) * 0.4;
      var s2 = Math.sin(t * Math.PI * 4.7 * ridge.seed + 1.2) * 0.25;
      var s3 = Math.sin(t * Math.PI * 7.1 + 2.8 * ridge.seed) * 0.12;
      var peakH = (s1 + s2 + s3) * 15 * ridge.yScale;
      var y = skyH - peakH;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  // Ground fill below ridges
  var groundCol = _lerpRgb([4, 8, 16], [8, 14, 20], dayFade);
  ctx.fillStyle = _rgbStr(groundCol);
  ctx.fillRect(0, skyH + 2, w, h - skyH);
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
        az: _hash('cloud:' + layer + ':' + b + ':x') * 360,
        alt: baseAlt + (_hash('cloud:' + layer + ':' + b + ':y') - 0.5) * 10,
        rx: 30 + _hash('cloud:' + layer + ':' + b + ':rx') * 40,
        ry: 8 + _hash('cloud:' + layer + ':' + b + ':rx') * 12,
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

    var grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, c.rx);
    grad.addColorStop(0, 'rgba(' + cloudR + ',' + cloudG + ',' + cloudB + ',' + alpha + ')');
    grad.addColorStop(0.5, 'rgba(' + cloudR + ',' + cloudG + ',' + cloudB + ',' + (alpha * 0.4) + ')');
    grad.addColorStop(1, 'rgba(' + cloudR + ',' + cloudG + ',' + cloudB + ',0)');
    ctx.fillStyle = grad;
    ctx.fillRect(pos.x - c.rx, pos.y - c.ry, c.rx * 2, c.ry * 2);
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
  var w = _canvas.width;
  var h = _canvas.height;
  var ctx = _ctx;

  // Clear
  ctx.clearRect(0, 0, w, h);

  // 1. Sky gradient background
  _drawSkyGradient(ctx, w, h, sunAlt, sunAz);

  // 2. Stars and Milky Way (behind everything else)
  _drawStars(ctx, w, h, sunAlt, timeFrac, worldId);

  // 3. Ring of Siberys (Eberron only)
  _drawRing(ctx, w, h, worldId, scene.observerLatitude, serial, timeFrac, sunAlt);

  // 4. Clouds
  _drawClouds(ctx, w, h, timeFrac, sunAlt);

  // 5. Sun
  _drawSun(ctx, w, h, sunAlt, sunAz, lunarSizeMode, scene.sunName);

  // 6. Moons
  _drawMoons(ctx, w, h, scene, lunarSizeMode, sunAlt);

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

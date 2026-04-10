// Canvas 2D panoramic sky renderer — no WebGL / Three.js dependency.
// Renders a south-facing panoramic sky view (East to West) onto a plain <canvas>.
import { getMoonTexture, generateStarField, generateMilkyWay, StarData, MilkyWayParticle } from './sky-textures.js';
import type { SkyScene, SkySceneMoon } from '../src/showcase/sky-scene.js';
import { EBERRON_CONSTELLATIONS, GREYHAWK_CONSTELLATIONS, constellationCentroid } from './constellations.js';
import type { Constellation, ConstellationStar } from './constellations.js';

// ── Constants ──
// Mutable — switched by setViewMode()
var SKY_AZ_MIN = 81;
var SKY_AZ_MAX = 279;
var SKY_AZ_RANGE = 198;
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

// Constellation projected positions (rebuilt each frame)
var _constellationScreenData: {
  name: string;
  domain: string;
  stars: { x: number; y: number; bright: boolean; visible: boolean }[];
  lines: [number, number][];
  labelX: number;
  labelY: number;
  visible: boolean;
}[] = [];

// Shooting star state
var _shootingStar: { x: number; y: number; dx: number; dy: number; life: number; maxLife: number } | null = null;
var _lastShootingStarTime = 0;

// Which constellation is currently hovered (index in EBERRON_CONSTELLATIONS); -1 = none
var _hoveredConstellationIndex = -1;

// Moon screen positions (for click/hover detection)
var _moonScreenPositions: { name: string; x: number; y: number; radius: number; moon: any }[] = [];

// ── Coordinate helpers ──
// Convert (azimuth°, altitude°) → canvas (x, y).
// Azimuth 90 = E (left edge), 180 = S (centre), 270 = W (right edge).
function _azAltToXY(azDeg: number, altDeg: number, w: number, h: number): { x: number; y: number } {
  var skyH = h * (1 - 0.12);
  var az = ((azDeg - SKY_AZ_MIN) % 360 + 360) % 360;
  var x = (az / SKY_AZ_RANGE) * w;
  // No clamping — let objects exit the viewport naturally.
  // Negative y = above canvas (clipped by canvas), y > skyH = below horizon (behind landscape).
  var y = skyH * (1 - altDeg / PANO_ALT_MAX);
  return { x, y };
}

function _snapHalf(v: number): number { return Math.round(v * 2) / 2; }
function _snapInt(v: number): number { return Math.round(v); }

function _smoothstep(edge0: number, edge1: number, x: number): number {
  var t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function _moonRadiusPx(angularDiameterDeg: number, mode: string, canvasH: number): number {
  if (mode === 'true') {
    var skyH = canvasH * (1 - 0.12);
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
  var dpr = Math.min(window.devicePixelRatio || 1, 3);
  _logicalW = canvas.clientWidth || canvas.width;
  _logicalH = canvas.clientHeight || canvas.height;
  // Minimum backing resolution: 2100×1050 prevents upscale fuzz on small viewports
  var backingW = Math.max(2100, _logicalW * dpr);
  var backingH = Math.max(1050, _logicalH * dpr);
  var effectiveScale = backingW / _logicalW;
  canvas.width = backingW;
  canvas.height = backingH;
  canvas.style.width = _logicalW + 'px';
  canvas.style.height = _logicalH + 'px';
  _ctx = canvas.getContext('2d')!;
  _ctx.scale(effectiveScale, effectiveScale);
  _initCloudSeeds();
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function() {
      if (!_canvas) return;
      var d = Math.min(window.devicePixelRatio || 1, 3);
      var newW = _canvas.clientWidth || 1120;
      var newH = _canvas.clientHeight || 630;
      if (newW === _logicalW && newH === _logicalH) return;
      _logicalW = newW;
      _logicalH = newH;
      var bW = Math.max(2100, _logicalW * d);
      var bH = Math.max(1050, _logicalH * d);
      var s = bW / _logicalW;
      _canvas.width = bW;
      _canvas.height = bH;
      _ctx = _canvas.getContext('2d')!;
      _ctx.scale(s, s);
    }).observe(canvas);
  }
}

// ── Sky background ──
function _drawSkyGradient(ctx: CanvasRenderingContext2D, w: number, h: number, sunAlt: number, sunAz: number) {
  var skyH = h * (1 - 0.12);
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
  var skyH = h * (1 - 0.12);
  var latRad = observerLat * DEG2RAD;
  var haOffset = timeFrac * 360;

  // ── Atmospheric extinction: objects near horizon are dimmer and redder ──
  function _extinction(altDeg: number): { dimming: number; redShift: number } {
    var t = _smoothstep(0, 25, altDeg); // 0 at horizon, 1 above 25°
    return { dimming: 0.3 + 0.7 * t, redShift: 1 - t }; // dimming: 30%-100%, redShift: 1 at horizon, 0 overhead
  }

  function _applyRedShift(r: number, g: number, b: number, shift: number): [number, number, number] {
    return [
      Math.min(255, r + shift * 40),
      Math.max(0, g - shift * 20),
      Math.max(0, b - shift * 40)
    ];
  }

  // ── Constellation stars (tier 0) — Eberron only ──
  var constellations = worldId === 'eberron' ? EBERRON_CONSTELLATIONS
                     : worldId === 'greyhawk' ? GREYHAWK_CONSTELLATIONS
                     : [];
  _constellationScreenData = [];

  for (var ci = 0; ci < constellations.length; ci++) {
    var constellation = constellations[ci];
    var screenStars: { x: number; y: number; bright: boolean; visible: boolean }[] = [];
    var anyVisible = false;

    for (var si = 0; si < constellation.stars.length; si++) {
      var star = constellation.stars[si];
      var hz = _celestialToHorizon(star.ra, star.dec, latRad, haOffset);
      if (!hz) {
        screenStars.push({ x: 0, y: 0, bright: star.bright, visible: false });
        continue;
      }
      var azNorm = ((hz.az - SKY_AZ_MIN) % 360 + 360) % 360;
      if (azNorm > SKY_AZ_RANGE + 5) {
        screenStars.push({ x: 0, y: 0, bright: star.bright, visible: false });
        continue;
      }
      var pos = _azAltToXY(hz.az, hz.alt, w, h);
      if (pos.y > skyH) {
        screenStars.push({ x: 0, y: 0, bright: star.bright, visible: false });
        continue;
      }
      var ext = _extinction(hz.alt);
      var tint = constellation.tint;
      var shifted = _applyRedShift(tint[0], tint[1], tint[2], ext.redShift);
      var sx = _snapHalf(pos.x);
      var sy = _snapHalf(pos.y);
      screenStars.push({ x: sx, y: sy, bright: star.bright, visible: true });
      anyVisible = true;

      var baseSize = star.bright ? 2.2 : 1.4;
      var baseA = (star.bright ? 0.85 : 0.6) * starAlpha * ext.dimming;
      // Very slow, low-amplitude twinkle — constellation stars are steady
      var twinkle = Math.sin(timeFrac * 2 * Math.PI * 1.5 + _hash('ctwinkle:' + ci + ':' + si) * Math.PI * 2);
      baseA *= (1 + twinkle * 0.05);

      if (baseA < 0.01) continue;

      // Star dot
      ctx.globalAlpha = baseA;
      ctx.fillStyle = 'rgb(' + Math.round(shifted[0]) + ',' + Math.round(shifted[1]) + ',' + Math.round(shifted[2]) + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, baseSize, 0, Math.PI * 2);
      ctx.fill();

      // Halo
      var haloR = baseSize * 4;
      var haloGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloR);
      haloGrad.addColorStop(0, 'rgba(' + Math.round(shifted[0]) + ',' + Math.round(shifted[1]) + ',' + Math.round(shifted[2]) + ',' + (baseA * 0.3) + ')');
      haloGrad.addColorStop(0.3, 'rgba(' + Math.round(shifted[0]) + ',' + Math.round(shifted[1]) + ',' + Math.round(shifted[2]) + ',' + (baseA * 0.12) + ')');
      haloGrad.addColorStop(0.6, 'rgba(' + Math.round(shifted[0]) + ',' + Math.round(shifted[1]) + ',' + Math.round(shifted[2]) + ',' + (baseA * 0.03) + ')');
      haloGrad.addColorStop(1, 'rgba(' + Math.round(shifted[0]) + ',' + Math.round(shifted[1]) + ',' + Math.round(shifted[2]) + ',0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
      ctx.fill();

      // Diffraction cross on bright/alpha stars
      if (star.bright) {
        var crossLen = baseSize * 3;
        var crossA = baseA * 0.25;
        ctx.strokeStyle = 'rgba(' + Math.round(shifted[0]) + ',' + Math.round(shifted[1]) + ',' + Math.round(shifted[2]) + ',' + crossA + ')';
        ctx.lineWidth = 0.8;
        var ix = _snapInt(sx);
        var iy = _snapInt(sy);
        ctx.beginPath();
        ctx.moveTo(ix - crossLen, iy); ctx.lineTo(ix + crossLen, iy);
        ctx.moveTo(ix, iy - crossLen); ctx.lineTo(ix, iy + crossLen);
        ctx.stroke();
      }
    }

    // Constellation label position
    var centroid = constellationCentroid(constellation);
    var chz = _celestialToHorizon(centroid.ra, centroid.dec, latRad, haOffset);
    var labelX = 0, labelY = 0, labelVisible = false;
    if (chz) {
      var cazNorm = ((chz.az - SKY_AZ_MIN) % 360 + 360) % 360;
      if (cazNorm <= SKY_AZ_RANGE + 5) {
        var lPos = _azAltToXY(chz.az, chz.alt, w, h);
        if (lPos.y <= skyH) {
          labelX = lPos.x;
          labelY = lPos.y;
          labelVisible = true;
        }
      }
    }

    // Draw label (always visible when constellation is above horizon)
    if (labelVisible && anyVisible) {
      ctx.globalAlpha = starAlpha * 0.55;
      ctx.fillStyle = 'rgba(' + constellation.tint[0] + ',' + constellation.tint[1] + ',' + constellation.tint[2] + ',0.8)';
      ctx.font = '11px "Trebuchet MS", "Gill Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(constellation.name, labelX, labelY + 4);
    }

    _constellationScreenData.push({
      name: constellation.name,
      domain: constellation.domain,
      stars: screenStars,
      lines: constellation.lines,
      labelX: labelX,
      labelY: labelY,
      visible: anyVisible && labelVisible
    });
  }

  // ── Milky Way (non-Eberron only) ──
  if (_milkyWayData && worldId !== 'eberron') {
    for (var mi = 0; mi < _milkyWayData.length; mi++) {
      var mp = _milkyWayData[mi];
      var mhz = _celestialToHorizon(mp.az, mp.alt, latRad, haOffset);
      if (!mhz) continue;
      var mAzNorm = ((mhz.az - SKY_AZ_MIN) % 360 + 360) % 360;
      if (mAzNorm > SKY_AZ_RANGE + 5) continue;
      var mpos = _azAltToXY(mhz.az, mhz.alt, w, h);
      if (mpos.y > skyH) continue;
      var mwA = mp.alpha * 0.3 * starAlpha;
      if (mwA < 0.005) continue;
      ctx.globalAlpha = mwA;
      ctx.fillStyle = 'rgb(219,214,199)';
      var sz = mp.size * 1.5;
      ctx.fillRect(mpos.x - sz / 2, mpos.y - sz / 2, sz, sz);
    }
  }

  // ── Field stars (tiers 1 and 2) ──
  if (_starData) {
    for (var i = 0; i < _starData.length; i++) {
      var s = _starData[i];
      var shz = _celestialToHorizon(s.az, s.alt, latRad, haOffset);
      if (!shz) continue;
      var sAzNorm = ((shz.az - SKY_AZ_MIN) % 360 + 360) % 360;
      if (sAzNorm > SKY_AZ_RANGE + 5) continue;
      var spos = _azAltToXY(shz.az, shz.alt, w, h);
      if (spos.y > skyH) continue;
      var sExt = _extinction(shz.alt);
      // Altitude-dependent twinkle: more aggressive near horizon
      var horizonBoost = 1 + (1 - _smoothstep(0, 15, shz.alt)) * 1.5;
      var twinkleVal = Math.sin(timeFrac * 6.28318 * s.twinkleFreq + s.twinklePhase);
      var amp = s.tier === 1 ? 0.15 : 0.1;
      var alpha = Math.max(0, s.baseAlpha + twinkleVal * amp * horizonBoost) * starAlpha * sExt.dimming;
      if (alpha < 0.01) continue;
      var sShifted = _applyRedShift(s.r, s.g, s.b, sExt.redShift);
      var fsx = _snapHalf(spos.x);
      var fsy = _snapHalf(spos.y);
      ctx.globalAlpha = alpha;
      if (s.tier === 1) {
        // Bright field: circle + soft halo
        ctx.fillStyle = 'rgba(' + Math.round(sShifted[0]) + ',' + Math.round(sShifted[1]) + ',' + Math.round(sShifted[2]) + ',' + alpha + ')';
        ctx.beginPath();
        ctx.arc(fsx, fsy, s.size, 0, Math.PI * 2);
        ctx.fill();
        var fhalo = ctx.createRadialGradient(fsx, fsy, 0, fsx, fsy, s.size * 3);
        fhalo.addColorStop(0, 'rgba(' + Math.round(sShifted[0]) + ',' + Math.round(sShifted[1]) + ',' + Math.round(sShifted[2]) + ',' + (alpha * 0.12) + ')');
        fhalo.addColorStop(1, 'rgba(' + Math.round(sShifted[0]) + ',' + Math.round(sShifted[1]) + ',' + Math.round(sShifted[2]) + ',0)');
        ctx.fillStyle = fhalo;
        ctx.beginPath();
        ctx.arc(fsx, fsy, s.size * 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Dim field: small circle (not rectangle — rectangles alias badly)
        ctx.beginPath();
        ctx.arc(fsx, fsy, Math.max(0.4, s.size), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + Math.round(sShifted[0]) + ',' + Math.round(sShifted[1]) + ',' + Math.round(sShifted[2]) + ',' + alpha + ')';
        ctx.fill();
      }
    }
  }

  // ── Shooting stars (dragonshard fragments from the Ring) ──
  if (worldId === 'eberron' && sunAlt < -6) {
    _updateShootingStar(ctx, w, skyH, starAlpha, timeFrac);
  }

  ctx.globalAlpha = 1;
}

function _updateShootingStar(ctx: CanvasRenderingContext2D, w: number, skyH: number, starAlpha: number, timeFrac: number) {
  // Spawn check: roughly every 40-80 seconds of real time (not game time)
  // Use performance.now() for wall-clock timing
  var wallNow = typeof performance !== 'undefined' ? performance.now() / 1000 : 0;
  if (!_shootingStar && wallNow - _lastShootingStarTime > 40 + Math.random() * 40) {
    _lastShootingStarTime = wallNow;
    var startX = Math.random() * w;
    var startY = Math.random() * skyH * 0.7;
    var angle = (Math.random() * 60 + 60) * DEG2RAD; // 60-120° from horizontal
    var speed = 4 + Math.random() * 6;
    _shootingStar = {
      x: startX, y: startY,
      dx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      dy: Math.sin(angle) * speed,
      life: 0, maxLife: 8 + Math.random() * 6  // 8-14 frames
    };
  }
  if (_shootingStar) {
    var ss = _shootingStar;
    var progress = ss.life / ss.maxLife;
    var fadeIn = Math.min(1, ss.life / 2);
    var fadeOut = Math.max(0, 1 - (ss.life - ss.maxLife + 3) / 3);
    var alpha = fadeIn * fadeOut * starAlpha * 0.9;
    if (alpha > 0.01) {
      var tailLen = 15 + progress * 20;
      var grad = ctx.createLinearGradient(
        ss.x, ss.y,
        ss.x - ss.dx * tailLen / Math.hypot(ss.dx, ss.dy),
        ss.y - ss.dy * tailLen / Math.hypot(ss.dx, ss.dy)
      );
      grad.addColorStop(0, 'rgba(255, 245, 200, ' + alpha + ')');
      grad.addColorStop(1, 'rgba(255, 237, 178, 0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(
        ss.x - ss.dx * tailLen / Math.hypot(ss.dx, ss.dy),
        ss.y - ss.dy * tailLen / Math.hypot(ss.dx, ss.dy)
      );
      ctx.stroke();
    }
    ss.x += ss.dx;
    ss.y += ss.dy;
    ss.life++;
    if (ss.life >= ss.maxLife || ss.x < -20 || ss.x > w + 20 || ss.y > skyH || ss.y < -20) {
      _shootingStar = null;
    }
  }
}

function _drawConstellationLines(ctx: CanvasRenderingContext2D, hoveredIndex: number, starAlpha: number): void {
  if (hoveredIndex < 0 || hoveredIndex >= _constellationScreenData.length) return;
  var cd = _constellationScreenData[hoveredIndex];
  if (!cd.visible) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(232, 203, 118, 0.55)'; // warm gold matching Ring of Siberys
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = starAlpha * 0.85;
  for (var li = 0; li < cd.lines.length; li++) {
    var a = cd.stars[cd.lines[li][0]];
    var b = cd.stars[cd.lines[li][1]];
    if (!a.visible || !b.visible) continue;
    ctx.beginPath();
    ctx.moveTo(_snapInt(a.x), _snapInt(a.y));
    ctx.lineTo(_snapInt(b.x), _snapInt(b.y));
    ctx.stroke();
  }
  ctx.restore();
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

  // Parse color to RGB for proper transparent feathering
  var cv = parseInt(color.replace('#', ''), 16);
  var cR = (cv >> 16) & 255, cG = (cv >> 8) & 255, cB = cv & 255;

  // Atmospheric glow halo — feather to transparent moon-color (NOT transparent black)
  var glowAlpha = Math.max(0.04, Math.min(0.18, 0.05 + albedoScale * 0.04)) * (isBarrakas ? 2.2 : 1);
  var glowGrad = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
  glowGrad.addColorStop(0, 'rgba(' + cR + ',' + cG + ',' + cB + ',1)');
  glowGrad.addColorStop(0.3, 'rgba(' + cR + ',' + cG + ',' + cB + ',0.6)');
  glowGrad.addColorStop(1, 'rgba(' + cR + ',' + cG + ',' + cB + ',0)');
  ctx.save();
  ctx.globalAlpha = glowAlpha;
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();
  // Second wider pass for faint outer haze
  var outerGlow = ctx.createRadialGradient(x, y, glowRadius * 0.3, x, y, glowRadius * 1.6);
  outerGlow.addColorStop(0, 'rgba(' + cR + ',' + cG + ',' + cB + ',0.4)');
  outerGlow.addColorStop(1, 'rgba(' + cR + ',' + cG + ',' + cB + ',0)');
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
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.translate(x, y);
    ctx.rotate(timeFrac * Math.PI * 0.3);
    ctx.drawImage(tex, -radius, -radius, radius * 2, radius * 2);
    ctx.restore();
    // Re-apply the moon circle clip for the phase shadow below.
    // We are back in the outer save/restore, so the DPR transform is intact.
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
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
    // Atmospheric extinction
    var moonExt = _smoothstep(0, 25, moon.altitudeExact);
    var moonExtDimming = 0.55 + 0.45 * moonExt;
    var color = moon.color || '#d8dee7';

    ctx.save();
    ctx.globalAlpha = moonDimming * moonExtDimming;
    _drawMoonDisk(ctx, pos.x, pos.y, radiusPx, color, moon.phase, !!moon.retrograde, Number(moon.albedo || 0.12), moon.name, timeFrac);
    ctx.restore();

    // Label
    if (moon.altitudeExact >= 2) {
      ctx.globalAlpha = moonDimming * 0.9;
      ctx.fillStyle = 'rgba(247,242,232,0.9)';
      ctx.font = '13px "Trebuchet MS", "Gill Sans", sans-serif';
      ctx.textAlign = 'center';
      // Flip label above moon when near horizon to avoid landscape overlap
      var labelOffset = moon.altitudeExact < 12 ? -(radiusPx + 14) : (radiusPx + 14);
      ctx.fillText(moon.name, pos.x, pos.y + labelOffset);
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
    if (altDeg < -halfWidthDeg - 5) continue; // skip only if well below horizon

    var azRaw = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat));
    var azDeg = ((azRaw / DEG2RAD) + 180 + 360) % 360;

    // No clamping — let all three tracks go below the horizon.
    // The landscape silhouette (drawn later in the pipeline) covers anything below the horizon line,
    // so the ring fades into the ground naturally instead of fanning into a skirt shape.
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
    if (pAltDeg < -halfWidthDeg - 5) continue;
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

// ── Landscape dispatcher ──
// ── Landscape: farmstead ──
function _drawLandscape(ctx: CanvasRenderingContext2D, w: number, h: number, sunAlt: number) {
  var skyH = h * (1 - 0.12);
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
  for (var layer = 0; layer < 2; layer++) {
    var numBlobs = 6 + layer * 2;
    var baseAlt = 15 + layer * 20;
    var speed = 0.015 + layer * 0.008;
    for (var b = 0; b < numBlobs; b++) {
      _cloudSeeds.push({
        az: SKY_AZ_MIN + _hash('cloud:' + layer + ':' + b + ':x') * SKY_AZ_RANGE,
        alt: baseAlt + (_hash('cloud:' + layer + ':' + b + ':y') - 0.5) * 12,
        rx: 50 + _hash('cloud:' + layer + ':' + b + ':rx') * 60,
        ry: 25 + _hash('cloud:' + layer + ':' + b + ':rx') * 35,
        alpha: 0.008 + _hash('cloud:' + layer + ':' + b + ':a') * 0.022,
        speed: speed * (0.7 + _hash('cloud:' + layer + ':' + b + ':x') * 0.6)
      });
    }
  }
}

function _drawRingWash(ctx: CanvasRenderingContext2D, w: number, h: number, observerLatDeg: number, alpha: number) {
  var lat = observerLatDeg * DEG2RAD;
  var skyH = h * (1 - 0.12);
  var steps = 60;
  ctx.save();
  for (var i = 0; i <= steps; i++) {
    var H = (-180 + 360 * i / steps) * DEG2RAD;
    var sinAlt = Math.cos(lat) * Math.cos(H);
    var altDeg = Math.asin(Math.max(-1, Math.min(1, sinAlt))) / DEG2RAD;
    if (altDeg < 0) continue;
    var azRaw = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat));
    var azDeg = ((azRaw / DEG2RAD) + 180 + 360) % 360;
    var pos = _azAltToXY(azDeg, altDeg, w, h);
    var grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 35);
    grad.addColorStop(0, 'rgba(232,203,118,' + alpha + ')');
    grad.addColorStop(1, 'rgba(232,203,118,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(pos.x - 35, pos.y - 35, 70, 70);
  }
  ctx.restore();
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

  // 1.5. Ring of Siberys sky wash (Eberron only, night)
  if (worldId === 'eberron') {
    var washAlpha = (1 - _smoothstep(-6, 6, sunAlt)) * 0.035;
    if (washAlpha > 0.002) {
      _drawRingWash(ctx, w, h, scene.observerLatitude, washAlpha);
    }
  }

  // 2. Stars and Milky Way (behind everything else)
  _drawStars(ctx, w, h, sunAlt, timeFrac, worldId, scene.observerLatitude);

  // 2.5. Constellation connecting lines (if hovered)
  var starAlphaForLines = 1 - _smoothstep(-12, 6, sunAlt);
  if (starAlphaForLines > 0.01) {
    _drawConstellationLines(ctx, _hoveredConstellationIndex, starAlphaForLines);
  }

  // 3. Ring of Siberys (Eberron only)
  if (worldId === 'eberron') {
    var ringAlpha = 1 - _smoothstep(-12, 6, sunAlt);
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

  // 8. Compass labels (only in full-panorama view; in south-facing view
  // the edges are east/west, not north, so the labels would mislead)
  if (SKY_AZ_RANGE === 360) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = 'rgba(200, 210, 230, 0.7)';
    ctx.font = '12px "Trebuchet MS", "Gill Sans", sans-serif';
    ctx.textAlign = 'center';
    var compassY = h * (1 - 0.12) - 8;
    ctx.fillText('N', 0, compassY);              // North at left edge
    ctx.fillText('E', w * 0.25, compassY);        // East at 25%
    ctx.fillText('S', w * 0.5, compassY);         // South at center
    ctx.fillText('W', w * 0.75, compassY);        // West at 75%
    ctx.fillText('N', w, compassY);               // North at right edge
    ctx.restore();
  }
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

// ── Constellation screen data for hover detection ──
export function getConstellationScreenData() {
  return _constellationScreenData;
}

export function setHoveredConstellation(index: number): void {
  _hoveredConstellationIndex = index;
}

// ── View mode (south / panorama) ──
export function setViewMode(mode: string): void {
  if (mode === 'panorama') {
    SKY_AZ_MIN = 0;
    SKY_AZ_MAX = 360;
    SKY_AZ_RANGE = 360;
  } else {
    SKY_AZ_MIN = 81;
    SKY_AZ_MAX = 279;
    SKY_AZ_RANGE = 198;
  }
}

export function getViewMode(): string {
  return SKY_AZ_RANGE === 360 ? 'panorama' : 'south';
}

# Sky Renderer Overhaul — Implementation Plan

This document describes every change needed to fix and improve the GitHub Pages sky preview. Each stage is independent and testable. Implement them in order. Do not skip ahead. Do not refactor unrelated code. Do not rename existing functions unless this document says to.

All line numbers reference the current `main` branch at commit `7a88f9c`.

---

## Stage 1: Equirectangular Projection Fix

**Problem:** The `_azAltToXY` function in `site/sky-renderer.ts` applies cosine-corrected azimuth and a power-curve altitude, creating non-uniform motion (funhouse mirror effect). Objects near zenith bunch together horizontally; objects near the horizon spread apart. Moon arcs speed up and slow down non-uniformly.

**File:** `site/sky-renderer.ts`

**Replace lines 35–48** (the entire `_azAltToXY` function) with:

```typescript
function _azAltToXY(azDeg: number, altDeg: number, w: number, h: number): { x: number; y: number } {
  var skyH = h * (1 - LAND_FRAC);
  var az = ((azDeg - SKY_AZ_MIN) % 360 + 360) % 360;
  var x = (az / SKY_AZ_RANGE) * w;
  var alt = Math.max(0, Math.min(PANO_ALT_MAX, altDeg));
  var y = skyH * (1 - alt / PANO_ALT_MAX);
  return { x, y };
}
```

This is a plain equirectangular (Plate Carrée) projection. Azimuth maps linearly to X, altitude maps linearly to Y. Every degree of angular motion produces the same pixel displacement everywhere on canvas.

**Nothing else changes.** Every element (moons, stars, ring, clouds, sun) calls `_azAltToXY` and inherits the fix automatically.

**Verification:** Play at 1hr/s. Moons should trace smooth, even arcs at constant speed with no bunching near the top or acceleration near the edges.

---

## Stage 2: Ring of Siberys Fixes

**Problem 1:** The ring's celestial equator trace skips all points where center altitude < 0°. Since the ring has a half-width of 6°, the outer edge is still visible when the center dips below the horizon. Skipping creates a vertical cut where the point arrays abruptly end.

**Problem 2:** Drift particles have the same skip issue at line 535.

**Problem 3:** The ring has a minimum alpha of 0.15, making it visible during full daylight. It should fade completely.

**File:** `site/sky-renderer.ts`

### Fix 2a: Ring band horizon clamp

**Replace line 441:**
```typescript
    if (altDeg < 0) continue; // only skip below horizon
```

**With:**
```typescript
    if (altDeg < -halfWidthDeg) continue; // skip only if entirely below horizon
    altDeg = Math.max(0, altDeg); // clamp center to horizon; outer edge still visible
```

This keeps generating points as the center dips below zero, so the band tapers naturally to the horizon instead of being cut off. Points are only skipped when even the outer edge (`altDeg + halfWidthDeg`) would be below zero.

### Fix 2b: Drift particle horizon clamp

**Replace line 535:**
```typescript
    if (pAltDeg < 0) continue;
```

**With:**
```typescript
    if (pAltDeg < -halfWidthDeg) continue;
```

The `halfWidthDeg` variable is in scope here (it's declared at line 433 and the particle loop is inside the same function). Particles near the horizon will render behind the landscape silhouette anyway, so there's no visual downside.

### Fix 2c: Ring daytime alpha floor

**Replace line 785:**
```typescript
    var ringAlpha = Math.max(0.15, 1 - _smoothstep(-12, 6, sunAlt));
```

**With:**
```typescript
    var ringAlpha = 1 - _smoothstep(-12, 6, sunAlt);
```

Remove the `Math.max(0.15, ...)` floor. The ring should fully fade during daytime, like stars do.

**Verification:** Set time to noon — ring should be invisible. Set time to night at Eberron — ring should taper to both horizon edges with no vertical cuts. Drift particles should appear near the horizon edges of the ring.

---

## Stage 3: Smooth Moon Phase Transitions

**Problem:** Moon illumination (phase shadow) snaps once per day because it's computed from the integer day serial instead of the fractional serial that includes time-of-day. The fractional version (`positionPhase`) is already computed but not used for the visual.

**File:** `src/showcase/sky-scene.ts`

In function `buildSkySceneFromResolved`, starting at line 142:

### Fix 3a: pctFull computation

**Replace line 162:**
```typescript
    var pctFull = Math.round((_clamp01(phase.illum || 0)) * 100);
```

**With:**
```typescript
    var pctFull = Math.round((_clamp01(positionPhase.illum || 0)) * 100);
```

### Fix 3b: Phase stored on moon object

**Replace line 181:**
```typescript
      phase: phase,
```

**With:**
```typescript
      phase: positionPhase,
```

### Fix 3c: Label text

**Replace line 184:**
```typescript
      label: moonPhaseEmoji(phase.illum, phase.waxing) + ' ' + moon.name + ' (' + pctFull + '% Full)',
```

**With:**
```typescript
      label: moonPhaseEmoji(positionPhase.illum, positionPhase.waxing) + ' ' + moon.name + ' (' + pctFull + '% Full)',
```

### Fix 3d: Update test

**File:** `test/showcase-sky.test.ts`

The test at lines 36–43 (`'keeps phase stable across time-of-day changes on the same serial'`) currently asserts exact equality of `pctFull` between dawn (6/24) and dusk (18/24). With smooth phases, these will differ slightly (up to ~6% for a fast moon). Replace the exact equality assertions with tolerance checks.

**Replace lines 36–43** with:

```typescript
  it('keeps phase nearly stable across time-of-day changes on the same serial', () => {
    const dawn = buildSkyScene({ worldId: 'gregorian', serial: 120, timeFrac: 6 / 24 });
    const dusk = buildSkyScene({ worldId: 'gregorian', serial: 120, timeFrac: 18 / 24 });
    assertEquals(dawn.moons.length, dusk.moons.length);
    assert(Math.abs(dawn.moons[0].pctFull - dusk.moons[0].pctFull) <= 6,
      'phase should not change drastically within one day (got ' + dawn.moons[0].pctFull + ' vs ' + dusk.moons[0].pctFull + ')');
    assertEquals(dawn.moons[0].phase.waxing, dusk.moons[0].phase.waxing);
    assert(dawn.moons[0].altitudeExact !== dusk.moons[0].altitudeExact, 'position should change with time of day');
  });
```

**Verification:** Play at 30min/s. Moon terminator shadow should slide smoothly rather than clicking once per day. Run `npx tsx --test test/showcase-sky.test.ts` — all tests should pass.

---

## Stage 4: Canvas Resolution and Sharpness

**Problem:** DPR cap of 2 causes fuzz on 3x devices. Small stars render as blurry smears due to sub-pixel antialiasing. No minimum backing resolution means small viewports produce low-res canvases that CSS upscales.

**File:** `site/sky-renderer.ts`

### Fix 4a: DPR cap and minimum backing resolution

**Replace the `initSkyRenderer` function (lines 96–125)** with:

```typescript
export function initSkyRenderer(canvas: HTMLCanvasElement): void {
  _canvas = canvas;
  var dpr = Math.min(window.devicePixelRatio || 1, 3);
  _logicalW = canvas.clientWidth || canvas.width;
  _logicalH = canvas.clientHeight || canvas.height;
  // Minimum backing resolution: 1680×945 prevents upscale fuzz on small viewports
  var backingW = Math.max(1680, _logicalW * dpr);
  var backingH = Math.max(945, _logicalH * dpr);
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
      var bW = Math.max(1680, _logicalW * d);
      var bH = Math.max(945, _logicalH * d);
      var s = bW / _logicalW;
      _canvas.width = bW;
      _canvas.height = bH;
      _ctx = _canvas.getContext('2d')!;
      _ctx.scale(s, s);
    }).observe(canvas);
  }
}
```

Changes: DPR cap raised from 2 to 3. Minimum backing store of 1680×945 (1.5× the base 1120×630). Scale factor derived from actual backing width / logical width so drawing code still works in logical coordinates.

### Fix 4b: Half-pixel snapping helper

**Add this function** immediately after the `_azAltToXY` function:

```typescript
function _snapHalf(v: number): number { return Math.round(v * 2) / 2; }
function _snapInt(v: number): number { return Math.round(v); }
```

These are used by star rendering in Stage 5. `_snapHalf` keeps canvas antialiasing symmetric. `_snapInt` aligns 1px lines to exact pixels for crispness (used for constellation line connections and diffraction crosses).

**Verification:** Open the site on a phone or high-DPI laptop. Stars and moon edges should appear crisper. On a 1x display at a small window size, the canvas should still render at a minimum of 1680px wide backing.

---

## Stage 5: Constellation and Star System

This is the largest stage. It adds Eberron's 11 dragon-god constellations as fixed celestial features and restructures the star rendering into three visually distinct tiers.

### 5a: Create constellation data file

**Create new file:** `site/constellations.ts`

```typescript
// Eberron's 11 constellations — draconic gods placed by the Progenitors.
// Each constellation is a set of stars at fixed celestial coordinates (RA 0-360°, declination -90° to +90°)
// with line connections and a label. Stars on the celestial sphere rotate with the planet.
//
// Holy symbols from published D&D sources were simplified into connect-the-dots patterns.
// No canon defines the actual star patterns, so these are original designs.

export type ConstellationStar = {
  ra: number;       // right ascension in degrees (0-360), like celestial longitude
  dec: number;      // declination in degrees (-90 to +90), like celestial latitude
  bright: boolean;  // true = alpha/anchor star (larger, with diffraction cross)
};

export type Constellation = {
  name: string;
  domain: string;
  stars: ConstellationStar[];
  lines: [number, number][]; // pairs of star indices to connect
  tint: [number, number, number]; // RGB accent color for this constellation's stars
};

// Design constraints:
// - Io near celestial north pole (circumpolar, always visible) — the creator watches everything
// - Bahamut and Tiamat ~180° apart in RA — never visible simultaneously
// - Chronepsis on celestial equator — the Eye peers through the Ring of Siberys
// - Tamara and Falazure roughly opposite — life and death
// - Garyx at low declination — often half below the horizon, fire threatening to rise
// - 5-7 constellations visible at any given time

export var EBERRON_CONSTELLATIONS: Constellation[] = [
  {
    name: 'Io',
    domain: 'Creation & Magic',
    tint: [255, 245, 210],
    // Coiled dragon biting its tail (ouroboros) — largest constellation, near north celestial pole
    stars: [
      { ra: 0,   dec: 68, bright: true },   // 0: head/mouth (alpha)
      { ra: 25,  dec: 72, bright: false },   // 1: upper jaw
      { ra: 345, dec: 64, bright: false },   // 2: lower jaw
      { ra: 50,  dec: 70, bright: false },   // 3: neck
      { ra: 80,  dec: 62, bright: false },   // 4: shoulder
      { ra: 110, dec: 55, bright: false },   // 5: back
      { ra: 140, dec: 52, bright: true },    // 6: mid-body (bright)
      { ra: 175, dec: 55, bright: false },   // 7: haunch
      { ra: 210, dec: 60, bright: false },   // 8: hip
      { ra: 240, dec: 65, bright: false },   // 9: tail curve
      { ra: 270, dec: 68, bright: false },   // 10: tail mid
      { ra: 300, dec: 70, bright: false },   // 11: tail tip
      { ra: 330, dec: 68, bright: false },   // 12: tail end (approaches mouth)
      { ra: 350, dec: 68, bright: false },   // 13: near mouth
    ],
    lines: [[0,1],[1,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,2],[2,0]]
  },
  {
    name: 'Tiamat',
    domain: 'Greed & Chromatic Dragons',
    tint: [255, 210, 200],
    // Five lines fanning from a central star — five dragon heads
    stars: [
      { ra: 90,  dec: 10, bright: true },    // 0: body center (alpha)
      { ra: 75,  dec: 30, bright: false },   // 1: head 1 (leftmost)
      { ra: 82,  dec: 32, bright: true },    // 2: head 2
      { ra: 90,  dec: 35, bright: false },   // 3: head 3 (center)
      { ra: 98,  dec: 32, bright: false },   // 4: head 4
      { ra: 105, dec: 30, bright: true },    // 5: head 5 (rightmost)
      { ra: 80,  dec: 5,  bright: false },   // 6: left wing tip
      { ra: 100, dec: 5,  bright: false },   // 7: right wing tip
      { ra: 85,  dec: 15, bright: false },   // 8: left shoulder
      { ra: 95,  dec: 15, bright: false },   // 9: right shoulder
      { ra: 90,  dec: -2, bright: false },   // 10: tail
      { ra: 90,  dec: -8, bright: false },   // 11: tail tip
    ],
    lines: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,8],[0,9],[8,6],[9,7],[0,10],[10,11]]
  },
  {
    name: 'Bahamut',
    domain: 'Justice & Metallic Dragons',
    tint: [220, 235, 255],
    // Noble dragon in profile with spread wings — ~180° from Tiamat
    stars: [
      { ra: 270, dec: 15, bright: true },    // 0: head (alpha — pole star candidate)
      { ra: 265, dec: 12, bright: false },   // 1: jaw
      { ra: 260, dec: 18, bright: false },   // 2: crown
      { ra: 255, dec: 14, bright: false },   // 3: neck
      { ra: 248, dec: 10, bright: false },   // 4: chest
      { ra: 240, dec: 12, bright: true },    // 5: body center
      { ra: 232, dec: 10, bright: false },   // 6: haunch
      { ra: 225, dec: 5,  bright: false },   // 7: tail start
      { ra: 218, dec: 2,  bright: false },   // 8: tail tip
      { ra: 250, dec: 25, bright: false },   // 9: left wing tip
      { ra: 235, dec: 22, bright: false },   // 10: left wing elbow
      { ra: 250, dec: 2,  bright: false },   // 11: right wing tip (below)
      { ra: 240, dec: 4,  bright: false },   // 12: right wing elbow
    ],
    lines: [[0,1],[0,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[3,9],[9,10],[10,5],[4,11],[11,12],[12,5]]
  },
  {
    name: 'Chronepsis',
    domain: 'Fate, Death & Judgment',
    tint: [200, 200, 220],
    // Unblinking draconic eye — sits on celestial equator, bisected by Ring of Siberys
    stars: [
      { ra: 180, dec: 3,  bright: true },    // 0: pupil center (alpha) — very bright, unblinking
      { ra: 172, dec: 5,  bright: false },   // 1: upper left lid
      { ra: 176, dec: 7,  bright: false },   // 2: upper lid peak
      { ra: 184, dec: 7,  bright: false },   // 3: upper right lid
      { ra: 188, dec: 5,  bright: false },   // 4: outer corner right
      { ra: 188, dec: 1,  bright: false },   // 5: lower right lid
      { ra: 184, dec: -1, bright: false },   // 6: lower lid
      { ra: 176, dec: -1, bright: false },   // 7: lower left lid
      { ra: 172, dec: 1,  bright: false },   // 8: outer corner left
    ],
    lines: [[8,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]]
  },
  {
    name: 'Aasterinian',
    domain: 'Trickery & Invention',
    tint: [255, 240, 200],
    // Grinning dragon head — open jaws
    stars: [
      { ra: 320, dec: 30, bright: true },    // 0: eye (alpha)
      { ra: 325, dec: 35, bright: false },   // 1: brow ridge
      { ra: 315, dec: 32, bright: false },   // 2: snout top
      { ra: 310, dec: 28, bright: false },   // 3: nose tip
      { ra: 312, dec: 24, bright: false },   // 4: upper jaw
      { ra: 318, dec: 22, bright: false },   // 5: jaw hinge
      { ra: 312, dec: 20, bright: false },   // 6: lower jaw
      { ra: 310, dec: 24, bright: false },   // 7: chin
      { ra: 328, dec: 28, bright: false },   // 8: back of head
      { ra: 325, dec: 24, bright: false },   // 9: neck
    ],
    lines: [[1,0],[0,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,3],[0,8],[8,9],[9,5]]
  },
  {
    name: 'Falazure',
    domain: 'Decay & Undeath',
    tint: [180, 195, 220],
    // Angular draconic skull — jagged, menacing. Roughly opposite Tamara.
    stars: [
      { ra: 35,  dec: 15, bright: true },    // 0: left eye socket (alpha)
      { ra: 45,  dec: 15, bright: true },    // 1: right eye socket
      { ra: 40,  dec: 22, bright: false },   // 2: forehead peak
      { ra: 33,  dec: 20, bright: false },   // 3: left temple
      { ra: 47,  dec: 20, bright: false },   // 4: right temple
      { ra: 40,  dec: 10, bright: false },   // 5: nasal ridge
      { ra: 37,  dec: 5,  bright: false },   // 6: left jaw
      { ra: 43,  dec: 5,  bright: false },   // 7: right jaw
      { ra: 40,  dec: 2,  bright: false },   // 8: chin
    ],
    lines: [[3,2],[2,4],[3,0],[0,5],[5,1],[1,4],[0,6],[6,8],[8,7],[7,1]]
  },
  {
    name: 'Garyx',
    domain: 'Fire, Destruction & Renewal',
    tint: [255, 200, 160],
    // Skull with flame rising — low declination, often half below horizon
    stars: [
      { ra: 145, dec: -5, bright: true },    // 0: skull center (alpha)
      { ra: 140, dec: -8, bright: false },   // 1: left jaw
      { ra: 150, dec: -8, bright: false },   // 2: right jaw
      { ra: 138, dec: 0,  bright: false },   // 3: left brow
      { ra: 152, dec: 0,  bright: false },   // 4: right brow
      { ra: 145, dec: 5,  bright: false },   // 5: flame base
      { ra: 142, dec: 12, bright: false },   // 6: left flame
      { ra: 145, dec: 15, bright: true },    // 7: flame peak
      { ra: 148, dec: 12, bright: false },   // 8: right flame
      { ra: 145, dec: -12, bright: false },  // 9: chin
    ],
    lines: [[3,0],[0,4],[3,1],[1,9],[9,2],[2,4],[3,5],[4,5],[5,6],[6,7],[7,8],[8,5]]
  },
  {
    name: 'Hlal',
    domain: 'Humor & Storytelling',
    tint: [245, 240, 225],
    // Open book — two angled lines meeting at a spine
    stars: [
      { ra: 200, dec: 40, bright: true },    // 0: spine center (alpha)
      { ra: 195, dec: 45, bright: false },   // 1: left page top
      { ra: 190, dec: 38, bright: false },   // 2: left page outer
      { ra: 195, dec: 35, bright: false },   // 3: left page bottom
      { ra: 205, dec: 45, bright: false },   // 4: right page top
      { ra: 210, dec: 38, bright: false },   // 5: right page outer
      { ra: 205, dec: 35, bright: false },   // 6: right page bottom
      { ra: 200, dec: 48, bright: false },   // 7: top of spine
    ],
    lines: [[7,1],[1,2],[2,3],[3,0],[7,4],[4,5],[5,6],[6,0]]
  },
  {
    name: 'Lendys',
    domain: 'Balance & Justice',
    tint: [235, 235, 245],
    // Sword balanced on a point — tallest, narrowest constellation
    stars: [
      { ra: 130, dec: 42, bright: true },    // 0: pommel (alpha)
      { ra: 130, dec: 38, bright: false },   // 1: grip
      { ra: 126, dec: 35, bright: false },   // 2: left crossguard
      { ra: 134, dec: 35, bright: false },   // 3: right crossguard
      { ra: 130, dec: 30, bright: false },   // 4: blade mid
      { ra: 130, dec: 22, bright: false },   // 5: blade lower
      { ra: 130, dec: 18, bright: true },    // 6: blade tip / balance point
    ],
    lines: [[0,1],[1,2],[1,3],[1,4],[4,5],[5,6]]
  },
  {
    name: 'Astilabor',
    domain: 'Hoarding & Acquisitiveness',
    tint: [255, 235, 190],
    // Curved claw clutching a bright gem star
    stars: [
      { ra: 60,  dec: 40, bright: true },    // 0: gem center (alpha) — brightest star
      { ra: 55,  dec: 45, bright: false },   // 1: claw tip 1
      { ra: 52,  dec: 40, bright: false },   // 2: claw knuckle 1
      { ra: 54,  dec: 35, bright: false },   // 3: claw base 1
      { ra: 65,  dec: 46, bright: false },   // 4: claw tip 2
      { ra: 67,  dec: 41, bright: false },   // 5: claw knuckle 2
      { ra: 65,  dec: 36, bright: false },   // 6: claw base 2
      { ra: 57,  dec: 48, bright: false },   // 7: claw tip 3
      { ra: 63,  dec: 49, bright: false },   // 8: claw tip 4
      { ra: 60,  dec: 34, bright: false },   // 9: palm
    ],
    lines: [[1,2],[2,3],[3,9],[4,5],[5,6],[6,9],[7,0],[8,0],[9,0]]
  },
  {
    name: 'Tamara',
    domain: 'Life, Light & Mercy',
    tint: [255, 230, 230],
    // Seven-pointed star (heptagram) — clean geometry among organic dragon shapes
    stars: [
      { ra: 220, dec: 28, bright: true },    // 0: top point (alpha)
      { ra: 228, dec: 25, bright: false },   // 1
      { ra: 230, dec: 17, bright: false },   // 2
      { ra: 225, dec: 12, bright: false },   // 3
      { ra: 215, dec: 12, bright: false },   // 4
      { ra: 210, dec: 17, bright: false },   // 5
      { ra: 212, dec: 25, bright: false },   // 6
    ],
    // Heptagram: connect every 3rd point (0→3→6→2→5→1→4→0)
    lines: [[0,3],[3,6],[6,2],[2,5],[5,1],[1,4],[4,0]]
  }
];

// Centroid of a constellation in celestial coordinates — used for label placement.
export function constellationCentroid(c: Constellation): { ra: number; dec: number } {
  var raSum = 0, decSum = 0;
  // Handle RA wraparound: convert to unit vectors, average, convert back
  var xSum = 0, ySum = 0;
  for (var i = 0; i < c.stars.length; i++) {
    var rad = c.stars[i].ra * Math.PI / 180;
    xSum += Math.cos(rad);
    ySum += Math.sin(rad);
    decSum += c.stars[i].dec;
  }
  var avgRa = ((Math.atan2(ySum, xSum) * 180 / Math.PI) + 360) % 360;
  return { ra: avgRa, dec: decSum / c.stars.length };
}
```

### 5b: Replace star generation

**File:** `site/sky-textures.ts`

**Replace the `generateStarField` function** (lines 939–966) with a version that generates only non-constellation field stars:

```typescript
export function generateStarField(width: number, height: number, worldId: string, topMargin: number, bottomMargin: number): StarData[] {
  var altMax = 75;
  var stars: StarData[] = [];
  // Tier distribution: 35 bright field, 315 dim field = 350 total
  // (Constellation stars are handled separately)
  var brightCount = 35;
  var total = 350;

  // Bright field colors: standard stellar distribution
  var brightColors: [number, number, number][] = [
    [200, 220, 255],  // blue-white (40%)
    [255, 250, 240],  // white (30%)
    [255, 235, 200],  // yellow (20%)
    [255, 210, 170],  // orange (10%)
  ];
  var brightWeights = [0.4, 0.7, 0.9, 1.0]; // cumulative

  // Dim field colors: narrow cool range
  var dimColors: [number, number, number][] = [
    [200, 210, 230],
    [190, 200, 225],
    [180, 195, 220],
  ];

  for (var i = 0; i < total; i++) {
    var isBright = i < brightCount;
    var tier = isBright ? 1 : 2; // tier 0 is reserved for constellation stars
    var seed = _h(i + ':star:' + worldId);
    var az = _h('sx:' + i + ':' + worldId) * 360;
    // Cosine-weighted declination for uniform sphere distribution
    var alt = Math.asin(_h('sy:' + i + ':' + worldId)) * (180 / Math.PI);
    alt = Math.abs(alt) * (altMax / 90); // remap to 0..altMax
    var col: [number, number, number];
    if (isBright) {
      var cw = _h('sc:' + i + ':' + worldId);
      var ci = 0;
      while (ci < brightWeights.length - 1 && cw > brightWeights[ci]) ci++;
      col = brightColors[ci];
    } else {
      col = dimColors[Math.floor(_h('sc:' + i + ':' + worldId) * dimColors.length)];
    }
    var size = isBright ? (1.0 + seed * 1.0) : (0.3 + seed * 0.5);
    var baseAlpha = isBright ? (0.3 + seed * 0.35) : (0.08 + seed * 0.18);
    var twinkleFreq = isBright ? (4 + seed * 5) : (6 + seed * 8);
    var twinklePhase = _h('sp:' + i + ':' + worldId) * Math.PI * 2;
    stars.push({ az, alt, size, r: col[0], g: col[1], b: col[2], baseAlpha, twinkleFreq, twinklePhase, tier });
  }
  return stars;
}
```

Key changes: total reduced from 1400 to 350. Tiers renumbered (0 = constellation, 1 = bright field, 2 = dim). Cosine-weighted declination for uniform sphere coverage. Dedicated color palettes per tier.

The `generateMilkyWay` function stays the same but should be **skipped for Eberron** — Eberron has a crystal sphere with no galaxy. The check already exists at line 202 (`if (_milkyWayData && worldId !== 'eberron')`), so no change needed.

### 5c: Overhaul star and constellation rendering

**File:** `site/sky-renderer.ts`

**Add these imports** at the top of the file (after line 2):

```typescript
import { EBERRON_CONSTELLATIONS, constellationCentroid } from './constellations.js';
import type { Constellation, ConstellationStar } from './constellations.js';
```

**Add module-level state** (after the existing `_cloudSeeds` declaration, around line 27):

```typescript
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
```

**Replace the `_drawStars` function** (lines 193–265) with the following. This is a complete rewrite that handles constellation stars, field stars, diffraction crosses, constellation lines/labels, and atmospheric extinction:

```typescript
function _drawStars(ctx: CanvasRenderingContext2D, w: number, h: number, sunAlt: number, timeFrac: number, worldId: string, observerLat: number) {
  var starAlpha = 1 - _smoothstep(-12, 6, sunAlt);
  if (starAlpha < 0.01) return;
  _ensureStars(worldId);
  var skyH = h * (1 - LAND_FRAC);
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
  var constellations = worldId === 'eberron' ? EBERRON_CONSTELLATIONS : [];
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
  var now = timeFrac;
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
```

### 5d: Constellation hover interaction

**File:** `site/main.ts`

**Add this import** at the top of the file alongside the existing sky-renderer imports:

```typescript
import { getConstellationScreenData } from '../site/sky-renderer.js';
```

Wait — the constellation screen data is already a module-level variable in sky-renderer.ts. We need to export a getter. **In `site/sky-renderer.ts`**, add this export at the bottom (after the existing `getMoonScreenPositions` export):

```typescript
export function getConstellationScreenData() {
  return _constellationScreenData;
}
```

Then **in `site/main.ts`**, add the import and find the existing mouse-move handler for the sky canvas (the one that handles moon hover tooltips). Extend it to also check constellation star proximity. The logic:

1. On mousemove over the sky canvas, check distance to each visible constellation star
2. If within 12px of any constellation star, draw that constellation's connecting lines and show a tooltip with "Name — Domain"
3. Store the "hovered constellation index" and re-render connecting lines each frame

**Find the mousemove handler** for the sky canvas. It's the one that sets up `_drawnMoons` hit testing (around lines 233–350). **After the moon hit-test block**, add constellation hit testing:

```typescript
  // Constellation hover
  var constellationData = getConstellationScreenData();
  var hoveredConstellation = -1;
  for (var cdi = 0; cdi < constellationData.length; cdi++) {
    var cd = constellationData[cdi];
    if (!cd.visible) continue;
    for (var csi = 0; csi < cd.stars.length; csi++) {
      var cs = cd.stars[csi];
      if (!cs.visible) continue;
      var cdist = Math.hypot(localX - cs.x, localY - cs.y);
      if (cdist < 12) { hoveredConstellation = cdi; break; }
    }
    if (hoveredConstellation >= 0) break;
  }
```

Store `hoveredConstellation` in module state so the render loop can draw connecting lines.

**Add a new function** to draw constellation connecting lines, called from `renderSkyFrame` between the star drawing and the cloud drawing:

```typescript
export function drawConstellationLines(ctx: CanvasRenderingContext2D, hoveredIndex: number, starAlpha: number): void {
  if (hoveredIndex < 0 || hoveredIndex >= _constellationScreenData.length) return;
  var cd = _constellationScreenData[hoveredIndex];
  if (!cd.visible) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(232, 203, 118, 0.20)'; // warm gold matching Ring of Siberys
  ctx.lineWidth = 1;
  ctx.globalAlpha = starAlpha;
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
```

Export `_snapInt` from sky-renderer.ts, or make `drawConstellationLines` an internal function called from within `renderSkyFrame` using a module-level `_hoveredConstellationIndex` variable that main.ts sets via an exported setter. The latter is cleaner:

```typescript
// In sky-renderer.ts:
var _hoveredConstellationIndex = -1;
export function setHoveredConstellation(index: number): void { _hoveredConstellationIndex = index; }
```

Then call `_drawConstellationLines(ctx, _hoveredConstellationIndex, starAlpha)` from within `renderSkyFrame`, between the stars and clouds steps.

### 5e: Ring ambient sky wash

**In `site/sky-renderer.ts`**, in the `renderSkyFrame` function, **add a new step between step 1 (sky gradient) and step 2 (stars)** — only for Eberron at night:

```typescript
  // 1.5. Ring of Siberys sky wash (Eberron only, night)
  if (worldId === 'eberron') {
    var washAlpha = (1 - _smoothstep(-6, 6, sunAlt)) * 0.035;
    if (washAlpha > 0.002) {
      _drawRingWash(ctx, w, h, scene.observerLatitude, washAlpha);
    }
  }
```

Add the function:

```typescript
function _drawRingWash(ctx: CanvasRenderingContext2D, w: number, h: number, observerLatDeg: number, alpha: number) {
  var lat = observerLatDeg * DEG2RAD;
  var skyH = h * (1 - LAND_FRAC);
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
```

**Verification:** At night in Eberron, constellation names should appear near their star groups. Hovering near a constellation star shows connecting gold lines. Shooting stars should appear occasionally. The sky near the Ring should be very subtly warmer than the rest. Stars near the horizon should be dimmer and redder than stars overhead.

---

## Stage 6: Moon Label and Cloud Refinements

### 6a: Moon labels flip above when near horizon

**File:** `site/sky-renderer.ts`

In `_drawMoons`, find the label drawing block (lines 412–419):

**Replace lines 413–418:**
```typescript
    if (moon.altitudeExact >= 2) {
      ctx.globalAlpha = moonDimming * 0.9;
      ctx.fillStyle = 'rgba(247,242,232,0.9)';
      ctx.font = '13px "Trebuchet MS", "Gill Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(moon.name, pos.x, pos.y + radiusPx + 14);
      ctx.globalAlpha = 1;
    }
```

**With:**
```typescript
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
```

### 6b: Atmospheric extinction on moons

In `_drawMoons`, after computing `pos` from `_azAltToXY` (line 404), add extinction:

```typescript
    // Atmospheric extinction
    var moonExt = _smoothstep(0, 25, moon.altitudeExact);
    var moonExtDimming = 0.3 + 0.7 * moonExt;
```

Then modify the `ctx.globalAlpha` line (409) to include it:

```typescript
    ctx.globalAlpha = moonDimming * moonExtDimming;
```

Note: the `_extinction` helper is local to `_drawStars`. Either extract it to module scope, or just inline the `_smoothstep` call as shown above.

### 6c: Cloud simplification

In `_initCloudSeeds` (line 709), reduce from 3 layers to 2, increase radii, reduce alpha:

**Replace lines 710–726:**
```typescript
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
```

**With:**
```typescript
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
```

Changes: 2 layers instead of 3. Larger radii (50-110px vs 30-70px). Lower alpha cap (max ~0.03 vs ~0.05). Fewer total blobs. Effect: "atmosphere has texture" not "clouds in the way."

---

## Stage 7: Landscape Variants

### 7a: Landscape selector in HTML

**File:** `site/index.html`

Find the `<label>` for "Lunar Size" (lines 61–66). **After it**, add:

```html
            <label>
              <span>Horizon</span>
              <select id="hero-landscape">
                <option value="farmstead" selected>Farmstead</option>
                <option value="forest">Forest</option>
                <option value="village">Village</option>
                <option value="lakeside">Lakeside</option>
                <option value="mountains">Mountains</option>
              </select>
            </label>
```

### 7b: Landscape state and rendering

**File:** `site/sky-renderer.ts`

Make `LAND_FRAC` a variable instead of a constant (since mountains need more space):

```typescript
var _landscapeMode = 'farmstead';
function _landFrac(): number { return _landscapeMode === 'mountains' ? 0.18 : 0.12; }
```

**Replace every reference to `LAND_FRAC`** in the file with `_landFrac()`. There are references in: `_azAltToXY`, `_moonRadiusPx`, `_drawSkyGradient`, `_drawStars` (skyH calculation), `_drawSun`, `_drawMoons`, `_drawClouds`, `_drawLandscape`, and `_drawRingWash`. Search for `LAND_FRAC` and replace all occurrences.

**Add an exported setter:**
```typescript
export function setLandscapeMode(mode: string): void {
  _landscapeMode = mode || 'farmstead';
}
```

**Replace `_drawLandscape`** (lines 577–706) with a dispatcher that calls the appropriate variant:

```typescript
function _drawLandscape(ctx: CanvasRenderingContext2D, w: number, h: number, sunAlt: number) {
  switch (_landscapeMode) {
    case 'forest': _drawForest(ctx, w, h, sunAlt); break;
    case 'village': _drawVillage(ctx, w, h, sunAlt); break;
    case 'lakeside': _drawLakeside(ctx, w, h, sunAlt); break;
    case 'mountains': _drawMountains(ctx, w, h, sunAlt); break;
    default: _drawFarmstead(ctx, w, h, sunAlt); break;
  }
}
```

Then rename the existing `_drawLandscape` body to `_drawFarmstead` and implement the four new variants. Each follows the same pattern: 2-3 layered dark ridges + detail silhouettes. All use the same color scheme (dark blues/blacks keyed to `sunAlt`). Keep them simple — silhouettes only, no lighting, no detail.

**`_drawFarmstead`:** The current code, renamed. No changes to its body.

**`_drawForest`:** Replace the gentle ridges with a dense treeline. Use tall overlapping triangles (conifers) with varied heights and spacing. One gap/path near 40% from left. Three layers: back trees (tall), mid trees (medium), front trees (short). No fence, no farmhouse.

**`_drawVillage`:** Low ridge in back. 4-5 building silhouettes (rectangles with peaked roofs) at varied heights, clustered around 40-60% from left. One tall spire/tower at ~55%. No trees except 2-3 small ones on the edges. Fence remains.

**`_drawLakeside`:** Back ridge similar to farmstead but lower. The horizon line at the center 40% of the width is perfectly flat and slightly lower (water surface). On each side, reeds/cattails (thin vertical lines with oval tops). A small dock silhouette (horizontal platform on two posts) at ~70% from left. No trees in the center section.

**`_drawMountains`:** Jagged peaks replacing all ridges. Back ridge is very tall (uses the increased `_landFrac()` of 0.18). One dominant peak at ~35% from left. A saddle/pass at ~60%. Front ridge is lower but still jagged. No trees, no structures. A few angular boulders near the base.

Each variant is ~40-80 lines of canvas path code. The style matches the existing farmstead: `ctx.beginPath()`, sinusoidal or linear ridge profiles, `ctx.fill()`.

### 7c: Wire up landscape selector

**File:** `site/main.ts`

Add element reference:
```typescript
var landscapeSelect = _must<HTMLSelectElement>('hero-landscape');
```

Add event listener (near the other select listeners):
```typescript
landscapeSelect.addEventListener('change', function(){
  setLandscapeMode(landscapeSelect.value);
  _renderFrame();
});
```

Add to URL state persistence (near the lunarSize param handling):
```typescript
// In state restore:
var landscape = url.searchParams.get('landscape') || 'farmstead';
setLandscapeMode(landscape);
landscapeSelect.value = landscape;

// In URL update:
next.searchParams.set('landscape', landscapeSelect.value);
```

**Verification:** Each landscape option should produce a distinct dark silhouette at the bottom of the canvas. "Mountains" should have a noticeably taller horizon. The sky and all celestial objects should be unaffected by landscape choice.

---

## Summary of all files touched

| File | Changes |
|------|---------|
| `site/sky-renderer.ts` | Projection fix, ring clamp, ring alpha, DPI, half-pixel helpers, constellation rendering, star overhaul, atmospheric extinction, shooting stars, moon label flip, moon extinction, cloud simplification, ring wash, landscape variants, landscape mode state |
| `src/showcase/sky-scene.ts` | Phase smoothing (3 lines) |
| `site/sky-textures.ts` | Replace `generateStarField` (field stars only, new tier numbering, cosine-weighted declination) |
| `site/constellations.ts` | **New file** — 11 Eberron constellation definitions |
| `site/main.ts` | Constellation hover handler, landscape selector wiring, URL state |
| `site/index.html` | Landscape dropdown |
| `site/styles.css` | No changes needed (the label/select styling is inherited from existing controls) |
| `test/showcase-sky.test.ts` | Phase stability test tolerance |

---

## What NOT to change

- Do not touch `src/moon.ts` or any Roll20 script files
- Do not rename any existing exported functions
- Do not change the `SkySceneMoon` type definition (the `phase` field type stays `SkyScenePhase`)
- Do not change the animation loop in `main.ts` (the serial/timeFrac splitting is correct)
- Do not change `_celestialToHorizon` — the spherical trig is correct
- Do not change moon texture generation in `sky-textures.ts`
- Do not add any npm dependencies
- Do not change the build pipeline (`build-site.mjs`)

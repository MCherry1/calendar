# Sky Renderer & Site Fixes — Round 3

Apply all fixes to current `main` branch. Each fix is numbered and independent unless noted.

---

## Fix 1: Add 360°/198° view toggle

**Problem:** The 360° panorama shows objects wrapping across the top in a way that looks like warping. The old ~198° south-facing view was more intuitive for tracking individual moons. Both views are useful — 360° shows all constellations, 198° avoids the wrap effect.

### 1a: Add the toggle to HTML

**File:** `site/index.html`

Find the `<label>` containing `hero-lunar-size` (the "Lunar Size" dropdown). **After that label**, add:

```html
            <label>
              <span>View</span>
              <select id="hero-view-mode">
                <option value="south" selected>South-Facing</option>
                <option value="panorama">Full Panorama</option>
              </select>
            </label>
```

### 1b: Make azimuth range dynamic

**File:** `site/sky-renderer.ts`

**Replace lines 11–13** (the azimuth constants):

```typescript
var SKY_AZ_MIN = 0;
var SKY_AZ_MAX = 360;
var SKY_AZ_RANGE = 360;
```

**With:**

```typescript
// Mutable — switched by setViewMode()
var SKY_AZ_MIN = 81;
var SKY_AZ_MAX = 279;
var SKY_AZ_RANGE = 198;
```

**Add an exported setter** (near the other exported setters like `setLandscapeMode`):

```typescript
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
```

### 1c: Make canvas aspect ratio respond to view mode

**File:** `site/styles.css`

**Replace the `#sky-canvas` rule** with:

```css
#sky-canvas {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: var(--sky-aspect, 16 / 9);
  cursor: default;
  border-radius: 6px;
}
```

**File:** `site/main.ts`

Add import for `setViewMode` and `getViewMode`. Add element ref:

```typescript
var viewModeSelect = _must<HTMLSelectElement>('hero-view-mode');
```

Add event listener:

```typescript
viewModeSelect.addEventListener('change', function(){
  var mode = viewModeSelect.value;
  setViewMode(mode);
  canvas.style.setProperty('--sky-aspect', mode === 'panorama' ? '2 / 1' : '16 / 9');
  _attemptRender(true, true, performance.now());
});
```

Default to south-facing on load. Include in URL state persistence alongside the existing `lunarSize` param.

### 1d: Update compass labels

**In `renderSkyFrame`**, the compass labels should only appear in panorama mode. Wrap the compass label block with:

```typescript
  if (SKY_AZ_RANGE === 360) {
    // compass labels...
  }
```

### 1e: Update scene readout

**Replace the scene view note** with a dynamic version:

```typescript
  var viewLabel = SKY_AZ_RANGE === 360
    ? 'Full panorama. South at center.'
    : 'South-facing view.';
  sceneViewNote.textContent = viewLabel + ' ' + lunarSizeLabel + '.';
```

---

## Fix 2: Ring of Siberys horizon flare

**Problem:** When the ring center dips below the horizon, `Math.max(0, altDeg)` pushes the center and inner points to the horizon line while the outer points remain in the sky, creating a fan/skirt shape.

**File:** `site/sky-renderer.ts`

Find the ring trace loop in `_drawSiberysRing`. **Replace lines 671–680:**

```typescript
    if (altDeg < -halfWidthDeg) continue; // skip only if entirely below horizon
    altDeg = Math.max(0, altDeg); // clamp center to horizon; outer edge still visible

    var azRaw = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat));
    var azDeg = ((azRaw / DEG2RAD) + 180 + 360) % 360;

    centerPts.push(_azAltToXY(azDeg, altDeg, w, h));
    outerPts.push(_azAltToXY(azDeg, altDeg + halfWidthDeg, w, h));
    innerPts.push(_azAltToXY(azDeg, Math.max(0, altDeg - halfWidthDeg), w, h));
```

**With:**

```typescript
    if (altDeg < -halfWidthDeg - 5) continue; // skip only if well below horizon

    var azRaw = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat));
    var azDeg = ((azRaw / DEG2RAD) + 180 + 360) % 360;

    // No clamping — let all three tracks go below the horizon.
    // The landscape silhouette covers anything below the horizon line.
    centerPts.push(_azAltToXY(azDeg, altDeg, w, h));
    outerPts.push(_azAltToXY(azDeg, altDeg + halfWidthDeg, w, h));
    innerPts.push(_azAltToXY(azDeg, altDeg - halfWidthDeg, w, h));
```

The ONLY changes: removed `altDeg = Math.max(0, altDeg)` and removed `Math.max(0, ...)` from the inner point. All three tracks (center, inner, outer) now follow their true altitude. The landscape is drawn AFTER the ring (step 7 vs step 3 in the render pipeline) so it naturally covers any ring drawn below the horizon.

**Also apply the same fix to the drift particle code** in the same function. Find:

```typescript
    if (pAltDeg < -halfWidthDeg) continue;
```

**Replace with:**

```typescript
    if (pAltDeg < -halfWidthDeg - 5) continue;
```

---

## Fix 3: Constellation hover — lines, tooltip, and re-render

Three bugs preventing constellation hover from working.

### 3a: Trigger re-render on hover change

**File:** `site/main.ts`

Find `_updateMoonHoverCursor`. At the end of the function, **after** `setHoveredConstellation(hoveredConstellation)` (line 360) and before the cursor line, add:

```typescript
  // Re-render so constellation lines appear immediately (even when paused)
  _attemptRender(false, false, performance.now());
```

### 3b: Make lines visible

**File:** `site/sky-renderer.ts`

Find `_drawConstellationLines`. **Replace:**

```typescript
  ctx.strokeStyle = 'rgba(232, 203, 118, 0.20)';
  ctx.lineWidth = 1;
  ctx.globalAlpha = starAlpha;
```

**With:**

```typescript
  ctx.strokeStyle = 'rgba(232, 203, 118, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = starAlpha * 0.85;
```

### 3c: Show tooltip on constellation hover

**File:** `site/main.ts`

Find `_updateMoonHoverCursor`. After the constellation hit-test loop and the `setHoveredConstellation(hoveredConstellation)` call, add tooltip logic:

```typescript
  // Show constellation tooltip
  if (!skyTooltip) skyTooltip = document.getElementById('sky-tooltip');
  if (skyTooltip) {
    if (hoveredConstellation >= 0 && !hit) {
      var cd = constellationData[hoveredConstellation];
      skyTooltip.innerHTML = '<strong>' + _esc(cd.name) + '</strong><br>' + _esc(cd.domain);
      skyTooltip.hidden = false;
      skyTooltip.style.left = (e.clientX - rect.left + 12) + 'px';
      skyTooltip.style.top = (e.clientY - rect.top - 10) + 'px';
    } else if (!hit) {
      skyTooltip.hidden = true;
    }
  }
```

This reuses the existing `sky-tooltip` element (same one moons use). Moon hover takes priority — if a moon is hit, the moon tooltip code handles it. Constellation tooltip only shows when no moon is hit.

---

## Fix 4: Remove scene description line

**Problem:** "12 months of 28 days. 7-day week. Default Eberron Campaign Setting calendar." appears below the scene date. Not useful.

**File:** `site/main.ts`

Find **both** occurrences of:

```typescript
  sceneSubtitle.textContent = world.description;
```

(There are two — line ~417 and line ~471.)

**Replace both with:**

```typescript
  sceneSubtitle.textContent = '';
```

Or alternatively, just hide the element:

```typescript
  sceneSubtitle.hidden = true;
```

---

## Fix 5: Remove landscape variants — keep only Farmstead

**Problem:** The generated landscape variants (forest, village, lakeside, mountains) all look bad. Keep only farmstead.

### 5a: Remove the HTML dropdown

**File:** `site/index.html`

Delete the entire `<label>` block containing `hero-landscape`:

```html
            <label>
              <span>Horizon</span>
              <select id="hero-landscape">
                ...
              </select>
            </label>
```

### 5b: Remove landscape mode state and variants

**File:** `site/sky-renderer.ts`

**Remove** the `_landscapeMode` variable and `_landFrac()` function. **Replace** all calls to `_landFrac()` with the constant `0.12`.

**Remove** `setLandscapeMode` export and the `_drawForest`, `_drawVillage`, `_drawLakeside`, `_drawMountains` functions if they exist.

**Remove** the `_drawLandscape` dispatcher switch/case and rename the farmstead variant back to `_drawLandscape` (or keep the farmstead code and delete the dispatcher).

### 5c: Remove landscape event listener and imports from main.ts

**File:** `site/main.ts`

Remove the `landscapeSelect` element ref, event listener, and any URL state handling for the landscape param. Remove the `setLandscapeMode` import.

---

## Fix 6: Solar system card improvements

### 6a: Rename the card

**File:** `site/index.html`

Find:
```html
              <p class="scene-card-label">Solar System</p>
```

**Replace with:**
```html
              <p class="scene-card-label">Relative Sizes</p>
```

### 6b: Fix pixelation — add DPR scaling and increase canvas size

**File:** `site/index.html`

Change the solar system canvas dimensions:
```html
<canvas id="solar-system-canvas" width="1800" height="280" aria-label="Relative moon size comparison"></canvas>
```

**File:** `site/main.ts`

In `_drawSolarSystem`, at the start (after getting `ssCtx`), add DPR scaling:

```typescript
  var dpr = Math.min(window.devicePixelRatio || 1, 3);
  var logW = 900, logH = 140;
  solarSystemCanvas.width = logW * dpr;
  solarSystemCanvas.height = logH * dpr;
  solarSystemCanvas.style.width = logW + 'px';
  solarSystemCanvas.style.height = logH + 'px';
  ssCtx.scale(dpr, dpr);
  var w = logW, h = logH;
```

Also increase `MAX_RADIUS` from 22 to 35 for better texture detail:

```typescript
  var MAX_RADIUS = 35;
```

And generate textures at a larger size:

```typescript
  var tex = getMoonTexture(m.name, m.color, Math.max(20, Math.round(mr * 2)));
```

### 6c: Add sun arc on the left and Eberron arc on the right

After drawing all the moons, add:

```typescript
  // Sun partial arc (left edge) — sun is MUCH larger, so just show a fraction
  var sunRadius = MAX_RADIUS * 8; // sun dwarfs everything
  ssCtx.beginPath();
  ssCtx.arc(-sunRadius + 12, cy, sunRadius, -Math.PI * 0.12, Math.PI * 0.12);
  ssCtx.closePath();
  var sunGrad = ssCtx.createRadialGradient(-sunRadius + 12, cy, sunRadius * 0.8, -sunRadius + 12, cy, sunRadius);
  sunGrad.addColorStop(0, 'rgba(255, 250, 220, 0.9)');
  sunGrad.addColorStop(1, 'rgba(255, 200, 100, 0.3)');
  ssCtx.fillStyle = sunGrad;
  ssCtx.fill();
  // Sun label
  ssCtx.fillStyle = 'rgba(255, 250, 220, 0.6)';
  ssCtx.font = '9px "Trebuchet MS", sans-serif';
  ssCtx.textAlign = 'left';
  ssCtx.fillText('Sun', 4, cy + sunRadius * 0.15 + 3);

  // Eberron partial arc (right edge) — the planet, larger than any moon
  var eberronRadius = MAX_RADIUS * 4;
  ssCtx.beginPath();
  ssCtx.arc(w + eberronRadius - 12, cy, eberronRadius, Math.PI - Math.PI * 0.15, Math.PI + Math.PI * 0.15);
  ssCtx.closePath();
  var eGrad = ssCtx.createRadialGradient(w + eberronRadius - 12, cy, eberronRadius * 0.7, w + eberronRadius - 12, cy, eberronRadius);
  eGrad.addColorStop(0, 'rgba(100, 160, 100, 0.7)');
  eGrad.addColorStop(1, 'rgba(40, 80, 60, 0.3)');
  ssCtx.fillStyle = eGrad;
  ssCtx.fill();
  ssCtx.fillStyle = 'rgba(140, 200, 140, 0.6)';
  ssCtx.font = '9px "Trebuchet MS", sans-serif';
  ssCtx.textAlign = 'right';
  ssCtx.fillText('Eberron', w - 4, cy + eberronRadius * 0.15 + 3);
```

---

## Fix 7: Moon atmospheric extinction — too aggressive

**Problem:** Moons change color noticeably at the horizon due to the red-shift component of atmospheric extinction. This fights with moon identity colors (Olarune is orange, Zarantyr is white, etc). The dimming is fine; the color shift is confusing.

**File:** `site/sky-renderer.ts`

In `_drawMoons`, find the extinction lines:

```typescript
    var moonExt = _smoothstep(0, 25, moon.altitudeExact);
    var moonExtDimming = 0.3 + 0.7 * moonExt;
```

The dimming is fine. But check if the moon disk drawing function `_drawMoonDisk` receives the color directly. It does — `color` is passed through unchanged. The `globalAlpha` handles the dimming. So the color shift is NOT applied to moons, only to stars.

**If the color IS being shifted on moons somewhere that I've missed**, remove it. Moons should only dim (via globalAlpha), not shift color.

**Also:** the dimming minimum of 0.3 is harsh. A moon right at the horizon drops to 30% brightness, which makes it look like a different color because the texture becomes very transparent against the dark sky. Change:

```typescript
    var moonExtDimming = 0.3 + 0.7 * moonExt;
```

To:

```typescript
    var moonExtDimming = 0.55 + 0.45 * moonExt;
```

This means a moon at the horizon is 55% brightness instead of 30% — still noticeably dimmer, but its color and texture remain recognizable.

---

## Fix 8: Moon phases — Zarantyr is the root cause

The phase data fix was applied correctly — `positionPhase` (fractional serial) is used on lines 162, 181, 184 of `src/showcase/sky-scene.ts`. The illumination math is continuous and correct.

**The locked-phase problem is caused by the Zarantyr `setTransform` bug** documented in Fix 12 below. The `ctx.setTransform(1,0,0,1,0,0)` call in Zarantyr's storm rotation effect destroys the DPR canvas transform. This causes Zarantyr's own phase shadow to render at the wrong coordinates (invisible), and may also corrupt the transform state for moons drawn after Zarantyr in the same frame. Fix 12 resolves this.

**No additional code change here** — Fix 12 is the fix.

---

## Fix 9: Calendar variant dropdown for non-Eberron worlds

Only Eberron has multiple naming overlays (Galifar, Druidic, Halfling, Dwarven). All other worlds have exactly 1 overlay, so the dropdown should hide when switching away from Eberron. The code logic is correct (`overlays.length <= 1` → hide), but a defensive clear is added in **Fix 15** below to prevent stale Eberron options from persisting.

Also improve the label:

**File:** `site/index.html`

Find:
```html
          <label id="gallery-variant-label" hidden>
            <span>Calendar variant</span>
```

**Replace with:**
```html
          <label id="gallery-variant-label" hidden>
            <span>Month names</span>
```

This makes it clearer that the dropdown controls which month-naming tradition is displayed, not which calendar system is active.

---

## Fix 10: Forgotten Realms intercalary days

The world config data is correct — Midwinter, Greengrass, Midsummer, Shieldmeet, Highharvestide, and Feast of the Moon are all properly defined as intercalary days with correct positions between months and leap year handling.

The problem is purely in the rendering — they currently show as text chips inside month cards with no visual context about what they are or where they fall. **Fix 16** below replaces these with styled divider strips between month cards.

**No data changes needed.**

---

## Fix 11: Mabar planar diagram glitch

**File:** `src/showcase/planar-phase.ts`

The Mabar entry (line 49–52) has `remoteDays: 0`, meaning the normal annual cycle has NO remote phase — just a 3-day coterminous window and 333 days of neutral. The special remote override (5-year cycle around summer solstice) snaps Mabar to a completely different radial position.

The "snap" happens because the override at line 422 sets `phase = 'remote'` and computes a new `position` from `_bandPositionFromPhase('remote', ...)`, which is at a very different radius than where neutral would place it. The transition is instant — one day Mabar is at neutral radius, the next day it's at remote radius.

**Fix:** Add a transition buffer. When the remote override starts, don't snap — fade in over 2 days. When it ends, fade out over 2 days:

Find the block starting at `if (dayOfYear >= remoteStart && dayOfYear <= remoteEnd)` (around line 421). **Replace the entire block** with:

```typescript
        var transitionDays = 2;
        var fadeInStart = remoteStart - transitionDays;
        var fadeOutEnd = remoteEnd + transitionDays;
        if (dayOfYear >= fadeInStart && dayOfYear <= fadeOutEnd) {
          var neutralPos = position; // position from the normal orbit calculation
          var remotePos = _bandPositionFromPhase('remote', Math.max(0, dayOfYear - remoteStart), remoteDur, 'neutral');
          var t = 0;
          if (dayOfYear < remoteStart) {
            // Fading in
            t = (dayOfYear - fadeInStart) / transitionDays;
          } else if (dayOfYear > remoteEnd) {
            // Fading out
            t = 1 - (dayOfYear - remoteEnd) / transitionDays;
          } else {
            t = 1; // fully remote
          }
          t = t * t * (3 - 2 * t); // smoothstep
          position = neutralPos + (remotePos - neutralPos) * t;
          if (t > 0.5) {
            phase = 'remote';
            phaseProgress = Math.max(0, dayOfYear - remoteStart) / Math.max(1, remoteDur);
            previousPhase = 'neutral';
            nextPhase = 'neutral';
          }
          isHalfBounce = false;
          isMabarRemoteOverride = true;
        }
```

---

## Fix 12: Zarantyr phase shadow missing (setTransform bug)

**Problem:** Zarantyr's phase shadow (the lit/dark terminator) does not render. The moon appears as a full circle regardless of its actual phase. This is caused by the storm rotation effect destroying the canvas DPR transform.

**File:** `site/sky-renderer.ts`

In `_drawMoonDisk`, find the Zarantyr storm rotation block (around lines 568–580):

```typescript
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
```

**The bug:** `ctx.setTransform(1, 0, 0, 1, 0, 0)` resets the canvas transform to identity, destroying the DPR scaling applied by `ctx.scale(effectiveScale, effectiveScale)` during initialization. After this line, all subsequent drawing operations in this function — including the phase shadow at lines 582–600 — happen in raw backing-store pixel coordinates instead of logical coordinates. The phase shadow is drawn at the wrong position and scale, making it invisible or mis-placed.

**Replace the entire Zarantyr block** with:

```typescript
  // Zarantyr storm rotation effect
  if (moonName === 'Zarantyr') {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.translate(x, y);
    ctx.rotate(timeFrac * Math.PI * 0.3);
    ctx.drawImage(tex, -radius, -radius, radius * 2, radius * 2);
    ctx.restore();
    // Re-apply the moon circle clip for the phase shadow below.
    // We are back in the outer save/restore (line 562), so the DPR transform is intact.
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
  }
```

The `save()/restore()` pair around the rotation preserves the DPR transform. The rotation only exists inside the save/restore scope. The clip is re-applied in the correct coordinate space so the phase shadow draws correctly.

**This may also fix other moons** — if the Zarantyr block was drawn before other moons in the same frame and the outer `restore()` at line 601 didn't fully undo the transform damage, subsequent moons could also have broken phase shadows.

**Verification:** Play at 24hr/s with Zarantyr visible. Its terminator shadow should slide smoothly from new → full → new. Compare with Nymm (which has no special rotation) — both should show smooth phase progression.

---

## Fix 13: Eyre moon texture — replace vague smudge with recognizable anvil

**Problem:** Eyre's "anvil" marking is three overlapping ellipses at 10–14% opacity. At the render sizes used in the sky view (25–50px radius), these blend into an indistinct triangular smudge. The anvil is not recognizable.

**File:** `site/sky-textures.ts`

**Replace the `_genEyre` function** (lines 148–195) with:

```typescript
function _genEyre(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#dcdcdc', '#a0a0a0');
  // scattered craters across surface
  for (var i = 0; i < 20; i++){
    var cx2 = r + ((_h('eyre:c:' + i) - 0.5) * s * 0.75);
    var cy2 = r + ((_h('eyre:cy:' + i) - 0.5) * s * 0.75);
    var cr = 1.5 + _h('eyre:cr:' + i) * 4.5;
    _crater(cx, cx2, cy2, cr);
  }
  // Anvil marking — geometric dark shape, readable at small sizes.
  // The anvil is a classic blacksmith anvil silhouette: wide flat base,
  // narrow waist, flat top with a horn (beak) extending to one side.
  cx.save();
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.clip();
  cx.fillStyle = 'rgba(35, 35, 50, 0.28)';
  // Base (wide flat bottom)
  var bw = s * 0.22;  // base half-width
  var bh = s * 0.04;  // base height
  var by = r + s * 0.08; // base y center
  cx.fillRect(r - bw, by - bh, bw * 2, bh * 2);
  // Waist (narrow connecting column)
  var ww = s * 0.07;  // waist half-width
  var wy = r - s * 0.02; // waist top
  cx.fillRect(r - ww, wy, ww * 2, by - bh - wy);
  // Face (flat top, wider than waist)
  var fw = s * 0.14;  // face half-width
  var fh = s * 0.05;  // face height
  var fy = wy - fh;   // face top
  cx.fillRect(r - fw, fy, fw * 2, fh);
  // Horn (beak extending to the right from the face)
  cx.beginPath();
  cx.moveTo(r + fw, fy + fh * 0.2);
  cx.lineTo(r + fw + s * 0.10, fy + fh * 0.5);
  cx.lineTo(r + fw, fy + fh * 0.8);
  cx.closePath();
  cx.fill();
  // Heel (small step on the left side of the base)
  cx.fillRect(r - bw - s * 0.03, by - bh - s * 0.02, s * 0.05, s * 0.02 + bh);
  cx.restore();
  _noisePass(cx, s, s, 'eyre', 7);
  _limbDarkening(cx, s, s);
  return cv;
}
```

This draws a solid geometric anvil silhouette at 28% opacity. The shape has a wide base, narrow waist, flat face, a horn extending right, and a heel step on the left. At 50px diameter the shape is clearly an anvil. At 25px it reads as a distinctive T-like marking that's obviously different from craters.

---

## Fix 14: Olarune moon texture — more prominent shield

**Problem:** Olarune's "shield rim" is a single 3px stroked circle at 50% opacity on an already-warm-orange surface. It's nearly invisible, especially at small sizes. The Sentinel Moon should have an obvious shield feature.

**File:** `site/sky-textures.ts`

**Replace the `_genOlarune` function** (lines 103–124) with:

```typescript
function _genOlarune(s: number){
  var { cv, cx } = _offscreen(s, s);
  var r = s / 2;
  _baseGradient(cx, s, s, '#ffe0b0', '#cc8844');
  // hazy atmosphere layers
  cx.beginPath();
  cx.arc(r, r, r * 0.85, 0, Math.PI * 2);
  cx.fillStyle = 'rgba(255,190,120,0.12)';
  cx.fill();
  // Shield boss — bright raised dome at center (the defining feature)
  var bossGrad = cx.createRadialGradient(r * 0.95, r * 0.9, 0, r, r, r * 0.35);
  bossGrad.addColorStop(0, 'rgba(255, 240, 210, 0.45)');
  bossGrad.addColorStop(0.5, 'rgba(255, 225, 180, 0.25)');
  bossGrad.addColorStop(1, 'rgba(200, 160, 100, 0.05)');
  cx.fillStyle = bossGrad;
  cx.beginPath();
  cx.arc(r, r, r * 0.35, 0, Math.PI * 2);
  cx.fill();
  // Boss edge ring — crisp circle around the central dome
  cx.beginPath();
  cx.arc(r, r, r * 0.35, 0, Math.PI * 2);
  cx.lineWidth = 1.5;
  cx.strokeStyle = 'rgba(180, 140, 80, 0.35)';
  cx.stroke();
  // Shield rim band — darker ring between 78% and 88% radius
  cx.beginPath();
  cx.arc(r, r, r * 0.88, 0, Math.PI * 2);
  cx.lineWidth = r * 0.10; // thick band
  cx.strokeStyle = 'rgba(160, 110, 50, 0.18)';
  cx.stroke();
  // Outer rim highlight — bright edge
  cx.beginPath();
  cx.arc(r, r, r * 0.95, 0, Math.PI * 2);
  cx.lineWidth = 2;
  cx.strokeStyle = 'rgba(255, 220, 160, 0.45)';
  cx.shadowColor = 'rgba(255, 200, 130, 0.5)';
  cx.shadowBlur = 5;
  cx.stroke();
  cx.shadowBlur = 0;
  // Subtle radial lines — like shield planks/segments (4 lines)
  cx.strokeStyle = 'rgba(160, 120, 60, 0.08)';
  cx.lineWidth = 1;
  for (var i = 0; i < 4; i++) {
    var angle = (i / 4) * Math.PI * 2 + 0.4; // offset so they don't align with axes
    cx.beginPath();
    cx.moveTo(r + Math.cos(angle) * r * 0.38, r + Math.sin(angle) * r * 0.38);
    cx.lineTo(r + Math.cos(angle) * r * 0.78, r + Math.sin(angle) * r * 0.78);
    cx.stroke();
  }
  _noisePass(cx, s, s, 'olarune', 6);
  _limbDarkening(cx, s, s);
  return cv;
}
```

This gives Olarune three concentric features: a bright central boss (shield dome), a dark rim band at ~83% radius, and a bright outer edge. Four faint radial lines suggest shield-plank construction. The contrast between bright center and dark rim reads as "round shield" even at 25px radius.

---

## Fix 15: Calendar variant dropdown — defensive clear on world change

**Problem:** The user reports seeing Eberron overlay options (Galifar, Druidic, Halfling) when viewing non-Eberron worlds. Only Eberron has multiple naming overlays; all other worlds have exactly 1, which should hide the dropdown. The dropdown may retain stale state if the hide/show transition races with the innerHTML update.

**File:** `site/main.ts`

In `_renderGalleryVariantOptions` (line 1353), **add a defensive clear** at the start of the hide branch:

**Replace:**
```typescript
function _renderGalleryVariantOptions(worldId: string){
  var world = WORLDS[worldId];
  var overlays = world.calendar.namingOverlays || [];
  if (overlays.length <= 1) {
    galleryVariantLabel.hidden = true;
    return;
  }
```

**With:**
```typescript
function _renderGalleryVariantOptions(worldId: string){
  var world = WORLDS[worldId];
  var overlays = world.calendar.namingOverlays || [];
  if (overlays.length <= 1) {
    galleryVariantLabel.hidden = true;
    galleryVariantSelect.innerHTML = '';
    galleryVariantSelect.value = '';
    return;
  }
```

This ensures the select element is emptied when hidden, so even if the `hidden` attribute is somehow not applied (race condition, CSS override, etc.), the dropdown shows nothing.

---

## Fix 16: Intercalary days — render as visible dividers between month cards

**Problem:** Forgotten Realms (and other calendars with intercalary days) display festival names as text chips inside month cards, but the festivals aren't shown as actual days on the calendar grid. The chips say "Midwinter" with no context about where in the calendar sequence the day falls. For the Harptos calendar, these are real days — Midwinter falls between Hammer and Alturiak, Greengrass between Tarsakh and Mirtul, etc.

### 16a: Replace festival chips with divider strips between month cards

**File:** `site/main.ts`

Find `_renderCalendarGalleryInner` (around line 519). The current code builds each month card and appends `_festivalRail(preview.intercalaryBefore.concat(preview.intercalaryAfter))` inside the card.

**Change the approach:** instead of putting festivals inside each card, emit them as standalone divider elements between cards. The gallery is built by mapping over months and joining. Change it so intercalary days between month N and month N+1 are emitted as separate elements between those two cards.

**Replace the month mapping block.** Find the `.map(function(slot, monthIndex){` loop that builds each `<article class="calendar-card">`. Currently the return looks like:

```typescript
    return (
      '<article class="calendar-card">' +
        '<div class="mini-calendar">' + tableHtml + '</div>' +
        _festivalRail(preview.intercalaryBefore.concat(preview.intercalaryAfter)) +
        _monthEventsList(monthEvents, worldId) +
      '</article>'
    );
```

**Replace with:**

```typescript
    // Festivals BEFORE this month rendered as standalone strips
    var preFestivals = preview.intercalaryBefore.map(function(name){
      return '<div class="intercalary-strip">' +
        '<span class="intercalary-marker"></span>' +
        '<span class="intercalary-name">' + _esc(name) + '</span>' +
        '<span class="intercalary-marker"></span>' +
      '</div>';
    }).join('');

    // Festivals AFTER this month rendered as standalone strips
    var postFestivals = preview.intercalaryAfter.map(function(name){
      return '<div class="intercalary-strip">' +
        '<span class="intercalary-marker"></span>' +
        '<span class="intercalary-name">' + _esc(name) + '</span>' +
        '<span class="intercalary-marker"></span>' +
      '</div>';
    }).join('');

    return (
      preFestivals +
      '<article class="calendar-card">' +
        '<div class="mini-calendar">' + tableHtml + '</div>' +
        _monthEventsList(monthEvents, worldId) +
      '</article>' +
      postFestivals
    );
```

**Remove the `_festivalRail` function** — it is no longer called.

### 16b: Style the intercalary strips

**File:** `site/styles.css`

Add these rules (after the existing `.calendar-card` styles):

```css
.intercalary-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.35rem 0.8rem;
  margin: 0.25rem 0;
  font-size: 0.78rem;
  color: rgba(230, 210, 170, 0.85);
  white-space: nowrap;
}

.intercalary-marker {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(230, 210, 170, 0.3), transparent);
}

.intercalary-name {
  font-style: italic;
  letter-spacing: 0.04em;
}
```

This renders each intercalary day as a centered label with decorative lines extending to each side:

```
──────── Midwinter ────────
```

The strip sits between the month cards in the gallery grid, making it visually clear that this is a standalone day between months, not part of either month.

### 16c: Handle the gallery grid layout

The calendar gallery uses CSS grid or flexbox. The intercalary strips need to span the full width of the gallery, not sit inside a card cell. **Add:**

```css
.calendar-gallery .intercalary-strip {
  grid-column: 1 / -1; /* span all columns if using CSS grid */
  width: 100%;
}
```

If the gallery uses flexbox instead of grid, set:

```css
.calendar-gallery .intercalary-strip {
  flex-basis: 100%;
}
```

Check which layout mode `.calendar-gallery` uses and apply the appropriate rule.

**Verification:** Switch to Forgotten Realms. The gallery should show:

```
[ Hammer ]
──────── Midwinter ────────
[ Alturiak ]
[ Ches ]
[ Tarsakh ]
──────── Greengrass ────────
[ Mirtul ]
[ Kythorn ]
[ Flamerule ]
──────── Midsummer ────────
[ Eleasis ]
...
```

Shieldmeet should only appear on years divisible by 4 (the `leapEvery: 4` config handles this — `isWorldSlotActive` already filters it). On non-leap years, only Midsummer appears between Flamerule and Eleasis. On leap years, both Midsummer and Shieldmeet appear.

---

## Fix 17: Missing naming overlays — Forgotten Realms and Greyhawk

Both settings have published alternate month-naming systems that are missing from the code. These affect both the Roll20 script (`src/constants.ts` if overlays are defined there, or the world configs) and the showcase site world configs.

### 17a: Forgotten Realms — add Chondathan overlay

**File:** `src/worlds/faerun.ts`

Find the `namingOverlays` array (currently has one entry: 'Standard (Dalereckoning)'). **Add a second entry** after the existing one:

```typescript
      {
        key: 'chondathan',
        label: 'Chondathan',
        monthNames: [
          'Deepwinter',
          'Claw of Winter',
          'Claw of Sunsets',
          'Claw of Storms',
          'The Melting',
          'Time of Flowers',
          'Summertide',
          'Highsun',
          'The Fading',
          'Leaffall',
          'The Rotting',
          'The Drawing Down',
        ],
        colorTheme: 'seasons',
      },
```

These are the canon Chondathan common names from the Forgotten Realms Campaign Setting. The `colorTheme: 'seasons'` uses the existing seasonal palette, which maps perfectly — the names literally describe the seasons.

### 17b: Greyhawk — add Flan zodiac overlay

**File:** `src/worlds/greyhawk.ts`

Find the `namingOverlays` array (currently has one entry: 'Common'). **Add a second entry** after the existing one:

```typescript
      {
        key: 'flan',
        label: 'Flan Zodiac',
        monthNames: [
          'Tiger', 'Bear', 'Lion', 'Frog',
          'Turtle', 'Fox', 'Snake', 'Boar',
          'Squirrel', 'Hare', 'Falcon', 'Wolf',
        ],
        colorTheme: 'seasons',
      },
```

These are the canon Flan zodiac animal names from the World of Greyhawk Fantasy Game Setting. Each month is named for its zodiac animal. The Flan were the original inhabitants of the Flanaess, and these names predate the Common/Oeridian system. `colorTheme: 'seasons'` differentiates it visually from the 'greyhawk' theme used by the Common overlay.

### 17c: Roll20 script sync

If the Roll20 script (`src/constants.ts` or similar) has its own naming overlay definitions separate from the world configs, the same overlays need to be added there too. Search for `namingOverlays` or `MONTH_NAME_OVERLAYS` in `src/constants.ts` and apply the same additions.

---

## Fix 18: Greyhawk constellations — 12 Lairs of the Zodiac

**File:** `site/constellations.ts`

The Greyhawk sky has 12 canonical zodiac constellations, one per month, called "The 12 Lairs of the Zodiac." Each is an animal shape. Add a `GREYHAWK_CONSTELLATIONS` export following the same structure as `EBERRON_CONSTELLATIONS`.

The 12 constellations are:

| Month | Animal | Shape Design | Stars |
|-------|--------|-------------|-------|
| Fireseek | Tiger | Crouching cat, long tail curving up | 10 |
| Readying | Bear | Standing bear profile, broad body | 10 |
| Coldeven | Lion | Seated lion with mane radiating | 11 |
| Planting | Frog | Wide squat body, splayed legs | 8 |
| Flocktime | Turtle | Domed shell with head and four legs poking out | 9 |
| Wealsun | Fox | Running fox profile, bushy tail | 9 |
| Reaping | Snake | S-curve, simple and distinctive | 7 |
| Goodmonth | Boar | Stocky body with tusks | 9 |
| Harvester | Squirrel | Sitting upright with curved tail over back | 8 |
| Patchwall | Hare | Leaping hare with long ears | 8 |
| Ready'reat | Falcon | Wings spread in dive, simple raptor | 9 |
| Sunsebb | Wolf | Howling wolf profile, head tilted up | 9 |

**Placement:** Distribute evenly around the celestial sphere at 30° RA intervals (360° / 12 = 30° per zodiac sign), with varying declinations between -10° and +50°. This mirrors how real zodiacal constellations are distributed along the ecliptic.

**Tints:** All use a warm neutral white `[240, 235, 225]` — Greyhawk zodiac constellations are not color-coded by deity like Eberron's.

**Domain field:** Use the animal name and its seasonal association, e.g., `domain: 'Fireseek — Winter'`.

**In `site/sky-renderer.ts`**, update the constellation selection logic to pick the right set based on `worldId`:

```typescript
var constellations = worldId === 'eberron' ? EBERRON_CONSTELLATIONS
                   : worldId === 'greyhawk' ? GREYHAWK_CONSTELLATIONS
                   : [];
```

Import `GREYHAWK_CONSTELLATIONS` at the top of the file.

**Design the actual star coordinates (RA/Dec) for each animal shape.** Use 7–11 stars per constellation. Keep shapes simple — these need to read as animals when lines are drawn between them, at any rotation. Favor distinctive silhouettes: the Snake is an S-curve, the Hare is a leaping arc, the Falcon is a V with spread wings. Avoid making shapes too similar to each other.

---

## Fix 19: Olarune texture — remove radial lines, keep only canon features

**File:** `site/sky-textures.ts`

In Fix 14 (Olarune shield texture), the design included "4 faint radial lines suggesting shield-plank construction." These are made up — only the ring/band is canon. **Remove the radial lines block** from the Fix 14 replacement. The Olarune texture should have:

1. Base warm orange gradient (existing)
2. Atmospheric haze layer (existing)
3. Shield boss — bright central dome (Fix 14 addition — keep)
4. Dark rim band at ~83% radius (Fix 14 addition — keep)
5. Bright outer rim highlight (existing, enhanced in Fix 14 — keep)
6. ~~Radial lines~~ — REMOVE

The four-line block to remove from Fix 14's replacement code:

```typescript
  // Subtle radial lines — like shield planks/segments (4 lines)
  cx.strokeStyle = 'rgba(160, 120, 60, 0.08)';
  cx.lineWidth = 1;
  for (var i = 0; i < 4; i++) {
    var angle = (i / 4) * Math.PI * 2 + 0.4;
    cx.beginPath();
    cx.moveTo(r + Math.cos(angle) * r * 0.38, r + Math.sin(angle) * r * 0.38);
    cx.lineTo(r + Math.cos(angle) * r * 0.78, r + Math.sin(angle) * r * 0.78);
    cx.stroke();
  }
```

Delete that entire block. The boss + rim band alone are distinctive enough and fully canon.

---

## Summary of files touched

| File | Changes |
|------|---------|
| `site/sky-renderer.ts` | View mode toggle (dynamic azimuth), ring horizon fix, constellation line visibility, landscape simplification (farmstead only), moon extinction reduction, Zarantyr setTransform fix, Greyhawk constellation selection |
| `site/sky-textures.ts` | Eyre anvil texture redesign, Olarune shield texture (boss + rim band, no radial lines) |
| `site/constellations.ts` | Add Greyhawk zodiac constellation data (12 animal shapes) |
| `site/main.ts` | View mode wiring, constellation tooltip, hover re-render trigger, scene subtitle removal, solar system DPR/sizing/sun+Eberron arcs, landscape variant removal, variant dropdown defensive clear, intercalary strip rendering |
| `site/index.html` | View mode dropdown, landscape dropdown removal, solar system rename/resize, variant label text |
| `site/styles.css` | CSS variable for sky aspect ratio, intercalary strip styles |
| `src/worlds/faerun.ts` | Add Chondathan naming overlay |
| `src/worlds/greyhawk.ts` | Add Flan zodiac naming overlay |
| `src/showcase/planar-phase.ts` | Mabar transition smoothing |

## What NOT to change

- Do NOT touch `_azAltToXY` — the equirectangular projection is correct
- Do NOT touch `_celestialToHorizon` — the spherical trig is correct
- Do NOT touch `_phaseAt` or `buildSkySceneFromResolved` — the phase smoothing is correct
- Do NOT touch Eberron constellation data — the 11 draconic god constellations are correct
- Do NOT touch moon textures OTHER than Eyre and Olarune — all others are fine
- Do NOT touch `_drawMoonDisk` EXCEPT the Zarantyr rotation block — the phase shadow math, glow rendering, and edge highlight are all correct
- Do NOT touch star generation in `sky-textures.ts` (`generateStarField`) — the tier system and color palettes are correct
- Do NOT touch the shooting star code
- Do NOT touch the render pipeline ordering (the draw order in `renderSkyFrame` is correct)
- Do NOT touch the Forgotten Realms or Greyhawk world configs EXCEPT to add the new naming overlay entries — do not modify existing overlays, month definitions, intercalary days, or calendar structure
- Do NOT add npm dependencies
- Do NOT rename exported functions

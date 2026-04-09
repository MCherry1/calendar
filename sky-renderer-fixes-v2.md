# Sky Renderer — Bug Fixes (Post-Implementation)

This document fixes the remaining bugs from the initial sky renderer overhaul. Apply these changes to the current `main` branch. Each fix is small and precise. Do not refactor surrounding code.

---

## Fix 1: Remove altitude clamping in projection

**Problem:** Objects above 70° altitude all pile up at the top pixel of the canvas instead of smoothly exiting the viewport. Stars, moons, and ring points at high altitude are clamped to `PANO_ALT_MAX`, creating a visible horizontal "shelf" at the top of the sky.

**File:** `site/sky-renderer.ts`

**Find the `_azAltToXY` function** (currently around line 56). It currently reads:

```typescript
function _azAltToXY(azDeg: number, altDeg: number, w: number, h: number): { x: number; y: number } {
  var skyH = h * (1 - _landFrac());
  var az = ((azDeg - SKY_AZ_MIN) % 360 + 360) % 360;
  var x = (az / SKY_AZ_RANGE) * w;
  var alt = Math.max(0, Math.min(PANO_ALT_MAX, altDeg));
  var y = skyH * (1 - alt / PANO_ALT_MAX);
  return { x, y };
}
```

**Replace with:**

```typescript
function _azAltToXY(azDeg: number, altDeg: number, w: number, h: number): { x: number; y: number } {
  var skyH = h * (1 - _landFrac());
  var az = ((azDeg - SKY_AZ_MIN) % 360 + 360) % 360;
  var x = (az / SKY_AZ_RANGE) * w;
  // No clamping — let objects exit the viewport naturally.
  // Negative y = above canvas (clipped by canvas), y > skyH = below horizon (behind landscape).
  var y = skyH * (1 - altDeg / PANO_ALT_MAX);
  return { x, y };
}
```

The ONLY change is removing `Math.max(0, Math.min(PANO_ALT_MAX, altDeg))`. The variable `altDeg` is used directly. Objects above 70° produce negative y (above canvas, clipped automatically). Objects below 0° produce y > skyH (behind the landscape silhouette, drawn over them in the landscape pass).

Do NOT add clamping anywhere else. Do NOT add bounds checks in calling code. Canvas rendering naturally clips to the canvas bounds. The landscape is drawn last and covers anything below the horizon.

---

## Fix 2: Expand to 360° azimuth view

**Problem:** The 198° viewport (81° to 279°) means constellations behind the viewer are never visible, the Ring of Siberys gets polygon artifacts at the edges from unfiltered out-of-range points, and the planetarium effect is incomplete.

### Fix 2a: Change azimuth constants

**File:** `site/sky-renderer.ts`

**Replace lines 11–13:**
```typescript
var SKY_AZ_MIN = 81;          // East edge (90° - 5% padding)
var SKY_AZ_MAX = 279;         // West edge (270° + 5% padding)
var SKY_AZ_RANGE = SKY_AZ_MAX - SKY_AZ_MIN; // 198°
```

**With:**
```typescript
var SKY_AZ_MIN = 0;           // North (left edge)
var SKY_AZ_MAX = 360;         // North (right edge, wraps)
var SKY_AZ_RANGE = 360;       // Full panorama
```

This means: North is at both the left and right edges. East is at 25% from left. South is at center. West is at 75% from left. This is a standard panoramic star chart layout.

### Fix 2b: Update canvas aspect ratio

**File:** `site/index.html`

**Find the canvas tag** (line 103). Change the width attribute:
```html
<canvas id="sky-canvas" width="1400" height="700" aria-label="Animated sky scene showing moons and celestial objects"></canvas>
```

**File:** `site/styles.css`

**Find the `#sky-canvas` rule** (line 337). Change the aspect ratio:
```css
#sky-canvas {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 2 / 1;
  cursor: default;
  border-radius: 6px;
}
```

### Fix 2c: Update minimum backing resolution

**File:** `site/sky-renderer.ts`

In `initSkyRenderer`, the minimum backing resolution constants need to match the new aspect ratio. **Find these lines** (in the init function and the ResizeObserver callback):

```typescript
  var backingW = Math.max(1680, _logicalW * dpr);
  var backingH = Math.max(945, _logicalH * dpr);
```

**Change to:**
```typescript
  var backingW = Math.max(2100, _logicalW * dpr);
  var backingH = Math.max(1050, _logicalH * dpr);
```

Apply the same change to **both** occurrences — the one in `initSkyRenderer` and the one inside the `ResizeObserver` callback. The minimum is 2100×1050 (1.5× the base 1400×700).

### Fix 2d: Add compass labels

With a full 360° view, users need orientation. **In `renderSkyFrame`**, after drawing the landscape (step 7), add compass labels at the bottom of the sky area:

```typescript
  // 8. Compass labels
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = 'rgba(200, 210, 230, 0.7)';
  ctx.font = '12px "Trebuchet MS", "Gill Sans", sans-serif';
  ctx.textAlign = 'center';
  var compassY = h * (1 - _landFrac()) - 8;
  ctx.fillText('N', 0, compassY);              // North at left edge
  ctx.fillText('E', w * 0.25, compassY);        // East at 25%
  ctx.fillText('S', w * 0.5, compassY);         // South at center
  ctx.fillText('W', w * 0.75, compassY);        // West at 75%
  ctx.fillText('N', w, compassY);               // North at right edge
  ctx.restore();
```

Place this code AFTER the landscape drawing (after step 7) so it renders on top of the landscape silhouette.

---

## Fix 3: Mouse coordinate space for hover detection

**Problem:** `_canvasMouseCoords` converts mouse position to backing store pixels, but all drawn element positions (constellation stars, moon positions) are in logical coordinates. The coordinate spaces don't match, so hover detection fails — you'd need to hover at 1.5× the actual position.

**File:** `site/main.ts`

**Find `_canvasMouseCoords`** (around line 310):

```typescript
function _canvasMouseCoords(e: MouseEvent): { cx: number; cy: number } | null {
  var rect = canvas.getBoundingClientRect();
  var scaleX = canvas.width / rect.width;
  var scaleY = canvas.height / rect.height;
  return { cx: (e.clientX - rect.left) * scaleX, cy: (e.clientY - rect.top) * scaleY };
}
```

**Replace with:**

```typescript
function _canvasMouseCoords(e: MouseEvent): { cx: number; cy: number } | null {
  var rect = canvas.getBoundingClientRect();
  // Convert to logical coordinates (matching the drawing coordinate space).
  // The canvas ctx has scale(effectiveScale) applied, so all drawing
  // coordinates are in logical space. canvas.style.width is set to
  // logicalW + 'px', so logicalW / rect.width ≈ 1.0.
  var logicalW = parseFloat(canvas.style.width) || canvas.clientWidth || 1400;
  var logicalH = parseFloat(canvas.style.height) || canvas.clientHeight || 700;
  return {
    cx: (e.clientX - rect.left) * (logicalW / rect.width),
    cy: (e.clientY - rect.top) * (logicalH / rect.height)
  };
}
```

The key change: instead of scaling to backing store pixels (`canvas.width / rect.width`), we scale to logical pixels (`logicalW / rect.width`). This fixes both constellation hover AND moon hover.

---

## Fix 4: Scene readout label update

**File:** `site/main.ts`

**Find this line** (search for `'Looking South'`):

```typescript
  sceneViewNote.textContent = 'Looking South from ' + _formatLatitude(scene.observerLatitude) + '. ' + lunarSizeLabel + '.';
```

**Replace with:**

```typescript
  sceneViewNote.textContent = 'Full sky from ' + _formatLatitude(scene.observerLatitude) + '. South at center. ' + lunarSizeLabel + '.';
```

---

## Summary of changes

| File | What changes |
|------|-------------|
| `site/sky-renderer.ts` | Remove altitude clamp in `_azAltToXY`. Change `SKY_AZ_MIN/MAX/RANGE` to 0/360/360. Update minimum backing resolution to 2100×1050. Add compass labels in `renderSkyFrame`. |
| `site/index.html` | Canvas dimensions to 1400×700. |
| `site/styles.css` | Canvas aspect-ratio to 2/1. |
| `site/main.ts` | Fix `_canvasMouseCoords` to return logical coordinates. Update scene readout text. |

## What NOT to change

- Do not touch the Ring of Siberys rendering code. With 360° azimuth, the ring's visible arc (roughly azimuth 70°–290° at latitude 45°N) is entirely within the viewport and the polygon wrapping issue does not occur. The horizon clamp from the previous implementation is still correct and should stay.
- Do not touch the ring drift particle code. Same reason.
- Do not touch `_celestialToHorizon`. The spherical trig is correct.
- Do not touch constellation data (`site/constellations.ts`).
- Do not touch `_drawConstellationLines`. It is correctly implemented — it was just never triggering because the hover detection coordinates were wrong.
- Do not add new azimuth range filtering or clamping. Objects outside the canvas are clipped automatically by the canvas rendering context.
- Do not touch `_phaseAt` or `buildSkySceneFromResolved`.
- Do not change the star generation in `sky-textures.ts`.
- Do not change the landscape variants.
- Do not change the shooting star code.
- Do not add any npm dependencies.
- Do not restructure the render pipeline ordering.

## After applying — visual checks

1. **Stars at zenith:** Play at night. Stars near the top of the canvas should smoothly drift off the top edge, not pile up in a horizontal line.
2. **Ring of Siberys:** Should arc smoothly from east (25% from left) through south (center) to west (75% from left) with no vertical cuts, no triangular artifacts, and no warping at the edges. Both ends should taper to the horizon naturally.
3. **Constellation hover:** Move mouse near a cluster of constellation stars. Cursor changes to 'help'. Gold connecting lines appear between the stars of that constellation. Moving away dismisses them.
4. **Moon hover:** Move mouse over a visible moon. Cursor changes to 'pointer'. Tooltip appears with moon name, phase, altitude, direction.
5. **Full panorama:** North at both left and right edges with 'N' labels. 'E', 'S', 'W' labels visible along the bottom. The sky gradient sunset glow should be localized around the sun's azimuth. All 11 constellations visible when above the horizon.
6. **Smooth transit:** Play at 1hr/s at night. Stars, moons, and ring should all move at constant speed across the full width of the canvas. Nothing should bunch up, warp, or change speed. Objects should smoothly enter from the right, cross the canvas, and exit on the left (or vice versa depending on viewing direction).

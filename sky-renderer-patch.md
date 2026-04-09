# Sky Renderer Patch — Post-Implementation Fixes

Three bugs found after the initial implementation. Each is independent.

---

## Fix A: Ring of Siberys azimuth clipping

**Problem:** The ring's point-generation loop has no azimuth filtering. It generates points for the entire celestial equator, including portions behind the viewer (azimuth outside 81°–279°). `_azAltToXY` maps these to x-coordinates far off screen (1.5×–2× canvas width). The band polygons include these off-screen points and `closePath()` draws straight lines across the canvas to connect them, creating triangular fill artifacts and hard vertical edges.

**File:** `site/sky-renderer.ts`

**The core issue:** The band rendering at lines 710–720 draws each band as a single closed polygon: trace all `hi` points left-to-right, then all `lo` points right-to-left, then `closePath()`. If ANY of those points are off-screen, the polygon sweeps through visible space.

**Solution:** Filter ring points by azimuth AND break the polygon into separate visible segments. When a point's azimuth falls outside the view range, don't add it to the arrays. When there's a gap (a point was skipped), start new arrays for the next visible segment. Draw each segment independently.

**Replace the ring point-generation loop AND band drawing** (lines 660–720) with:

```typescript
  // Trace the celestial equator arc — collect SEGMENTS (gaps where azimuth is out of view)
  type RingSegment = { center: {x:number;y:number}[]; outer: {x:number;y:number}[]; inner: {x:number;y:number}[] };
  var segments: RingSegment[] = [];
  var curSeg: RingSegment | null = null;

  for (var i = 0; i <= steps; i++) {
    var H = (-180 + 360 * i / steps) * DEG2RAD;
    var sinAlt = Math.cos(lat) * Math.cos(H);
    var altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
    var altDeg = altRad / DEG2RAD;
    if (altDeg < -halfWidthDeg) { curSeg = null; continue; }
    altDeg = Math.max(0, altDeg);

    var azRaw = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat));
    var azDeg = ((azRaw / DEG2RAD) + 180 + 360) % 360;

    // Azimuth filter: skip points outside the visible window (with small padding)
    var azNorm = ((azDeg - SKY_AZ_MIN) % 360 + 360) % 360;
    if (azNorm > SKY_AZ_RANGE + 3) { curSeg = null; continue; }

    if (!curSeg) {
      curSeg = { center: [], outer: [], inner: [] };
      segments.push(curSeg);
    }
    curSeg.center.push(_azAltToXY(azDeg, altDeg, w, h));
    curSeg.outer.push(_azAltToXY(azDeg, altDeg + halfWidthDeg, w, h));
    curSeg.inner.push(_azAltToXY(azDeg, Math.max(0, altDeg - halfWidthDeg), w, h));
  }

  // Use the first non-empty segment's centerPts for label/particle placement
  var centerPts: {x:number;y:number}[] = [];
  for (var sg = 0; sg < segments.length; sg++) {
    for (var sp = 0; sp < segments[sg].center.length; sp++) {
      centerPts.push(segments[sg].center[sp]);
    }
  }
  if (centerPts.length < 2) { ctx.restore(); return; }

  ctx.save();

  // Interpolate between inner and outer at fraction f for a given segment
  function _segBandPts(seg: RingSegment, f: number): {x: number; y: number}[] {
    var pts: {x: number; y: number}[] = [];
    for (var j = 0; j < seg.inner.length; j++) {
      pts.push({
        x: seg.inner[j].x + (seg.outer[j].x - seg.inner[j].x) * f,
        y: seg.inner[j].y + (seg.outer[j].y - seg.inner[j].y) * f
      });
    }
    return pts;
  }

  // Saturn-analog multi-band structure
  var bandDefs = [
    { f0: 0.00, f1: 0.04, color: 'rgba(180,155,80,0.02)' },
    { f0: 0.04, f1: 0.22, color: 'rgba(200,175,100,0.07)' },
    { f0: 0.22, f1: 0.38, color: 'rgba(248,220,140,0.22)' },
    { f0: 0.38, f1: 0.56, color: 'rgba(240,212,130,0.18)' },
    { f0: 0.56, f1: 0.62, color: 'rgba(160,140,70,0.01)' },
    { f0: 0.62, f1: 0.82, color: 'rgba(232,203,118,0.13)' },
    { f0: 0.82, f1: 0.84, color: 'rgba(160,140,70,0.01)' },
    { f0: 0.84, f1: 0.92, color: 'rgba(220,195,110,0.10)' },
    { f0: 0.96, f1: 1.00, color: 'rgba(200,175,100,0.04)' }
  ];

  // Draw each segment independently — no cross-segment closePath artifacts
  for (var sgi = 0; sgi < segments.length; sgi++) {
    var seg = segments[sgi];
    if (seg.center.length < 2) continue;
    for (var bd = 0; bd < bandDefs.length; bd++) {
      var def = bandDefs[bd];
      var lo = _segBandPts(seg, def.f0);
      var hi = _segBandPts(seg, def.f1);
      ctx.beginPath();
      ctx.moveTo(hi[0].x, hi[0].y);
      for (var j = 1; j < hi.length; j++) ctx.lineTo(hi[j].x, hi[j].y);
      for (var k = lo.length - 1; k >= 0; k--) ctx.lineTo(lo[k].x, lo[k].y);
      ctx.closePath();
      ctx.fillStyle = def.color;
      ctx.fill();
    }
  }
```

Then update the **edge softening** section (the part after the band drawing that strokes inner/outer edges) to also iterate over segments instead of using the old monolithic arrays. Find the lines that reference `edgeInner` and `edgeOuter` and replace them:

```typescript
  // Edge softening — per segment
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(232,203,118,0.04)';
  ctx.shadowColor = 'rgba(232,203,118,0.15)';
  ctx.shadowBlur = 8;
  for (var esi = 0; esi < segments.length; esi++) {
    var eseg = segments[esi];
    if (eseg.center.length < 2) continue;
    var edgeOuter = _segBandPts(eseg, 0.98);
    var edgeInner = _segBandPts(eseg, 0.02);
    ctx.beginPath();
    ctx.moveTo(edgeOuter[0].x, edgeOuter[0].y);
    for (var eo = 1; eo < edgeOuter.length; eo++) ctx.lineTo(edgeOuter[eo].x, edgeOuter[eo].y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(edgeInner[0].x, edgeInner[0].y);
    for (var ei = 1; ei < edgeInner.length; ei++) ctx.lineTo(edgeInner[ei].x, edgeInner[ei].y);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
```

Also update the **drift particles** to have azimuth filtering. Find the particle loop (the one with `pAltDeg` and `pAzDeg`). After computing `pAzDeg`, add:

```typescript
    var pAzNorm = ((pAzDeg - SKY_AZ_MIN) % 360 + 360) % 360;
    if (pAzNorm > SKY_AZ_RANGE + 3) continue;
```

The **label placement** at the end still uses `centerPts` which now contains all segments merged, so it should work as-is.

**Verification:** At night in Eberron, the ring should arc smoothly from the east horizon to the west horizon with no triangular fill artifacts, no vertical cuts, and no bands stretching across the top of the canvas.

---

## Fix B: Mouse coordinate space mismatch

**Problem:** `_canvasMouseCoords` (line 310 in `site/main.ts`) converts mouse position to backing store pixel coordinates by multiplying by `canvas.width / rect.width`. After the DPR/minimum-resolution changes, the backing store is larger than the logical coordinate space (e.g., 1680px backing vs 1120px logical). But all drawn element positions (constellation stars, moon positions) are stored in logical coordinates because the canvas context has `ctx.scale(effectiveScale, ...)` applied. The hit test compares backing-store mouse coords against logical-space element coords, so nothing matches.

**File:** `site/main.ts`

**Replace the `_canvasMouseCoords` function** (line 310–315):

```typescript
function _canvasMouseCoords(e: MouseEvent): { cx: number; cy: number } | null {
  var rect = canvas.getBoundingClientRect();
  // Return logical coordinates (matching the coordinate space used by ctx.scale
  // in the renderer). CSS layout width maps 1:1 to logical width.
  var scaleX = _logicalW / rect.width;
  var scaleY = _logicalH / rect.height;
  return { cx: (e.clientX - rect.left) * scaleX, cy: (e.clientY - rect.top) * scaleY };
}
```

Wait — `_logicalW` and `_logicalH` are private to `sky-renderer.ts`. The simplest fix is to avoid the DPR scale entirely. The logical coordinate space is set to match `clientWidth`/`clientHeight`, and the CSS `style.width` is set to match. So the CSS-pixel coordinate IS the logical coordinate. Replace the function with:

```typescript
function _canvasMouseCoords(e: MouseEvent): { cx: number; cy: number } | null {
  var rect = canvas.getBoundingClientRect();
  // Logical coordinates match CSS layout pixels (renderer applies DPR scale internally)
  return { cx: e.clientX - rect.left, cy: e.clientY - rect.top };
}
```

This returns coordinates in CSS pixel space, which IS the logical coordinate space because `canvas.style.width = _logicalW + 'px'` and all drawing happens in logical coords after `ctx.scale(dpr, dpr)`.

**Verification:** Hover over a constellation star — the cursor should change to `help` and connecting gold lines should appear. Hover over a moon — tooltip should appear. Both interactions should align precisely with the visible drawn positions.

---

## Fix C: Ring wash azimuth filtering

**Problem:** If the ring wash function (`_drawRingWash`) exists, it likely has the same missing azimuth filter as the main ring. Check and add the same `azNorm > SKY_AZ_RANGE + 3` skip.

**File:** `site/sky-renderer.ts`

Find the `_drawRingWash` function. In its equator-tracing loop, after computing `azDeg`, add:

```typescript
    var washAzNorm = ((azDeg - SKY_AZ_MIN) % 360 + 360) % 360;
    if (washAzNorm > SKY_AZ_RANGE + 3) continue;
```

---

## Summary

| Fix | File | Issue |
|-----|------|-------|
| A | `site/sky-renderer.ts` | Ring polygon includes off-screen points → fill artifacts |
| B | `site/main.ts` | Mouse coords in backing-store space, elements in logical space |
| C | `site/sky-renderer.ts` | Ring wash has same azimuth issue |

**Do NOT change:** `_azAltToXY`, constellation data, star rendering, moon rendering, landscape code, or anything else.

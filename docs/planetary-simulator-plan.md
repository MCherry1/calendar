# GitHub Pages Planetary Simulator Plan

This document outlines a practical plan for building a dramatic, high-quality browser-based planetary and moon movement simulator for this project.

The existing `calendar` repo already models moons, phases, lighting, and planar states. The simulator should treat that existing rules/math layer as the source of truth and build a separate visual presentation layer on top of it.

## Goal

Create a GitHub Pages-hosted visual simulator that can:

- Render Eberron's world, Ring of Siberys, and moons in motion
- Show orbital movement smoothly over time
- Display moon phases, visibility, and notable alignments
- Support cinematic camera movement and a polished presentation
- Reuse or adapt existing calendar/moon/planar data rather than duplicating logic blindly

## Recommended Stack

### Core

- **Vite** for local development and static production builds
- **Three.js** for the 3D rendering layer
- **HTML/CSS** for overlays and control panels
- **TypeScript** for simulator logic and shared data models

### Optional

- **GLTF/GLB** assets for observatories, decorative scene elements, or stylized Eberron set dressing
- **SVG or Canvas overlays** for schematic orbit maps, labels, or debugging views

## Why Three.js

Three.js is the best fit for the desired result:

- strong browser support
- good documentation and ecosystem
- easy path to textured planets, moons, rings, starfields, and glow effects
- good camera control and animation support
- practical for GitHub Pages because the final output is static HTML/CSS/JS

## Hosting Model

GitHub Pages is suitable because this is a static front-end app.

Recommended deployment path:

1. Build with Vite
2. Output static files to `dist/`
3. Deploy with GitHub Actions to GitHub Pages

## Architectural Principle

Keep **simulation** and **rendering** separate.

- **Simulation layer**: date stepping, orbital state, phase state, visibility, alignments
- **Rendering layer**: meshes, materials, lights, trails, camera, UI

Do not bury moon math inside mesh update code. The visualizer should consume structured state from simulation functions.

## Suggested Repo Layout

This can live either in a dedicated `sim/` app folder inside this repo or as a separate Pages-oriented subproject.

Suggested in-repo structure:

```text
sim/
  index.html
  package.json
  vite.config.ts
  public/
    textures/
      stars_8k.jpg
      eberron.jpg
      sybaris_ring.png
      moon_zarantyr.jpg
      moon_olarune.jpg
      ...
    data/
      bodies.json
  src/
    main.ts
    style.css
    scene/
      renderer.ts
      camera.ts
      lights.ts
      background.ts
      postfx.ts
    sim/
      clock.ts
      orbitMath.ts
      phaseMath.ts
      visibility.ts
      ephemeris.ts
      eberronData.ts
    objects/
      planet.ts
      moon.ts
      ring.ts
      orbitTrail.ts
      labels.ts
    ui/
      controls.ts
      timeline.ts
      infoPanel.ts
      bodyPicker.ts
```

## Minimal Data Model

A body definition should include visual and orbital properties.

```ts
export type OrbitalBodyDef = {
  name: string;
  title?: string;
  radius: number;
  semiMajorAxis: number;
  periodDays: number;
  inclinationDeg: number;
  phaseOffsetDeg?: number;
  texture: string;
  albedo?: number;
  emissive?: number;
  trailColor?: string;
};
```

For Eberron-specific bodies, start with the values already documented in this repository wherever possible.

## First Build Target

Build a strong vertical slice before attempting every feature.

### Phase 1

- one planet mesh for Eberron
- visible Ring of Siberys
- all 12 moons rendered as spheres
- orbital motion driven by simulation time
- fullscreen scene
- basic starfield background
- simple left or right control panel
- play/pause and speed control
- time scrubber by day
- click-to-focus moon selection

### Phase 2

- lighting-based phase display
- orbital trails
- hover labels and info panel
- noteworthy-event highlights:
  - full moon
  - new moon
  - conjunction
  - associated-plane event overlays
- smoother camera transitions

### Phase 3

- cinematic presentation mode
- bloom/post-processing
- stylized lore presentation
- multiple viewpoints:
  - dramatic 3D view
  - top-down orbital map
  - sky/observatory mode
- import from shared calendar/moon state helpers

## Rendering Features That Matter Most

For the "dramatic HD HQ" look, prioritize these over exotic physics:

- high-resolution textures
- rim lighting on moons
- a convincing ring material for Siberys
- soft bloom on bright objects
- smooth camera easing
- restrained UI with strong typography
- orbital trails with tasteful fade
- dark starfield backdrop

The project will look more premium from lighting, composition, and camera behavior than from extreme numerical complexity.

## UI Recommendations

Use HTML/CSS overlay panels instead of drawing UI in WebGL.

Recommended controls:

- play / pause
- speed multiplier
- day jump / scrubber
- focus target selector
- toggle labels
- toggle trails
- toggle planar overlays
- selected-body detail card

## Data Reuse Strategy

This repo already contains Eberron-specific moon and planar modeling. The cleanest path is:

1. identify reusable moon/orbit data from the existing TypeScript source
2. move shared pure logic into importable modules if needed
3. keep Roll20-only concerns isolated from browser simulator logic

Anything tied directly to Roll20 globals should remain outside the simulator app.

## Performance Guidelines

- cap pixel ratio at 2
- keep sphere segment counts reasonable
- avoid expensive real-time shadows unless they add visible value
- keep post-processing moderate
- prefer simple materials for distant bodies
- load textures lazily only if startup becomes heavy

## GitHub Pages Notes

For a project page such as `https://mcherry1.github.io/calendar/`, Vite should use the repo base path.

Example:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/calendar/'
});
```

If the simulator is hosted under a subdirectory such as `/calendar/sim/`, adjust the base and deployment path accordingly.

## Recommended Next Steps

1. Create a `sim/` Vite app inside this repository
2. Stand up a Three.js scene with one planet and one orbiting moon
3. Port or mirror the current Eberron moon data into a browser-safe module
4. Add all 12 moons and the Ring of Siberys
5. Add timeline controls and body focus
6. Add GitHub Actions deployment to Pages

## Non-Goals for the First Version

Do not block initial delivery on:

- global latitude/longitude sky simulation
- perfect astrophysical realism
- volumetric atmospheres
- procedural terrain generation
- deep asset pipelines

The first version should be visually strong, responsive, and faithful to the setting/math already used by the calendar.

## Summary

The recommended approach is:

- **Three.js** for visuals
- **Vite** for dev/build
- **GitHub Pages** for hosting
- **TypeScript shared logic** for orbital state
- **HTML/CSS overlays** for controls

That gives the cleanest path from the current calendar/moon system to a polished browser-based Eberron orbital simulator.

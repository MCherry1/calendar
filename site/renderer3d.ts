// Three.js 3D renderer for the Calendar Showcase sky scene.
// Replaces the 2D canvas renderer with a full 3D planetary view.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { createPlanet, type PlanetGroup } from './objects/planet.js';
import { createMoonSystem, updateMoons, type MoonSystem } from './objects/moons.js';
import { createSiberysRing, updateRing, type RingSystem } from './objects/ring.js';
import { createStarfield } from './objects/starfield.js';
import type { SkyScene } from '../src/showcase/sky-scene.js';

export type Renderer3D = {
  update: (scene: SkyScene, timeFrac: number) => void;
  resize: () => void;
  dispose: () => void;
  focusMoon: (name: string) => void;
  resetCamera: () => void;
  renderer: THREE.WebGLRenderer;
};

var DEG2RAD = Math.PI / 180;
var SCENE_SCALE = 0.001; // km → scene units (1000 km = 1 unit)
var PLANET_RADIUS = 6400 * SCENE_SCALE; // ~6.4 units
var MAX_DPR = 2;

export function createRenderer3D(container: HTMLElement): Renderer3D {
  var scene = new THREE.Scene();

  // Camera
  var camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 20000);
  camera.position.set(0, 8, 28);
  camera.lookAt(0, 0, 0);

  // WebGL Renderer
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';

  // Controls
  var controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 12;
  controls.maxDistance = 200;
  controls.maxPolarAngle = Math.PI * 0.95;
  controls.target.set(0, 0, 0);

  // Lights — dim ambient for fill, directional for planet surface only
  var ambientLight = new THREE.AmbientLight(0x1a2030, 0.15);
  scene.add(ambientLight);

  var sunLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
  sunLight.position.set(50, 20, 30);
  scene.add(sunLight);

  // Scene objects
  var planet = createPlanet(PLANET_RADIUS);
  scene.add(planet.group);

  var ring = createSiberysRing(PLANET_RADIUS);
  scene.add(ring.group);

  var moonSystem = createMoonSystem();
  scene.add(moonSystem.group);

  var starfield = createStarfield();
  scene.add(starfield);

  // Post-processing
  var composer = new EffectComposer(renderer);
  var renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  var bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    0.45,  // strength
    0.6,   // radius
    0.75   // threshold
  );
  composer.addPass(bloomPass);

  var outputPass = new OutputPass();
  composer.addPass(outputPass);

  // Camera focus animation state
  var focusTarget: THREE.Vector3 | null = null;
  var focusCamPos: THREE.Vector3 | null = null;
  var focusProgress = 1;
  var focusDuration = 1.2; // seconds
  var focusStartPos = new THREE.Vector3();
  var focusStartTarget = new THREE.Vector3();

  // Track current world for showing/hiding ring
  var currentWorldId = '';

  function update(skyScene: SkyScene, timeFrac: number) {
    // Show/hide Eberron-specific objects
    if (skyScene.worldId !== currentWorldId) {
      currentWorldId = skyScene.worldId;
      var isEberron = skyScene.worldId === 'eberron';
      ring.group.visible = isEberron;
      planet.group.visible = true;
    }

    // Update moon positions and phases
    updateMoons(moonSystem, skyScene, PLANET_RADIUS, SCENE_SCALE);

    // Update ring sparkle animation
    updateRing(ring, timeFrac);

    // Animate camera focus
    if (focusProgress < 1 && focusTarget && focusCamPos) {
      focusProgress = Math.min(1, focusProgress + (1 / 60) / focusDuration);
      var t = _easeInOutCubic(focusProgress);
      camera.position.lerpVectors(focusStartPos, focusCamPos, t);
      controls.target.lerpVectors(focusStartTarget, focusTarget, t);
    }

    controls.update();
    composer.render();
  }

  function resize() {
    var w = container.clientWidth;
    var h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloomPass.setSize(w, h);
  }

  function focusMoon(name: string) {
    var moonMesh = moonSystem.meshes.get(name);
    if (!moonMesh) return;
    var worldPos = new THREE.Vector3();
    moonMesh.getWorldPosition(worldPos);

    focusStartPos.copy(camera.position);
    focusStartTarget.copy(controls.target);
    focusTarget = worldPos.clone();

    // Position camera offset from the moon
    var dir = worldPos.clone().normalize();
    var offset = dir.clone().multiplyScalar(3).add(new THREE.Vector3(0, 1.5, 0));
    focusCamPos = worldPos.clone().add(offset);
    focusProgress = 0;
  }

  function resetCamera() {
    focusStartPos.copy(camera.position);
    focusStartTarget.copy(controls.target);
    focusTarget = new THREE.Vector3(0, 0, 0);
    focusCamPos = new THREE.Vector3(0, 8, 28);
    focusProgress = 0;
  }

  function dispose() {
    controls.dispose();
    renderer.dispose();
    composer.dispose();
    if (renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
  }

  // Handle window resize
  window.addEventListener('resize', resize);

  return { update, resize, dispose, focusMoon, resetCamera, renderer };
}

function _easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Moon meshes with custom phase shaders for Eberron's magical phase system.
// Each moon has an independent phase (illum/waxing) driven by planar connections,
// NOT by sun direction. The shader renders the terminator internally.

import * as THREE from 'three';
import { getMoonTexture } from '../sky-textures.js';
import type { SkyScene, SkySceneMoon } from '../../src/showcase/sky-scene.js';

export type MoonSystem = {
  group: THREE.Group;
  meshes: Map<string, THREE.Mesh>;
  labels: Map<string, THREE.Sprite>;
};

var DEG2RAD = Math.PI / 180;

// Scene scale factor (same as renderer3d)
var ORBIT_SCALE_BASE = 0.00004; // Compress orbital distances to fit scene
var MIN_MOON_RADIUS = 0.15;
var MAX_MOON_RADIUS = 0.6;

export function createMoonSystem(): MoonSystem {
  var group = new THREE.Group();
  var meshes = new Map<string, THREE.Mesh>();
  var labels = new Map<string, THREE.Sprite>();
  return { group, meshes, labels };
}

export function updateMoons(system: MoonSystem, skyScene: SkyScene, planetRadius: number, sceneScale: number) {
  var activeMoonNames = new Set<string>();

  for (var i = 0; i < skyScene.moons.length; i++) {
    var moonData = skyScene.moons[i];
    activeMoonNames.add(moonData.name);

    var mesh = system.meshes.get(moonData.name);
    if (!mesh) {
      mesh = _createMoonMesh(moonData);
      system.group.add(mesh);
      system.meshes.set(moonData.name, mesh);

      var label = _createLabel(moonData.name);
      system.group.add(label);
      system.labels.set(moonData.name, label);
    }

    // Position moon in 3D from azimuth/altitude
    _positionMoon(mesh, moonData, planetRadius);

    // Update phase shader uniforms
    var mat = mesh.material as THREE.ShaderMaterial;
    mat.uniforms.uIllum.value = Math.max(0, Math.min(1, moonData.phase.illum));
    mat.uniforms.uWaxing.value = moonData.phase.waxing ? 1.0 : 0.0;

    // Scale moon by angular diameter (clamped for visibility)
    var angularScale = Math.max(MIN_MOON_RADIUS, Math.min(MAX_MOON_RADIUS,
      (moonData.angularDiameterDeg || 0.5) * 0.12));
    mesh.scale.setScalar(angularScale);

    // Update label position
    var label = system.labels.get(moonData.name);
    if (label) {
      label.position.copy(mesh.position);
      label.position.y -= angularScale * 1.5;
      label.visible = moonData.category !== 'below';
    }

    mesh.visible = moonData.category !== 'below';
  }

  // Hide moons not in current scene (world change)
  system.meshes.forEach(function(mesh, name) {
    if (!activeMoonNames.has(name)) {
      mesh.visible = false;
      var lbl = system.labels.get(name);
      if (lbl) lbl.visible = false;
    }
  });
}

function _positionMoon(mesh: THREE.Mesh, moonData: SkySceneMoon, planetRadius: number) {
  // Map azimuth/altitude to 3D spherical coordinates on a viewing sphere
  var distance = moonData.orbitalDistance
    ? moonData.orbitalDistance * ORBIT_SCALE_BASE + planetRadius + 2
    : planetRadius + 3 + Math.random() * 8;

  // Clamp distance to reasonable scene range
  distance = Math.max(planetRadius + 2, Math.min(60, distance));

  var az = ((moonData.azimuth || 180) - 180) * DEG2RAD;
  var alt = (moonData.altitudeExact || 0) * DEG2RAD;

  mesh.position.set(
    distance * Math.cos(alt) * Math.sin(az),
    distance * Math.sin(alt),
    distance * Math.cos(alt) * Math.cos(az)
  );
}

function _createMoonMesh(moonData: SkySceneMoon): THREE.Mesh {
  var geo = new THREE.SphereGeometry(1, 32, 24);

  // Generate procedural texture from existing sky-textures system
  var color = moonData.color || '#cccccc';
  var texCanvas = getMoonTexture(moonData.name, color, 128);
  var texture = new THREE.CanvasTexture(texCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  var albedo = Number(moonData.albedo) || 0.12;

  var mat = new THREE.ShaderMaterial({
    vertexShader: MOON_VERT,
    fragmentShader: MOON_FRAG,
    uniforms: {
      uMap: { value: texture },
      uIllum: { value: Math.max(0, Math.min(1, moonData.phase.illum)) },
      uWaxing: { value: moonData.phase.waxing ? 1.0 : 0.0 },
      uAlbedo: { value: albedo },
      uColor: { value: new THREE.Color(color) },
      uRetrograde: { value: moonData.retrograde ? 1.0 : 0.0 }
    },
    transparent: false
  });

  var mesh = new THREE.Mesh(geo, mat);
  mesh.name = moonData.name;
  return mesh;
}

function _createLabel(name: string): THREE.Sprite {
  var cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 64;
  var cx = cv.getContext('2d')!;
  cx.font = '24px "Trebuchet MS", "Gill Sans", sans-serif';
  cx.fillStyle = 'rgba(247, 242, 232, 0.85)';
  cx.textAlign = 'center';
  cx.textBaseline = 'middle';
  cx.fillText(name, 128, 32);

  var tex = new THREE.CanvasTexture(cv);
  var mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true
  });
  var sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.5, 0.625, 1);
  return sprite;
}

// ── Moon phase shader ──
// Renders independent magical phases per Eberron lore.
// The terminator is computed in the fragment shader from uIllum/uWaxing.

var MOON_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mvPos.xyz);
  gl_Position = projectionMatrix * mvPos;
}
`;

var MOON_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uIllum;
uniform float uWaxing;
uniform float uAlbedo;
uniform vec3 uColor;
uniform float uRetrograde;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec4 texColor = texture2D(uMap, vUv);

  // Compute terminator shadow based on phase illumination.
  // This uses the object-space x-coordinate to determine lit/shadow side.
  // The terminator position comes from the illumination fraction.

  // Map UV x to [-1, 1] range across the sphere face
  // Use normal.x as a proxy for the horizontal position on the sphere
  float nx = vNormal.x;

  // Flip for retrograde or waning
  float wax = uWaxing;
  if (uRetrograde > 0.5) wax = 1.0 - wax;

  // Compute terminator: the boundary between lit and shadow
  // cos(illum * PI) gives the x-position of the terminator line
  float terminatorX = cos(uIllum * 3.14159);

  // Determine shadow: for waxing, shadow is on the left (negative x)
  float shadow;
  if (wax > 0.5) {
    // Waxing: lit from right, shadow on left
    shadow = smoothstep(terminatorX - 0.08, terminatorX + 0.08, nx);
  } else {
    // Waning: lit from left, shadow on right
    shadow = smoothstep(-terminatorX - 0.08, -terminatorX + 0.08, -nx);
  }

  // Rim lighting — subtle edge glow on the lit side
  float rim = 1.0 - max(0.0, dot(vNormal, vViewDir));
  float rimGlow = pow(rim, 2.5) * 0.3 * shadow;

  // Base brightness: lit side gets albedo-scaled brightness, shadow gets dim ambient
  float ambientShadow = 0.04; // Very dim on shadow side
  float brightness = mix(ambientShadow, 0.6 + uAlbedo * 0.5, shadow);

  vec3 finalColor = texColor.rgb * brightness + uColor * rimGlow;

  // Emissive boost for bloom (bright moons like Barrakas glow)
  float emissive = max(0.0, (uAlbedo - 0.5) * 0.3) * shadow;
  finalColor += texColor.rgb * emissive;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

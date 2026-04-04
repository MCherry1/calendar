// Three.js sky renderer - replaces Canvas 2D rendering with full 3D scene
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { getMoonTexture, generateStarField, generateMilkyWay, StarData, MilkyWayParticle } from './sky-textures.js';
import type { SkyScene, SkySceneMoon } from '../src/showcase/sky-scene.js';

// ── Constants ──
var SKY_RADIUS = 500;
var STAR_RADIUS = 490;
var SUN_RADIUS = 480;
var MOON_RADIUS = 460;
var LAND_FRAC = 0.12;
var SKY_ALT_MAX = 70;
var SUN_ANGULAR_DIAM = 0.53;
var DEG2RAD = Math.PI / 180;

// ── Module state ──
var _renderer: THREE.WebGLRenderer | null = null;
var _scene: THREE.Scene | null = null;
var _camera: THREE.PerspectiveCamera | null = null;
var _composer: EffectComposer | null = null;
var _canvas: HTMLCanvasElement | null = null;

// Sky dome
var _skyMesh: THREE.Mesh | null = null;
var _skyUniforms: Record<string, THREE.IUniform> = {};

// Stars
var _starGroup: THREE.Group | null = null;
var _starPoints: THREE.Points | null = null;
var _milkyWayPoints: THREE.Points | null = null;
var _starWorldId = '';
var _starData: StarData[] | null = null;

// Sun
var _sunSprite: THREE.Sprite | null = null;
var _sunLabelSprite: THREE.Sprite | null = null;
var _sunLight: THREE.DirectionalLight | null = null;
var _ambientLight: THREE.AmbientLight | null = null;

// Moons
var _moonGroup: THREE.Group | null = null;
var _moonMeshes: { mesh: THREE.Mesh; label: THREE.Sprite; moon: any; name: string }[] = [];
var _moonScreenPositions: { name: string; x: number; y: number; radius: number; moon: any }[] = [];

// Ring of Siberys
var _ringGroup: THREE.Group | null = null;
var _ringMesh: THREE.Mesh | null = null;
var _ringParticles: THREE.Points | null = null;
var _ringLabel: THREE.Sprite | null = null;

// Landscape
var _landscapeGroup: THREE.Group | null = null;

// Clouds
var _cloudSprites: THREE.Sprite[] = [];
var _cloudSeeds: { az: number; alt: number; rx: number; ry: number; alpha: number; speed: number }[] = [];

// Texture cache
var _texCache = new Map<string, THREE.CanvasTexture>();

// ── Coordinate helpers ──
function _azAltToWorld(azDeg: number, altDeg: number, radius: number): THREE.Vector3 {
  var azRad = azDeg * DEG2RAD;
  var altRad = altDeg * DEG2RAD;
  return new THREE.Vector3(
    -Math.sin(azRad) * Math.cos(altRad) * radius,
    Math.sin(altRad) * radius,
    -Math.cos(azRad) * Math.cos(altRad) * radius
  );
}

function _smoothstep(edge0: number, edge1: number, x: number): number {
  var t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function _moonRadiusPx(angularDiameterDeg: number, mode: string, canvasH: number): number {
  if (mode === 'true') {
    var skyH = canvasH * (1 - LAND_FRAC);
    var pxPerDegree = skyH / SKY_ALT_MAX;
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

// ── Sky dome shader ──
var SKY_VERTEX = `
varying vec3 vWorldPos;
void main() {
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

var SKY_FRAGMENT = `
uniform vec3 uSunDir;
uniform float uSunAlt;
uniform float uTime;
varying vec3 vWorldPos;

vec3 nightTop = vec3(0.024, 0.055, 0.118);
vec3 nightBot = vec3(0.118, 0.082, 0.063);
vec3 dayTop = vec3(0.118, 0.314, 0.627);
vec3 dayMid = vec3(0.275, 0.549, 0.824);
vec3 dayBot = vec3(0.549, 0.745, 0.902);

float smoothstepf(float e0, float e1, float x) {
  float t = clamp((x - e0) / (e1 - e0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

void main() {
  vec3 viewDir = normalize(vWorldPos);
  float altitude = asin(clamp(viewDir.y, -1.0, 1.0));
  float altNorm = clamp(altitude / 1.2217, 0.0, 1.0); // 0-70deg normalized

  // Day/night blend factors
  float nightFade = smoothstepf(-18.0, -6.0, uSunAlt);
  float dayFade = smoothstepf(0.0, 12.0, uSunAlt);
  float twilightFade = smoothstepf(-6.0, 0.0, uSunAlt);

  // Base sky colors by altitude
  vec3 nightColor = mix(nightBot, nightTop, altNorm);
  vec3 dayColor = mix(dayBot, mix(dayMid, dayTop, altNorm), altNorm);

  // Blend night -> day
  vec3 baseColor = mix(nightColor, dayColor, dayFade);

  // LOCALIZED sunset/sunrise glow
  float sunProximity = max(0.0, dot(viewDir, uSunDir));
  float sunGlow = pow(sunProximity, 4.0);
  float horizonGlow = pow(sunProximity, 1.5) * (1.0 - altNorm);

  // Warm sunset colors - only near the sun
  vec3 sunsetWarm = vec3(1.0, 0.55, 0.2);
  vec3 sunsetDeep = vec3(0.8, 0.25, 0.12);

  float twilightStrength = sin(twilightFade * 3.14159) * (1.0 - dayFade);
  vec3 sunsetColor = mix(sunsetDeep, sunsetWarm, sunGlow);

  // Apply sunset glow localized to sun direction
  baseColor = mix(baseColor, sunsetColor, twilightStrength * horizonGlow * 0.7);

  // Sun corona glow (very bright near sun disk)
  float coronaFactor = pow(sunProximity, 16.0);
  vec3 coronaColor = vec3(1.0, 0.94, 0.7);
  if (uSunAlt > -2.0) {
    float coronaStrength = smoothstepf(-2.0, 5.0, uSunAlt);
    baseColor = mix(baseColor, coronaColor, coronaFactor * coronaStrength * 0.3);
  }

  // Rayleigh-like atmospheric blue scatter (day only)
  float scatter = pow(max(0.0, sunProximity), 2.0) * dayFade;
  baseColor += vec3(0.02, 0.04, 0.08) * scatter * (1.0 - altNorm);

  gl_FragColor = vec4(baseColor, 1.0);
}
`;

// ── Ring shader ──
var RING_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

var RING_FRAGMENT = `
varying vec2 vUv;

float bandAlpha(float f) {
  if (f < 0.04) return 0.02;
  if (f < 0.22) return 0.07;
  if (f < 0.38) return 0.22;
  if (f < 0.56) return 0.18;
  if (f < 0.62) return 0.01;
  if (f < 0.82) return 0.13;
  if (f < 0.84) return 0.01;
  if (f < 0.92) return 0.10;
  if (f < 0.96) return 0.0;
  return 0.04;
}

vec3 bandColor(float f) {
  vec3 gold = vec3(0.97, 0.86, 0.55);
  vec3 dim = vec3(0.63, 0.55, 0.27);
  if (f < 0.22) return mix(dim, gold, 0.3);
  if (f < 0.56) return gold;
  if (f < 0.62) return dim * 0.5;
  if (f < 0.92) return mix(gold, dim, 0.2);
  return dim * 0.6;
}

void main() {
  // vUv.x maps from inner to outer edge (0 to 1)
  float f = vUv.x;
  float alpha = bandAlpha(f);
  vec3 color = bandColor(f);
  // Soft edges
  float edgeFade = smoothstep(0.0, 0.02, f) * smoothstep(1.0, 0.98, f);
  gl_FragColor = vec4(color, alpha * edgeFade);
}
`;

// ── Star shader ──
var STAR_VERTEX = `
attribute float aSize;
attribute float aAlpha;
attribute float aTwinkleFreq;
attribute float aTwinklePhase;
attribute float aTier;
attribute vec3 aColor;
uniform float uTime;
varying float vAlpha;
varying vec3 vColor;
varying float vTier;
void main() {
  vColor = aColor;
  vTier = aTier;
  float twinkle = sin(uTime * 6.28318 * aTwinkleFreq + aTwinklePhase);
  float amp = aTier < 0.5 ? 0.25 : (aTier < 1.5 ? 0.15 : 0.08);
  vAlpha = max(0.0, aAlpha + twinkle * amp);
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (300.0 / -mvPos.z);
  gl_Position = projectionMatrix * mvPos;
}
`;

var STAR_FRAGMENT = `
varying float vAlpha;
varying vec3 vColor;
varying float vTier;
void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  float alpha = vAlpha;
  if (vTier < 0.5) {
    // Bright stars: soft glow with cross
    alpha *= smoothstep(0.5, 0.1, dist);
  } else if (vTier < 1.5) {
    // Medium: circle
    alpha *= smoothstep(0.5, 0.2, dist);
  } else {
    // Dim: hard pixel
    if (dist > 0.5) discard;
  }
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(vColor, alpha);
}
`;

// ── Initialization ──
export function initSkyRenderer(canvas: HTMLCanvasElement): void {
  _canvas = canvas;
  var w = canvas.width;
  var h = canvas.height;

  // Renderer
  _renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  _renderer.setSize(w, h, false);
  _renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  _renderer.outputColorSpace = THREE.SRGBColorSpace;
  _renderer.toneMapping = THREE.ACESFilmicToneMapping;
  _renderer.toneMappingExposure = 1.0;

  // Scene
  _scene = new THREE.Scene();

  // Camera - looking south, FOV covers ~70deg altitude
  _camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 2000);
  _camera.position.set(0, 0, 0);
  var lookTarget = _azAltToWorld(180, 20, 100);
  _camera.lookAt(lookTarget);

  // Post-processing
  _composer = new EffectComposer(_renderer);
  _composer.addPass(new RenderPass(_scene, _camera));
  var bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.4, 0.6, 0.85);
  _composer.addPass(bloom);

  // Lighting
  _sunLight = new THREE.DirectionalLight(0xfff8e0, 1.0);
  _scene.add(_sunLight);
  _ambientLight = new THREE.AmbientLight(0x1a2040, 0.15);
  _scene.add(_ambientLight);

  // Create scene elements
  _createSkyDome();
  _createStarField('eberron');
  _createSunSprite();
  _moonGroup = new THREE.Group();
  _scene.add(_moonGroup);
  _ringGroup = new THREE.Group();
  _scene.add(_ringGroup);
  _createLandscape();
  _initCloudSeeds();
}

// ── Sky dome creation ──
function _createSkyDome() {
  if (!_scene) return;
  var geo = new THREE.SphereGeometry(SKY_RADIUS, 64, 32);
  _skyUniforms = {
    uSunDir: { value: new THREE.Vector3(0, 0, -1) },
    uSunAlt: { value: 0.0 },
    uTime: { value: 0.0 }
  };
  var mat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
    uniforms: _skyUniforms,
    side: THREE.BackSide,
    depthWrite: false
  });
  _skyMesh = new THREE.Mesh(geo, mat);
  _scene.add(_skyMesh);
}

// ── Star field ──
function _createStarField(worldId: string) {
  if (!_scene) return;
  if (_starGroup) { _scene.remove(_starGroup); _starGroup = null; }
  _starGroup = new THREE.Group();
  _starWorldId = worldId;

  var w = _canvas ? _canvas.width : 1120;
  var h = _canvas ? _canvas.height : 630;
  _starData = generateStarField(w, h, worldId, 0, 0);
  var milkyWayData = generateMilkyWay(w, h, worldId, 0, 0);

  // Star points
  var count = _starData.length;
  var positions = new Float32Array(count * 3);
  var sizes = new Float32Array(count);
  var alphas = new Float32Array(count);
  var freqs = new Float32Array(count);
  var phases = new Float32Array(count);
  var tiers = new Float32Array(count);
  var colors = new Float32Array(count * 3);

  for (var i = 0; i < count; i++) {
    var s = _starData[i];
    var pos = _azAltToWorld(s.az, s.alt, STAR_RADIUS);
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;
    sizes[i] = s.size * 2;
    alphas[i] = s.baseAlpha;
    freqs[i] = s.twinkleFreq;
    phases[i] = s.twinklePhase;
    tiers[i] = s.tier;
    colors[i * 3] = s.r / 255;
    colors[i * 3 + 1] = s.g / 255;
    colors[i * 3 + 2] = s.b / 255;
  }

  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
  geo.setAttribute('aTwinkleFreq', new THREE.BufferAttribute(freqs, 1));
  geo.setAttribute('aTwinklePhase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aTier', new THREE.BufferAttribute(tiers, 1));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

  var mat = new THREE.ShaderMaterial({
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
    uniforms: { uTime: { value: 0.0 } },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  _starPoints = new THREE.Points(geo, mat);
  _starGroup.add(_starPoints);

  // Milky Way particles
  var mwCount = milkyWayData.length;
  var mwPositions = new Float32Array(mwCount * 3);
  var mwSizes = new Float32Array(mwCount);
  var mwAlphas = new Float32Array(mwCount);
  var mwFreqs = new Float32Array(mwCount);
  var mwPhases = new Float32Array(mwCount);
  var mwTiers = new Float32Array(mwCount);
  var mwColors = new Float32Array(mwCount * 3);

  for (var mi = 0; mi < mwCount; mi++) {
    var mp = milkyWayData[mi];
    var mpos = _azAltToWorld(mp.az, mp.alt, STAR_RADIUS - 5);
    mwPositions[mi * 3] = mpos.x;
    mwPositions[mi * 3 + 1] = mpos.y;
    mwPositions[mi * 3 + 2] = mpos.z;
    mwSizes[mi] = mp.size * 1.5;
    mwAlphas[mi] = mp.alpha * 0.3;
    mwFreqs[mi] = 0;
    mwPhases[mi] = 0;
    mwTiers[mi] = 2;
    mwColors[mi * 3] = 0.86;
    mwColors[mi * 3 + 1] = 0.84;
    mwColors[mi * 3 + 2] = 0.78;
  }

  var mwGeo = new THREE.BufferGeometry();
  mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPositions, 3));
  mwGeo.setAttribute('aSize', new THREE.BufferAttribute(mwSizes, 1));
  mwGeo.setAttribute('aAlpha', new THREE.BufferAttribute(mwAlphas, 1));
  mwGeo.setAttribute('aTwinkleFreq', new THREE.BufferAttribute(mwFreqs, 1));
  mwGeo.setAttribute('aTwinklePhase', new THREE.BufferAttribute(mwPhases, 1));
  mwGeo.setAttribute('aTier', new THREE.BufferAttribute(mwTiers, 1));
  mwGeo.setAttribute('aColor', new THREE.BufferAttribute(mwColors, 3));

  var mwMat = new THREE.ShaderMaterial({
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
    uniforms: { uTime: { value: 0.0 } },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  _milkyWayPoints = new THREE.Points(mwGeo, mwMat);
  _starGroup.add(_milkyWayPoints);

  _scene!.add(_starGroup);
}

// ── Sun sprite ──
function _createSunSprite() {
  if (!_scene) return;
  var sunTex = _makeSunTexture();
  var mat = new THREE.SpriteMaterial({
    map: sunTex,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true
  });
  _sunSprite = new THREE.Sprite(mat);
  _sunSprite.visible = false;
  _scene.add(_sunSprite);
}

function _makeSunTexture(): THREE.CanvasTexture {
  var size = 128;
  var cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  var cx = cv.getContext('2d')!;
  var r = size / 2;
  var grad = cx.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, 'rgba(255,255,240,1)');
  grad.addColorStop(0.15, 'rgba(255,250,200,0.9)');
  grad.addColorStop(0.4, 'rgba(255,230,150,0.3)');
  grad.addColorStop(0.7, 'rgba(255,200,100,0.05)');
  grad.addColorStop(1, 'rgba(255,180,80,0)');
  cx.fillStyle = grad;
  cx.fillRect(0, 0, size, size);
  var tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  return tex;
}

function _makeTextSprite(text: string, color: string, fontSize: number): THREE.Sprite {
  var cv = document.createElement('canvas');
  cv.width = 256; cv.height = 64;
  var cx = cv.getContext('2d')!;
  cx.font = fontSize + 'px "Trebuchet MS", "Gill Sans", sans-serif';
  cx.textAlign = 'center';
  cx.fillStyle = color;
  cx.fillText(text, 128, 40);
  var tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  var sprite = new THREE.Sprite(mat);
  sprite.scale.set(40, 10, 1);
  return sprite;
}

// ── Moon creation ──
function _getCanvasTexture(moonName: string, color: string, radius: number): THREE.CanvasTexture {
  var key = moonName + ':' + Math.round(radius);
  var cached = _texCache.get(key);
  if (cached) return cached;
  var cv = getMoonTexture(moonName, color, radius);
  var tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  _texCache.set(key, tex);
  return tex;
}

function _updateMoons(scene: SkyScene, sunDir: THREE.Vector3, lunarSizeMode: string) {
  if (!_moonGroup || !_scene || !_camera || !_canvas) return;

  // Clear old moons
  while (_moonGroup.children.length > 0) {
    var child = _moonGroup.children[0];
    _moonGroup.remove(child);
    if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
  }
  _moonMeshes = [];
  _moonScreenPositions = [];

  var canvasH = _canvas.height;
  var labeled = 0;

  for (var i = 0; i < scene.moons.length; i++) {
    var moon = scene.moons[i];
    if (moon.category === 'below') continue;
    if (moon.altitudeExact < -3) continue;

    var radiusPx = _moonRadiusPx(moon.angularDiameterDeg, lunarSizeMode, canvasH);
    // Convert pixel radius to world-space scale (~0.1 units per pixel)
    var worldScale = radiusPx * 0.12;

    // Position moon in 3D
    var moonPos = _azAltToWorld(moon.azimuth, moon.altitudeExact, MOON_RADIUS);

    // Create sphere
    var geo = new THREE.SphereGeometry(worldScale, 24, 16);
    var color = moon.color || '#d8dee7';
    var tex = _getCanvasTexture(moon.name, color, radiusPx);
    var mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.9,
      metalness: 0.0,
      emissive: new THREE.Color(color).multiplyScalar(0.05)
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(moonPos);

    // Orient moon to face camera roughly
    mesh.lookAt(_camera.position);

    _moonGroup.add(mesh);

    // Label
    var labelColor = 'rgba(247, 242, 232, 0.9)';
    var label = _makeTextSprite(moon.name, labelColor, 18);
    label.position.copy(moonPos);
    label.position.y -= worldScale + 3;
    if (labeled < 8 && moon.altitudeExact >= 2) {
      _moonGroup.add(label);
      labeled++;
    }

    _moonMeshes.push({ mesh: mesh, label: label, moon: moon, name: moon.name });

    // Project to screen coords for click detection
    var screenPos = moonPos.clone().project(_camera);
    var halfW = _canvas.width / 2;
    var halfH = _canvas.height / 2;
    _moonScreenPositions.push({
      name: moon.name,
      x: (screenPos.x * halfW) + halfW,
      y: -(screenPos.y * halfH) + halfH,
      radius: radiusPx,
      moon: moon
    });
  }
}

// ── Ring of Siberys ──
function _updateRing(worldId: string, observerLat: number, serial: number, timeFrac: number) {
  if (!_ringGroup || !_scene) return;

  // Clear old ring
  while (_ringGroup.children.length > 0) {
    var child = _ringGroup.children[0];
    _ringGroup.remove(child);
  }

  if (worldId !== 'eberron') return;

  var latRad = observerLat * DEG2RAD;
  var innerRadius = 80;
  var outerRadius = 140;
  var segments = 128;

  // Ring geometry - a flat annulus tilted to equatorial plane
  var geo = new THREE.RingGeometry(innerRadius, outerRadius, segments, 1);
  // Map UV.x to ring fraction (inner=0, outer=1)
  var uvAttr = geo.getAttribute('uv');
  var posAttr = geo.getAttribute('position');
  for (var vi = 0; vi < uvAttr.count; vi++) {
    var px = posAttr.getX(vi);
    var py = posAttr.getY(vi);
    var dist = Math.sqrt(px * px + py * py);
    var f = (dist - innerRadius) / (outerRadius - innerRadius);
    uvAttr.setXY(vi, f, uvAttr.getY(vi));
  }
  uvAttr.needsUpdate = true;

  var mat = new THREE.ShaderMaterial({
    vertexShader: RING_VERTEX,
    fragmentShader: RING_FRAGMENT,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.NormalBlending
  });

  _ringMesh = new THREE.Mesh(geo, mat);
  // Tilt ring to equatorial plane relative to observer
  _ringMesh.rotation.x = -Math.PI / 2 + latRad;
  _ringGroup.add(_ringMesh);

  // Drift particles
  var driftTime = serial + timeFrac;
  var DRIFT_INNER = 1666;
  var DRIFT_OUTER = 895;
  var particleCount = 400;
  var pPositions: number[] = [];
  var pSizes: number[] = [];
  var pAlphas: number[] = [];

  for (var s = 0; s < particleCount; s++) {
    var bandFrac = _hash('sib:band:' + s);
    var density = bandFrac < 0.04 ? 0.1 : bandFrac < 0.22 ? 0.4 : bandFrac < 0.56 ? 1.0 : bandFrac < 0.62 ? 0.03 : bandFrac < 0.82 ? 0.7 : bandFrac < 0.84 ? 0.03 : bandFrac < 0.92 ? 0.55 : bandFrac < 0.96 ? 0.0 : 0.2;
    if (_hash('sib:keep:' + s) > density) continue;

    var baseAngle = _hash('sib:angle:' + s) * 360;
    var driftRate = DRIFT_INNER - bandFrac * (DRIFT_INNER - DRIFT_OUTER);
    var angle = ((baseAngle + driftTime * driftRate) % 360 + 360) % 360;
    var angleRad = angle * DEG2RAD;
    var pRadius = innerRadius + bandFrac * (outerRadius - innerRadius);

    var shimmerFreq = 0.3 + _hash('sib:freq:' + s) * 1.2;
    var shimmerPhase = _hash('sib:phase:' + s) * Math.PI * 2;
    var shimmer = 0.6 + 0.4 * Math.sin(driftTime * shimmerFreq * Math.PI * 2 + shimmerPhase);
    var bandBright = bandFrac < 0.22 ? 0.4 : (bandFrac < 0.56 ? 1.0 : 0.7);
    var alpha = (0.08 + shimmer * 0.27) * bandBright;

    pPositions.push(Math.cos(angleRad) * pRadius, 0, Math.sin(angleRad) * pRadius);
    pSizes.push(1.5 + _hash('sib:size:' + s) * 2.5);
    pAlphas.push(alpha);
  }

  if (pPositions.length > 0) {
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(pPositions, 3));
    var pMat = new THREE.PointsMaterial({
      size: 2,
      color: 0xffedB2,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    _ringParticles = new THREE.Points(pGeo, pMat);
    _ringParticles.rotation.x = -Math.PI / 2 + latRad;
    _ringGroup.add(_ringParticles);
  }

  // Ring label
  _ringLabel = _makeTextSprite('Ring of Siberys', 'rgba(255, 235, 191, 0.8)', 16);
  _ringLabel.position.copy(_azAltToWorld(200, 45, MOON_RADIUS));
  _ringGroup.add(_ringLabel);
}

// ── Landscape ──
function _createLandscape() {
  if (!_scene) return;
  _landscapeGroup = new THREE.Group();

  // Create mountain silhouette as a mesh below the horizon
  var ridges = [
    { color: 0x080c16, colorDay: 0x0e1820, yScale: 0.7, seed: 1 },
    { color: 0x060a12, colorDay: 0x0a1418, yScale: 0.5, seed: 2 },
    { color: 0x040810, colorDay: 0x080e14, yScale: 0.35, seed: 3 }
  ];

  for (var ri = 0; ri < ridges.length; ri++) {
    var ridge = ridges[ri];
    var segments = 100;
    var width = SKY_RADIUS * 3;
    var shape = new THREE.Shape();
    shape.moveTo(-width / 2, -50);

    for (var si = 0; si <= segments; si++) {
      var t = si / segments;
      var x = -width / 2 + t * width;
      var y = 0;
      var s1 = Math.sin(t * Math.PI * 2.3 * (ridge.seed + 0.5) + ridge.seed) * 0.4;
      var s2 = Math.sin(t * Math.PI * 4.7 * ridge.seed + 1.2) * 0.25;
      var s3 = Math.sin(t * Math.PI * 7.1 + 2.8 * ridge.seed) * 0.12;
      y = (s1 + s2 + s3) * 15 * ridge.yScale;
      shape.lineTo(x, y);
    }
    shape.lineTo(width / 2, -50);
    shape.lineTo(-width / 2, -50);

    var geo = new THREE.ShapeGeometry(shape);
    var mat = new THREE.MeshBasicMaterial({
      color: ridge.color,
      side: THREE.DoubleSide,
      depthWrite: true
    });
    var mesh = new THREE.Mesh(geo, mat);
    // Position at horizon, facing up from below
    mesh.position.set(0, -5 - ri * 2, -SKY_RADIUS * 0.8);
    mesh.rotation.x = 0;
    (mesh as any)._ridgeData = ridge;
    _landscapeGroup.add(mesh);
  }

  // Ground plane
  var groundGeo = new THREE.PlaneGeometry(SKY_RADIUS * 4, SKY_RADIUS * 2);
  var groundMat = new THREE.MeshBasicMaterial({ color: 0x040810, side: THREE.DoubleSide });
  var ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.set(0, -20, -SKY_RADIUS * 0.4);
  ground.rotation.x = -Math.PI / 2;
  _landscapeGroup.add(ground);

  _scene.add(_landscapeGroup);
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

function _updateClouds(timeFrac: number, sunAlt: number) {
  if (!_scene) return;

  // Remove old cloud sprites
  for (var ci = 0; ci < _cloudSprites.length; ci++) {
    _scene.remove(_cloudSprites[ci]);
  }
  _cloudSprites = [];

  var isNight = sunAlt < -6;
  var isTwilight = sunAlt >= -6 && sunAlt < 6;
  var cloudR = isNight ? 100 : isTwilight ? 255 : 220;
  var cloudG = isNight ? 110 : isTwilight ? 180 : 225;
  var cloudB = isNight ? 130 : isTwilight ? 140 : 240;
  var baseFade = isNight ? 0.4 : 0.7;

  for (var i = 0; i < _cloudSeeds.length; i++) {
    var c = _cloudSeeds[i];
    var driftAz = (c.az + timeFrac * c.speed * 3600) % 360;

    // Cloud texture
    var cv = document.createElement('canvas');
    cv.width = 64; cv.height = 32;
    var cx = cv.getContext('2d')!;
    var grad = cx.createRadialGradient(32, 16, 0, 32, 16, 30);
    var alpha = c.alpha * baseFade;
    grad.addColorStop(0, 'rgba(' + cloudR + ',' + cloudG + ',' + cloudB + ',' + alpha + ')');
    grad.addColorStop(0.5, 'rgba(' + cloudR + ',' + cloudG + ',' + cloudB + ',' + (alpha * 0.4) + ')');
    grad.addColorStop(1, 'rgba(' + cloudR + ',' + cloudG + ',' + cloudB + ',0)');
    cx.fillStyle = grad;
    cx.fillRect(0, 0, 64, 32);
    var tex = new THREE.CanvasTexture(cv);
    tex.needsUpdate = true;

    var mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    var sprite = new THREE.Sprite(mat);
    var pos = _azAltToWorld(driftAz, c.alt, SKY_RADIUS * 0.7);
    sprite.position.copy(pos);
    sprite.scale.set(c.rx * 0.8, c.ry * 0.8, 1);
    _cloudSprites.push(sprite);
    _scene.add(sprite);
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
  if (!_renderer || !_scene || !_camera || !_composer) return;

  // Rebuild star field if world changed
  if (worldId !== _starWorldId) {
    _createStarField(worldId);
  }

  // Sun direction
  var sunDir = _azAltToWorld(sunAz, sunAlt, 1).normalize();
  var sunPos = _azAltToWorld(sunAz, sunAlt, SUN_RADIUS);

  // Update sky dome uniforms
  if (_skyUniforms.uSunDir) _skyUniforms.uSunDir.value.copy(sunDir);
  if (_skyUniforms.uSunAlt) _skyUniforms.uSunAlt.value = sunAlt;
  if (_skyUniforms.uTime) _skyUniforms.uTime.value = timeFrac;

  // Star visibility and rotation
  var starAlpha = 1 - _smoothstep(-12, 6, sunAlt);
  if (_starGroup) {
    _starGroup.visible = starAlpha > 0.01;
    // Daily rotation: stars move with timeFrac
    _starGroup.rotation.y = timeFrac * Math.PI * 2;
    // Update star twinkle time
    if (_starPoints) {
      var starMat = _starPoints.material as THREE.ShaderMaterial;
      starMat.uniforms.uTime.value = timeFrac;
      starMat.opacity = starAlpha;
    }
    if (_milkyWayPoints) {
      var mwMat = _milkyWayPoints.material as THREE.ShaderMaterial;
      mwMat.uniforms.uTime.value = timeFrac;
      mwMat.opacity = starAlpha;
    }
  }

  // Sun position and visibility
  if (_sunSprite) {
    if (sunAlt >= -2) {
      _sunSprite.visible = true;
      _sunSprite.position.copy(sunPos);
      // Size
      var canvasH = _canvas ? _canvas.height : 630;
      var sunRadPx = _moonRadiusPx(SUN_ANGULAR_DIAM, lunarSizeMode, canvasH);
      _sunSprite.scale.set(sunRadPx * 0.3, sunRadPx * 0.3, 1);
    } else {
      _sunSprite.visible = false;
    }
  }

  // Sun label
  if (_sunLabelSprite) _scene.remove(_sunLabelSprite);
  _sunLabelSprite = null;
  if (scene.sunName && sunAlt >= 2 && _sunSprite && _sunSprite.visible) {
    _sunLabelSprite = _makeTextSprite(scene.sunName, 'rgba(255, 240, 200, 0.85)', 16);
    _sunLabelSprite.position.copy(sunPos);
    _sunLabelSprite.position.y -= 8;
    _scene.add(_sunLabelSprite);
  }

  // Sun directional light
  if (_sunLight) {
    _sunLight.position.copy(sunDir.clone().multiplyScalar(100));
    _sunLight.intensity = Math.max(0.1, _smoothstep(-6, 15, sunAlt));
  }
  // Ambient light - brighter during day
  if (_ambientLight) {
    var ambientStrength = 0.05 + _smoothstep(-12, 6, sunAlt) * 0.15;
    _ambientLight.intensity = ambientStrength;
  }

  // Moon dimming during day
  var moonDimming = Math.max(0.4, 1 - _smoothstep(-6, 12, sunAlt) * 0.6);

  // Update moons
  _updateMoons(scene, sunDir, lunarSizeMode);
  if (_moonGroup) {
    for (var mi = 0; mi < _moonGroup.children.length; mi++) {
      var child = _moonGroup.children[mi];
      if ((child as THREE.Mesh).isMesh) {
        var meshMat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (meshMat.opacity !== undefined) {
          meshMat.transparent = moonDimming < 0.99;
          meshMat.opacity = moonDimming;
        }
      }
    }
  }

  // Ring of Siberys
  _updateRing(worldId, scene.observerLatitude, serial, timeFrac);
  if (_ringGroup) {
    _ringGroup.visible = worldId === 'eberron';
    if (worldId === 'eberron') {
      var ringAlpha = Math.max(0.15, starAlpha);
      // Ring visibility based on time of day
      _ringGroup.traverse(function(obj) {
        if ((obj as THREE.Mesh).material) {
          var m = (obj as THREE.Mesh).material as any;
          if (m.opacity !== undefined) m.opacity = ringAlpha;
        }
      });
    }
  }

  // Clouds
  _updateClouds(timeFrac, sunAlt);

  // Render
  _composer.render();
}

// ── Cleanup ──
export function disposeSkyRenderer(): void {
  if (_renderer) { _renderer.dispose(); _renderer = null; }
  if (_composer) { _composer = null; }
  _scene = null;
  _camera = null;
  _texCache.clear();
  _moonMeshes = [];
  _moonScreenPositions = [];
}

// ── Moon screen positions for click/hover ──
export function getMoonScreenPositions(): { name: string; x: number; y: number; radius: number; moon: any }[] {
  return _moonScreenPositions;
}

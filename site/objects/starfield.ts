// Starfield background — thousands of stars on a sky sphere with twinkling,
// plus a Milky Way band of dense dimmer points.

import * as THREE from 'three';

var STAR_COUNT = 2500;
var MILKY_WAY_COUNT = 4000;
var SKY_RADIUS = 8000;

export function createStarfield(): THREE.Group {
  var group = new THREE.Group();

  // Main stars
  group.add(_createStars());

  // Milky Way band
  group.add(_createMilkyWay());

  return group;
}

function _createStars(): THREE.Points {
  var positions = new Float32Array(STAR_COUNT * 3);
  var colors = new Float32Array(STAR_COUNT * 3);
  var sizes = new Float32Array(STAR_COUNT);
  var phases = new Float32Array(STAR_COUNT);

  var starColors: [number, number, number][] = [
    [1.0, 0.97, 0.88],   // warm white
    [0.78, 0.86, 1.0],   // cool blue
    [1.0, 0.90, 0.78],   // warm orange
    [0.70, 0.78, 1.0],   // deep blue
    [1.0, 1.0, 0.94],    // neutral
    [1.0, 0.78, 0.70],   // red giant
    [0.60, 0.68, 1.0],   // hot blue-white
    [0.94, 0.98, 1.0],   // pure white
    [1.0, 0.85, 0.70],   // K-type orange
  ];

  for (var i = 0; i < STAR_COUNT; i++) {
    // Distribute on sphere using golden spiral
    var phi = Math.acos(1 - 2 * _hash('sy:' + i));
    var theta = 2 * Math.PI * _hash('sx:' + i) * 137.508;

    positions[i * 3] = SKY_RADIUS * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = SKY_RADIUS * Math.cos(phi);
    positions[i * 3 + 2] = SKY_RADIUS * Math.sin(phi) * Math.sin(theta);

    // Star tier: 30 bright, 150 medium, rest dim
    var tier = i < 30 ? 0 : i < 180 ? 1 : 2;
    sizes[i] = tier === 0 ? 3.0 + _hash('ss:' + i) * 3.0
             : tier === 1 ? 1.5 + _hash('ss:' + i) * 1.5
             : 0.5 + _hash('ss:' + i) * 1.0;

    var ci = Math.floor(_hash('sc:' + i) * starColors.length);
    var col = starColors[ci];
    // Bright stars get extra intensity
    var intensity = tier === 0 ? 1.5 : tier === 1 ? 1.0 : 0.6;
    colors[i * 3] = col[0] * intensity;
    colors[i * 3 + 1] = col[1] * intensity;
    colors[i * 3 + 2] = col[2] * intensity;

    phases[i] = _hash('sp:' + i) * Math.PI * 2;
  }

  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  var mat = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
  });

  return new THREE.Points(geo, mat);
}

function _createMilkyWay(): THREE.Points {
  var positions = new Float32Array(MILKY_WAY_COUNT * 3);
  var colors = new Float32Array(MILKY_WAY_COUNT * 3);
  var sizes = new Float32Array(MILKY_WAY_COUNT);

  // Band parameters — a stripe across the sky sphere
  var bandDecl = 0.3; // declination of band center (radians)
  var bandWidth = 0.25; // half-width in radians

  var mwColors: [number, number, number][] = [
    [0.90, 0.88, 0.80],  // warm cream
    [0.75, 0.80, 0.95],  // cool blue
    [0.90, 0.80, 0.75],  // faint rose
  ];

  for (var i = 0; i < MILKY_WAY_COUNT; i++) {
    // Gaussian-ish distribution around band center
    var yOff = (_hash('mwy1:' + i) + _hash('mwy2:' + i) + _hash('mwy3:' + i) - 1.5) / 1.5;
    var decl = bandDecl + yOff * bandWidth;
    var ra = _hash('mwx:' + i) * Math.PI * 2;

    var r = SKY_RADIUS * 0.99;
    positions[i * 3] = r * Math.cos(decl) * Math.cos(ra);
    positions[i * 3 + 1] = r * Math.sin(decl);
    positions[i * 3 + 2] = r * Math.cos(decl) * Math.sin(ra);

    // Brighter knots (~5% of particles are in clusters)
    var isKnot = _hash('mwk:' + i) < 0.05;
    sizes[i] = isKnot ? 1.0 + _hash('mws:' + i) * 1.5 : 0.3 + _hash('mws:' + i) * 0.6;

    var ci = Math.floor(_hash('mwc:' + i) * mwColors.length);
    var col = mwColors[ci];
    var alpha = isKnot ? 0.4 : 0.12 + _hash('mwa:' + i) * 0.15;
    colors[i * 3] = col[0] * alpha;
    colors[i * 3 + 1] = col[1] * alpha;
    colors[i * 3 + 2] = col[2] * alpha;
  }

  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  var mat = new THREE.ShaderMaterial({
    vertexShader: MW_VERT,
    fragmentShader: MW_FRAG,
    uniforms: {
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
  });

  return new THREE.Points(geo, mat);
}

function _hash(input: string): number {
  var hash = 2166136261;
  for (var i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

// ── Star shader with twinkle ──

var STAR_VERT = /* glsl */ `
attribute float aSize;
attribute float aPhase;
uniform float uTime;
uniform float uPixelRatio;
varying vec3 vColor;
varying float vBrightness;

void main() {
  vColor = color;

  // Twinkle: frequency varies by star
  float freq = 2.0 + aPhase * 6.0;
  float twinkle = sin(uTime * 6.28318 * freq + aPhase) * 0.3 + 0.7;
  vBrightness = twinkle;

  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = max(1.0, aSize * uPixelRatio * twinkle);
  gl_Position = projectionMatrix * mvPos;
}
`;

var STAR_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vBrightness;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  float core = 1.0 - smoothstep(0.0, 0.35, d);
  float glow = exp(-d * 4.0) * 0.5;

  // Diffraction spikes for bright stars
  vec2 c = gl_PointCoord - vec2(0.5);
  float spike = exp(-abs(c.x) * 20.0) * exp(-abs(c.y * 4.0));
  spike += exp(-abs(c.y) * 20.0) * exp(-abs(c.x * 4.0));
  spike *= 0.15;

  float alpha = (core + glow + spike) * vBrightness;
  gl_FragColor = vec4(vColor, alpha);
}
`;

// ── Milky Way shader (no twinkle, just static glow) ──

var MW_VERT = /* glsl */ `
attribute float aSize;
uniform float uPixelRatio;
varying vec3 vColor;

void main() {
  vColor = color;
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = max(0.5, aSize * uPixelRatio);
  gl_Position = projectionMatrix * mvPos;
}
`;

var MW_FRAG = /* glsl */ `
varying vec3 vColor;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  float alpha = 1.0 - smoothstep(0.0, 0.5, d);
  gl_FragColor = vec4(vColor, alpha);
}
`;

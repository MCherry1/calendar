// Ring of Siberys — golden dragonshards orbiting Eberron's equator.
// Rendered as a ring geometry with custom shader + sparkle particles.

import * as THREE from 'three';

export type RingSystem = {
  group: THREE.Group;
  ring: THREE.Mesh;
  sparkles: THREE.Points;
  sparklePhases: Float32Array;
};

var SPARKLE_COUNT = 250;

export function createSiberysRing(planetRadius: number): RingSystem {
  var group = new THREE.Group();

  var innerRadius = planetRadius * 1.4;
  var outerRadius = planetRadius * 2.0;

  // Ring geometry
  var ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 128, 3);
  var ringMat = new THREE.ShaderMaterial({
    vertexShader: RING_VERT,
    fragmentShader: RING_FRAG,
    uniforms: {
      uInnerRadius: { value: innerRadius },
      uOuterRadius: { value: outerRadius },
      uTime: { value: 0 }
    },
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  var ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI * 0.5; // Lay flat on equatorial plane
  group.add(ring);

  // Sparkle particles along the ring
  var positions = new Float32Array(SPARKLE_COUNT * 3);
  var sizes = new Float32Array(SPARKLE_COUNT);
  var sparklePhases = new Float32Array(SPARKLE_COUNT);
  var colors = new Float32Array(SPARKLE_COUNT * 3);

  for (var i = 0; i < SPARKLE_COUNT; i++) {
    var angle = (i / SPARKLE_COUNT) * Math.PI * 2 + _hash('sa:' + i) * 0.05;
    var r = innerRadius + _hash('sr:' + i) * (outerRadius - innerRadius);
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = (_hash('sy:' + i) - 0.5) * 0.3; // slight Y scatter
    positions[i * 3 + 2] = Math.sin(angle) * r;

    sizes[i] = 0.05 + _hash('ss:' + i) * 0.15;
    sparklePhases[i] = _hash('sp:' + i) * Math.PI * 2;

    // Mostly warm gold, some blue-white
    if (_hash('sc:' + i) < 0.88) {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.9 + _hash('sg:' + i) * 0.1;
      colors[i * 3 + 2] = 0.6 + _hash('sb:' + i) * 0.2;
    } else {
      colors[i * 3] = 0.85;
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 1.0;
    }
  }

  var sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  sparkGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  sparkGeo.setAttribute('aPhase', new THREE.BufferAttribute(sparklePhases, 1));
  sparkGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  var sparkMat = new THREE.ShaderMaterial({
    vertexShader: SPARK_VERT,
    fragmentShader: SPARK_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
  });
  var sparkles = new THREE.Points(sparkGeo, sparkMat);
  group.add(sparkles);

  return { group, ring, sparkles, sparklePhases };
}

export function updateRing(ring: RingSystem, timeFrac: number) {
  var mat = ring.ring.material as THREE.ShaderMaterial;
  mat.uniforms.uTime.value = timeFrac;

  var sparkMat = ring.sparkles.material as THREE.ShaderMaterial;
  sparkMat.uniforms.uTime.value = timeFrac;
}

function _hash(input: string): number {
  var hash = 2166136261;
  for (var i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

// ── Ring shader ──

var RING_VERT = /* glsl */ `
varying vec2 vUv;
varying float vRadius;
uniform float uInnerRadius;
uniform float uOuterRadius;
void main() {
  vUv = uv;
  // Compute radius from center for the fragment shader
  vRadius = length(position.xy);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

var RING_FRAG = /* glsl */ `
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform float uTime;
varying vec2 vUv;
varying float vRadius;

void main() {
  // Normalized position within ring (0 = inner edge, 1 = outer edge)
  float t = clamp((vRadius - uInnerRadius) / (uOuterRadius - uInnerRadius), 0.0, 1.0);

  // Multi-band opacity — denser in center, fading at edges
  float band1 = exp(-pow((t - 0.35) * 4.0, 2.0)) * 0.5;
  float band2 = exp(-pow((t - 0.55) * 5.0, 2.0)) * 0.7;
  float band3 = exp(-pow((t - 0.75) * 4.0, 2.0)) * 0.3;
  float density = band1 + band2 + band3;

  // Edge fade
  float edgeFade = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.92, t);

  // Warm gold color with slight variation
  vec3 baseColor = vec3(0.95, 0.82, 0.45);
  vec3 brightColor = vec3(1.0, 0.92, 0.65);
  vec3 color = mix(baseColor, brightColor, band2);

  float alpha = density * edgeFade * 0.35;

  gl_FragColor = vec4(color * 1.5, alpha);
}
`;

// ── Sparkle particle shader ──

var SPARK_VERT = /* glsl */ `
attribute float aSize;
attribute float aPhase;
uniform float uTime;
uniform float uPixelRatio;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vColor = color;

  // Twinkle animation
  float twinkle = sin(uTime * 6.28318 * (3.0 + aPhase * 8.0) + aPhase) * 0.5 + 0.5;
  vAlpha = 0.3 + twinkle * 0.7;

  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPixelRatio * 200.0 / (-mvPos.z);
  gl_Position = projectionMatrix * mvPos;
}
`;

var SPARK_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  // Soft circular point
  float d = length(gl_PointCoord - vec2(0.5));
  float fade = 1.0 - smoothstep(0.2, 0.5, d);

  // Cross-shaped diffraction spike for bright particles
  vec2 c = gl_PointCoord - vec2(0.5);
  float spike = exp(-abs(c.x) * 12.0) * exp(-abs(c.y * 3.0));
  spike += exp(-abs(c.y) * 12.0) * exp(-abs(c.x * 3.0));
  spike *= 0.3;

  float alpha = (fade + spike) * vAlpha;
  gl_FragColor = vec4(vColor * 1.5, alpha);
}
`;

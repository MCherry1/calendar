// Eberron planet mesh with atmosphere shell.

import * as THREE from 'three';

export type PlanetGroup = {
  group: THREE.Group;
  surface: THREE.Mesh;
  atmosphere: THREE.Mesh;
};

export function createPlanet(radius: number): PlanetGroup {
  var group = new THREE.Group();

  // Planet surface
  var surfaceGeo = new THREE.SphereGeometry(radius, 64, 48);
  var surfaceTex = _generatePlanetTexture(512);
  var surfaceMat = new THREE.MeshStandardMaterial({
    map: surfaceTex,
    roughness: 0.85,
    metalness: 0.05
  });
  var surface = new THREE.Mesh(surfaceGeo, surfaceMat);
  group.add(surface);

  // Atmosphere — slightly larger, additive, glowing rim
  var atmosGeo = new THREE.SphereGeometry(radius * 1.025, 48, 32);
  var atmosMat = new THREE.ShaderMaterial({
    vertexShader: ATMOS_VERT,
    fragmentShader: ATMOS_FRAG,
    uniforms: {
      uColor: { value: new THREE.Color(0.3, 0.6, 1.0) },
      uIntensity: { value: 0.7 }
    },
    side: THREE.FrontSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  var atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
  group.add(atmosphere);

  return { group, surface, atmosphere };
}

function _generatePlanetTexture(size: number): THREE.CanvasTexture {
  var cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  var cx = cv.getContext('2d')!;

  // Base — ocean blue
  cx.fillStyle = '#1a3a5c';
  cx.fillRect(0, 0, size, size);

  // Land masses — procedural continents
  var landColors = ['#2a5c2a', '#3a6a3a', '#4a7a4a', '#5a6a40', '#3a5a30'];
  for (var i = 0; i < 40; i++) {
    var x = _hash('px:' + i) * size;
    var y = _hash('py:' + i) * size;
    var r = 10 + _hash('pr:' + i) * 60;
    var col = landColors[Math.floor(_hash('pc:' + i) * landColors.length)];
    cx.beginPath();
    cx.arc(x, y, r, 0, Math.PI * 2);
    cx.fillStyle = col;
    cx.globalAlpha = 0.6 + _hash('pa:' + i) * 0.4;
    cx.fill();
  }
  cx.globalAlpha = 1;

  // Polar ice caps
  var iceGrad = cx.createLinearGradient(0, 0, 0, size);
  iceGrad.addColorStop(0, 'rgba(220,230,240,0.7)');
  iceGrad.addColorStop(0.08, 'rgba(220,230,240,0)');
  iceGrad.addColorStop(0.92, 'rgba(220,230,240,0)');
  iceGrad.addColorStop(1, 'rgba(220,230,240,0.6)');
  cx.fillStyle = iceGrad;
  cx.fillRect(0, 0, size, size);

  // Cloud wisps
  cx.globalAlpha = 0.15;
  for (var j = 0; j < 80; j++) {
    var cx2 = _hash('cx:' + j) * size;
    var cy2 = _hash('cy:' + j) * size;
    var cw = 20 + _hash('cw:' + j) * 80;
    var ch = 3 + _hash('ch:' + j) * 8;
    cx.fillStyle = '#ffffff';
    cx.beginPath();
    cx.ellipse(cx2, cy2, cw, ch, _hash('ca:' + j) * Math.PI, 0, Math.PI * 2);
    cx.fill();
  }
  cx.globalAlpha = 1;

  // Noise for texture variety
  var id = cx.getImageData(0, 0, size, size);
  var d = id.data;
  for (var k = 0; k < d.length; k += 4) {
    var n = (_hash('n:' + (k / 4)) - 0.5) * 16;
    d[k] = Math.max(0, Math.min(255, d[k] + n));
    d[k + 1] = Math.max(0, Math.min(255, d[k + 1] + n));
    d[k + 2] = Math.max(0, Math.min(255, d[k + 2] + n));
  }
  cx.putImageData(id, 0, 0);

  var tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function _hash(input: string): number {
  var hash = 2166136261;
  for (var i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

var ATMOS_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-worldPos.xyz);
  gl_Position = projectionMatrix * worldPos;
}
`;

var ATMOS_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  float rim = 1.0 - max(0.0, dot(vNormal, vViewDir));
  float glow = pow(rim, 3.0) * uIntensity;
  gl_FragColor = vec4(uColor, glow);
}
`;

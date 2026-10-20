// SocialClip Reel: "Ich mache aus einem Stein eine Luxusmarke" — 1080x1920, 20 s, deterministic.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

const S = Number(new URLSearchParams(location.search).get('scale')) || 1;
const W = 2 * Math.round(1080 * S / 2), H = 2 * Math.round(1920 * S / 2);
const out = document.getElementById('c'); out.width = W; out.height = H;
const ctx = out.getContext('2d');

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, x) => a + (b - a) * x;
const eo3 = x => 1 - Math.pow(1 - x, 3);
const eo5 = x => 1 - Math.pow(1 - x, 5);
const ei3 = x => x * x * x;
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const back = x => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const C = {black: '#0B0B0B', champ: '#D6C29F', champDeep: '#B39466', white: '#F5EFE4', ink: '#151412', ui: '#1C1C1E', blue: '#0D99FF'};

// 3D simplex noise (Gustavson), seeded
function makeNoise(seed) {
  const r = mulberry32(seed), p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  const perm = new Uint8Array(512); for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const g = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  const F3 = 1 / 3, G3 = 1 / 6;
  return (x, y, z) => {
    const s = (x + y + z) * F3, i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
    const t = (i + j + k) * G3, x0 = x - i + t, y0 = y - j + t, z0 = z - k + t;
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) { if (y0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=1;k2=0; } else if (x0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=0;k2=1; } else { i1=0;j1=0;k1=1;i2=1;j2=0;k2=1; } }
    else { if (y0 < z0) { i1=0;j1=0;k1=1;i2=0;j2=1;k2=1; } else if (x0 < z0) { i1=0;j1=1;k1=0;i2=0;j2=1;k2=1; } else { i1=0;j1=1;k1=0;i2=1;j2=1;k2=0; } }
    const pts = [[x0, y0, z0, 0, 0, 0], [x0 - i1 + G3, y0 - j1 + G3, z0 - k1 + G3, i1, j1, k1], [x0 - i2 + 2 * G3, y0 - j2 + 2 * G3, z0 - k2 + 2 * G3, i2, j2, k2], [x0 - 1 + .5, y0 - 1 + .5, z0 - 1 + .5, 1, 1, 1]];
    const ii = i & 255, jj = j & 255, kk = k & 255; let n = 0;
    for (const [a, b, c, di, dj, dk] of pts) {
      let tt = .6 - a * a - b * b - c * c; if (tt < 0) continue;
      const gi = perm[ii + di + perm[jj + dj + perm[kk + dk]]] % 12; tt *= tt;
      n += tt * tt * (g[gi][0] * a + g[gi][1] * b + g[gi][2] * c);
    }
    return 32 * n;
  };
}
const noise = makeNoise(7);
const fbm = (x, y, z, o = 4) => { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * noise(x * f, y * f, z * f); f *= 2.03; a *= .5; } return s; };

// ---------- fonts ----------
const fonts = [
  new FontFace('Bodoni', 'url(fonts/BodoniModa.woff2)', {weight: '400 900', style: 'normal'}),
  new FontFace('Bodoni', 'url(fonts/BodoniModa-Italic.woff2)', {weight: '400 900', style: 'italic'}),
  new FontFace('Inter', 'url(fonts/Inter.woff2)', {weight: '300 900'}),
];
for (const f of fonts) { await f.load(); document.fonts.add(f); }

// ---------- renderer ----------
const glc = document.createElement('canvas'); glc.width = W; glc.height = H;
const renderer = new THREE.WebGLRenderer({canvas: glc, antialias: true, preserveDrawingBuffer: true});
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
const camera = new THREE.PerspectiveCamera(36, W / H, .05, 100);
const envMats = [];
const std = (o) => { const m = new THREE.MeshStandardMaterial(o); envMats.push(m); return m; };
const phys = (o) => { const m = new THREE.MeshPhysicalMaterial(o); envMats.push(m); return m; };

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// ---------- the stone (one geometry, used in every shot) ----------
let stoneGeo = new THREE.IcosahedronGeometry(1, 96);
stoneGeo.deleteAttribute('normal'); stoneGeo.deleteAttribute('uv'); stoneGeo = mergeVertices(stoneGeo);
{
  const pos = stoneGeo.attributes.position, col = new Float32Array(pos.count * 3), v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const n1 = fbm(v.x * .9 + 3.1, v.y * .9, v.z * .9, 3), n2 = fbm(v.x * 2.6, v.y * 2.6 + 7, v.z * 2.6, 3);
    const n3 = fbm(v.x * 9, v.y * 9, v.z * 9 + 4, 2), n4 = noise(v.x * 30, v.y * 30, v.z * 30);
    const r = 1 + .15 * n1 + .05 * n2 + .012 * n3 + .003 * n4;
    let x = v.x * r, y = v.y * r, z = v.z * r;
    if (y < -.3) y = -.3 + (y + .3) * .45;
    pos.setXYZ(i, x * .68, y * .44, z * .54);
    let c = .2 + .05 * fbm(v.x * 1.7 + 11, v.y * 1.7, v.z * 1.7, 3) + .025 * n2;
    const sp = noise(v.x * 42 + 5, v.y * 42, v.z * 42);
    if (sp > .6) c *= .5; else if (sp < -.64) c = Math.min(.6, c * 1.8);
    const vein = Math.abs(noise(v.x * 2.4 + 20, v.y * 2.4, v.z * 2.4));
    if (vein < .03) c = c * .5 + .2 * (1 - vein / .03);
    c *= 1 - .25 * clamp(-n3 * 2);
    col[i * 3] = c * 1.0; col[i * 3 + 1] = c * .975; col[i * 3 + 2] = c * .93;
  }
  stoneGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  stoneGeo.computeVertexNormals();
}
const stoneMat = std({vertexColors: true, roughness: .8, metalness: 0});
const stone = new THREE.Mesh(stoneGeo, stoneMat); stone.castShadow = stone.receiveShadow = true;
scene.add(stone);
const REST_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(.06, .55, -.04));
let restY = 0; const stoneSize = new THREE.Vector3();
{
  const m = new THREE.Matrix4().makeRotationFromQuaternion(REST_Q), b = new THREE.Box3(), v = new THREE.Vector3(), p = stoneGeo.attributes.position;
  for (let i = 0; i < p.count; i++) b.expandByPoint(v.fromBufferAttribute(p, i).applyMatrix4(m));
  restY = -b.min.y; b.getSize(stoneSize);
}

// ---------- boring table set ----------
const woodTex = canvasTex(1024, 1024, (g, w, h) => {
  const id = g.createImageData(w, h), d = id.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, warp = fbm(u * 2, v * 9, 1.5, 3);
    const grain = .5 + .5 * Math.sin((v * 46 + warp * 3.2) * Math.PI);
    const fine = noise(u * 300, v * 6, 9) * .5 + .5;
    const k = .86 + .07 * grain + .05 * fine;
    d[(y * w + x) * 4] = 196 * k; d[(y * w + x) * 4 + 1] = 176 * k; d[(y * w + x) * 4 + 2] = 146 * k; d[(y * w + x) * 4 + 3] = 255;
  }
  g.putImageData(id, 0, 0);
});
woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(2.2, 1.4);
const table = new THREE.Mesh(new THREE.BoxGeometry(16, .3, 9), std({map: woodTex, roughness: .55}));
table.position.set(0, -.15, -.5); table.receiveShadow = true; scene.add(table);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), std({color: 0xc4beb3, roughness: 1}));
wall.position.set(0, 5, -5); wall.receiveShadow = true; scene.add(wall);
const tableSet = [table, wall];

// ---------- luxury studio ----------
const studioBg = canvasTex(540, 960, (g, w, h) => {
  const gr = g.createRadialGradient(w * .5, h * .46, 10, w * .5, h * .46, h * .62);
  gr.addColorStop(0, '#2e261c'); gr.addColorStop(.45, '#14110d'); gr.addColorStop(1, '#040404');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
const champCol = new THREE.Color(C.champ);
const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 64), std({color: 0x0c0b0a, roughness: .38}));
floor.rotation.x = -Math.PI / 2; floor.position.y = -1.4; floor.receiveShadow = true; scene.add(floor);
const podium = new THREE.Group();
{
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 1.4, 160), phys({color: 0x090807, roughness: .62, clearcoat: .25, clearcoatRoughness: .5}));
  body.position.y = -.7; body.castShadow = body.receiveShadow = true; podium.add(body);
  const ringMat = std({color: champCol, metalness: 1, roughness: .28});
  for (const y of [-.004, -1.36]) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.452, .014, 12, 200), ringMat); r.rotation.x = Math.PI / 2; r.position.y = y; podium.add(r); }
}
scene.add(podium);
const studioSet = [floor, podium];

// light cone (fake volumetric) + dust
const coneMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: {amt: {value: 0}, col: {value: new THREE.Color(0xffe6c4)}},
  vertexShader: 'varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader: 'uniform float amt;uniform vec3 col;varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){float f=pow(abs(dot(vN,vV)),2.2);float a=amt*f*smoothstep(0.,.55,vUv.y)*(1.-smoothstep(.85,1.,vUv.y))*.5;gl_FragColor=vec4(col*a,a);}',
});
const cone = new THREE.Mesh(new THREE.CylinderGeometry(.12, 1.7, 7, 64, 1, true), coneMat);
cone.position.set(.25, 3.5, .1); scene.add(cone);
const dustN = 420, dustGeo = new THREE.BufferGeometry(), dustBase = new Float32Array(dustN * 4);
{ const r = mulberry32(3); for (let i = 0; i < dustN; i++) { const a = r() * 6.283, rad = Math.sqrt(r()) * 1.5; dustBase.set([Math.cos(a) * rad, r() * 4.5, Math.sin(a) * rad, r()], i * 4); } }
dustGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(dustN * 3), 3));
const dustTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,220,1)'); gr.addColorStop(.4, 'rgba(255,230,200,.35)'); gr.addColorStop(1, 'rgba(255,230,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
const dustMat = new THREE.PointsMaterial({map: dustTex, size: .035, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, color: 0xffe9cc});
const dust = new THREE.Points(dustGeo, dustMat); scene.add(dust);
function updateDust(t) {
  const p = dustGeo.attributes.position;
  for (let i = 0; i < dustN; i++) {
    const [x, y, z, s] = dustBase.subarray(i * 4, i * 4 + 4);
    p.setXYZ(i, x + .08 * Math.sin(t * .4 + s * 30), .2 + ((y + t * (.05 + .06 * s)) % 4.5), z + .08 * Math.cos(t * .35 + s * 17));
  }
  p.needsUpdate = true;
}

// ---------- packaging ----------
const BOX = {w: stoneSize.x + .34, d: stoneSize.z + .34, h: stoneSize.y + .22, th: .035};
function logoCanvas(g, w, h, size, sub, foil) {
  g.fillStyle = foil ? '#000' : '#121110'; g.fillRect(0, 0, w, h);
  if (!foil) { const id = g.getImageData(0, 0, w, h); const r = mulberry32(9); for (let i = 0; i < id.data.length; i += 4) { const n = (r() - .5) * 10; id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n; } g.putImageData(id, 0, 0); }
  g.fillStyle = foil ? '#fff' : C.champ; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `500 ${size}px Bodoni`; g.letterSpacing = `${size * .22}px`; g.fillText('STONE', w / 2 + size * .11, h / 2 - (sub ? size * .12 : 0));
  if (sub) { g.font = `500 ${size * .13}px Inter`; g.letterSpacing = `${size * .06}px`; g.fillText('MAISON DE PIERRE', w / 2 + size * .03, h / 2 + size * .52); }
  g.strokeStyle = foil ? '#fff' : C.champ; g.lineWidth = Math.max(2, w / 300); g.strokeRect(w * .05, h * .07, w * .9, h * .86);
}
function logoMat(w, h, size, sub) {
  const map = canvasTex(w, h, (g) => logoCanvas(g, w, h, size, sub, false));
  const foil = canvasTex(w, h, (g) => logoCanvas(g, w, h, size, sub, true), false);
  const m = std({map, metalnessMap: foil, bumpMap: foil, bumpScale: 2.5, roughness: .62, metalness: 1});
  m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.62, 0.22, texture2D(metalnessMap, vMetalnessMapUv).g);'); };
  return m;
}
const paperBlack = std({color: 0x121110, roughness: .74});
const paperChamp = std({color: 0xcbb38b, roughness: .7});
const box = new THREE.Group(); scene.add(box);
const base = new THREE.Mesh(new THREE.BoxGeometry(BOX.w + 2 * BOX.th, .02, BOX.d + 2 * BOX.th), [paperBlack, paperBlack, paperChamp, paperBlack, paperBlack, paperBlack]);
base.position.y = .01; base.receiveShadow = true; box.add(base);
const flaps = [];
{
  const front = logoMat(1024, Math.round(1024 * BOX.h / (BOX.w + 2 * BOX.th)), 150, false);
  const defs = [
    {yaw: 0, off: BOX.d / 2, wid: BOX.w + 2 * BOX.th, mat: front},
    {yaw: Math.PI / 2, off: BOX.w / 2, wid: BOX.d, mat: paperBlack},
    {yaw: Math.PI, off: BOX.d / 2, wid: BOX.w + 2 * BOX.th, mat: paperBlack},
    {yaw: -Math.PI / 2, off: BOX.w / 2, wid: BOX.d, mat: paperBlack},
  ];
  for (const f of defs) {
    const pivot = new THREE.Object3D(); pivot.rotation.order = 'YXZ'; pivot.rotation.y = f.yaw;
    pivot.position.set(Math.sin(f.yaw) * (f.off + BOX.th / 2), .02, Math.cos(f.yaw) * (f.off + BOX.th / 2));
    const m = new THREE.Mesh(new THREE.BoxGeometry(f.wid, BOX.h, BOX.th), [paperBlack, paperBlack, paperBlack, paperBlack, f.mat, paperChamp]);
    m.position.y = BOX.h / 2; m.castShadow = m.receiveShadow = true; pivot.add(m); box.add(pivot); flaps.push(pivot);
  }
}
const lidW = BOX.w + 2 * BOX.th + .03, lidD = BOX.d + 2 * BOX.th + .03, lidH = .2;
const lidTop = logoMat(1024, Math.round(1024 * lidD / lidW), 190, true);
for (const tx of [lidTop.map, lidTop.metalnessMap, lidTop.bumpMap]) { tx.center.set(.5, .5); tx.rotation = Math.PI; }
const lid = new THREE.Mesh(new THREE.BoxGeometry(lidW, lidH, lidD), [paperBlack, paperBlack, lidTop, paperChamp, paperBlack, paperBlack]);
lid.castShadow = lid.receiveShadow = true; box.add(lid);
function setBox(fold, lidT) { // fold: 0 flat net .. 1 upright, per flap; lidT: 0 (high) .. 1 closed
  flaps.forEach((p, i) => { p.rotation.x = Math.PI / 2 * (1 - fold[i]); });
  lid.position.y = .02 + BOX.h + lidH / 2 - .06 + lerp(3.2, 0, lidT);
  lid.rotation.y = lerp(.5, 0, lidT);
}

// ---------- lights ----------
const hemi = new THREE.HemisphereLight(0xf3f0e8, 0x6b6357, 1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfffdf6, 2); sun.position.set(1.2, 8, 3.5); sun.castShadow = true;
Object.assign(sun.shadow.camera, {left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20}); sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 6; scene.add(sun);
const spot = (col, x, y, z, ang, pen) => { const l = new THREE.SpotLight(col, 0, 0, ang, pen, 2); l.position.set(x, y, z); l.target.position.set(0, .3, 0); scene.add(l, l.target); return l; };
const key = spot(0xffeedb, .4, 7, 1.2, .32, .55); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0004;
const rimL = spot(0xe2c08e, -3.6, 2.4, -3.2, .5, .7);
const rimR = spot(0xf0dcb8, 3.8, 1.8, -2.8, .5, .7);
const sweep = spot(0xfff0dd, -4, 3, 3, .3, .8);
const front = spot(0xfff4e8, 0, 1.2, 6, .4, 1);

const LOOKS = {
  table: {hemi: 1.15, sun: 2.3, key: 0, rimL: 0, rimR: 0, sweep: 0, front: 0, env: .45, cone: 0, dust: 0, exp: 1},
  void: {hemi: .05, sun: 0, key: 110, rimL: 0, rimR: 0, sweep: 0, front: 4, env: .25, cone: 0, dust: 0, exp: 1},
  studio: {hemi: .05, sun: 0, key: 120, rimL: 90, rimR: 60, sweep: 0, front: 5, env: .25, cone: .25, dust: .5, exp: 1},
  drama: {hemi: .02, sun: 0, key: 170, rimL: 150, rimR: 35, sweep: 0, front: 3, env: .14, cone: .55, dust: 1, exp: 1.05},
  hero: {hemi: .04, sun: 0, key: 55, rimL: 120, rimR: 100, sweep: 0, front: 1.5, env: .3, cone: .3, dust: .8, exp: 1.08},
};
function applyLook(L) {
  hemi.intensity = L.hemi; sun.intensity = L.sun; key.intensity = L.key; rimL.intensity = L.rimL; rimR.intensity = L.rimR;
  sweep.intensity = L.sweep; front.intensity = L.front; coneMat.uniforms.amt.value = L.cone; dustMat.opacity = L.dust;
  renderer.toneMappingExposure = L.exp; for (const m of envMats) m.envMapIntensity = L.env;
  const isTable = L.sun > 0;
  tableSet.forEach(o => o.visible = isTable); studioSet.forEach(o => o.visible = !isTable);
  scene.background = isTable ? new THREE.Color(0xc4beb3) : studioBg;
  cone.visible = L.cone > 0; dust.visible = L.dust > 0;
}
const mixLook = (a, b, x) => { const o = {}; for (const k in a) o[k] = lerp(a[k], b[k], x); if (x < 1) o.sun = a.sun ? a.sun : 0; return o; };

function orbit(target, az, el, dist, fov = 36) {
  const a = az * Math.PI / 180, e = el * Math.PI / 180;
  camera.position.set(target[0] + Math.sin(a) * Math.cos(e) * dist, target[1] + Math.sin(e) * dist, target[2] + Math.cos(a) * Math.cos(e) * dist);
  camera.lookAt(target[0], target[1], target[2]); camera.fov = fov; camera.updateProjectionMatrix();
}
const TABLE_CAM = [[0, .95, 0], 0, 13, 7.4];
function project(x, y, z) { const v = new THREE.Vector3(x, y, z).project(camera); return [(v.x + 1) / 2 * 1080, (1 - v.y) / 2 * 1920]; }

// ---------- stone pose over time ----------
const TL = .33, G = 18, H0 = 2.6, V0 = (H0 - .5 * G * TL * TL) / TL, BOUNCE_H = .055, TB = 2 * Math.sqrt(2 * BOUNCE_H / G);
function stonePoseTable(t) {
  const q = REST_Q.clone(); let y = restY;
  if (t < TL) {
    y += H0 - V0 * t - .5 * G * t * t;
    q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(.6, .2, .77).normalize(), -1.1 * (1 - t / TL)));
  } else if (t < TL + TB) {
    const u = t - TL; y += Math.sqrt(2 * G * BOUNCE_H) * u - .5 * G * u * u;
    q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, .3).normalize(), .05 * Math.sin(u / TB * Math.PI)));
  } else {
    const u = t - TL - TB; q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, .3).normalize(), -.025 * Math.exp(-u * 9) * Math.sin(u * 40)));
  }
  stone.position.set(0, y, 0); stone.quaternion.copy(q);
}
function stoneRest(yOff = 0) { stone.position.set(0, restY + yOff, 0); stone.quaternion.copy(REST_Q); }

// ---------- 2D drawing helpers ----------
function text(str, x, y, o = {}) {
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.font = `${o.style || 'normal'} ${o.weight || 700} ${o.size || 60}px ${o.font || 'Inter'}, "Noto Color Emoji"`;
  ctx.letterSpacing = `${o.ls || 0}px`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'alphabetic';
  ctx.fillStyle = o.color || C.ink;
  if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.shadowBlur ?? 30; }
  const dx = o.align === 'left' || o.align === 'right' ? 0 : (o.ls || 0) / 2; // letterSpacing adds trailing space
  if (o.scale && o.scale !== 1) { ctx.translate(x, y); ctx.scale(o.scale, o.scale); ctx.fillText(str, dx, 0); } else ctx.fillText(str, x + dx, y);
  ctx.restore();
}
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function cursor(x, y, press = 0, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); const s = 1.9 * (1 - .15 * press); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.lineTo(7.5, 23); ctx.lineTo(12.5, 34); ctx.lineTo(17, 32); ctx.lineTo(12, 21.5); ctx.lineTo(22, 21.5); ctx.closePath();
  ctx.fillStyle = '#111'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.lineWidth = 2.2; ctx.strokeStyle = '#fff'; ctx.stroke();
  ctx.restore();
}
function ripple(x, y, t0, t, col = C.blue) {
  const u = seg(t, t0, t0 + .35); if (u <= 0 || u >= 1) return;
  ctx.save(); ctx.globalAlpha = 1 - u; ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 14 + 60 * eo3(u), 0, 7); ctx.stroke(); ctx.restore();
}
function glint(x, y, s, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.translate(x, y);
  const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 40 * s); gr.addColorStop(0, 'rgba(255,248,235,1)'); gr.addColorStop(.25, 'rgba(255,230,190,.5)'); gr.addColorStop(1, 'rgba(255,220,170,0)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 40 * s, 0, 7); ctx.fill();
  for (const [len, wid, rot] of [[150, 3, 0], [150, 3, Math.PI / 2], [70, 2, Math.PI / 4], [70, 2, -Math.PI / 4]]) {
    ctx.save(); ctx.rotate(rot); const l = ctx.createLinearGradient(-len * s, 0, len * s, 0);
    l.addColorStop(0, 'rgba(255,235,200,0)'); l.addColorStop(.5, 'rgba(255,250,240,.95)'); l.addColorStop(1, 'rgba(255,235,200,0)');
    ctx.fillStyle = l; ctx.fillRect(-len * s, -wid * s / 2, 2 * len * s, wid * s); ctx.restore();
  }
  ctx.restore();
}
const grain = [];
{ for (let k = 0; k < 4; k++) { const c = document.createElement('canvas'); c.width = 540; c.height = 960; const g = c.getContext('2d'), id = g.createImageData(540, 960), r = mulberry32(100 + k); for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); grain.push(c); } }
function finish(t, amt, vign) {
  if (vign > 0) { const gr = ctx.createRadialGradient(540, 900, 300, 540, 900, 1250); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${vign})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, 1080, 1920); }
  if (amt > 0) { ctx.save(); ctx.globalAlpha = amt; ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(grain[Math.floor(t * 30) % 4], 0, 0, 1080, 1920); ctx.restore(); }
}
function handle(dark) { text('@socialclip.art', 540, 1612, {size: 32, weight: 600, ls: 1, color: dark ? C.ink : C.white, alpha: dark ? .55 : .6}); }
function draw3D(alpha = 1) { renderer.render(scene, camera); ctx.save(); ctx.globalAlpha = alpha; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(glc, 0, 0); ctx.restore(); }

// ---------- website (2D, 3D hero crop) ----------
function website(t, scroll, oy, rot) {
  const X = 48, Y = 150, CW = 984, CH = 1740;
  ctx.save(); ctx.translate(540, Y + CH / 2 + oy); ctx.rotate(rot); ctx.translate(-540, -(Y + CH / 2));
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 80; ctx.shadowOffsetY = 30;
  rr(X, Y, CW, CH, 46); ctx.fillStyle = C.white; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); rr(X, Y, CW, CH, 46); ctx.clip();
  // browser bar (fixed)
  ctx.fillStyle = '#EAE3D6'; ctx.fillRect(X, Y, CW, 96);
  for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#d9cdb8', '#d9cdb8', '#d9cdb8'][i]; ctx.beginPath(); ctx.arc(X + 44 + i * 30, Y + 48, 9, 0, 7); ctx.fill(); }
  rr(X + 190, Y + 22, 600, 52, 26); ctx.fillStyle = '#F7F2E9'; ctx.fill();
  text('stone-maison.de', 540, Y + 58, {size: 26, weight: 500, color: '#6d665b'});
  ctx.translate(0, -scroll);
  const y0 = Y + 96;
  // nav
  ctx.strokeStyle = C.ink; ctx.lineWidth = 3.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(X + 50, y0 + 46 + i * 13); ctx.lineTo(X + 88, y0 + 46 + i * 13); ctx.stroke(); }
  text('STONE', 540, y0 + 78, {font: 'Bodoni', size: 60, weight: 500, ls: 16});
  { const bx = X + CW - 80, by = y0 + 40; ctx.lineWidth = 3.5; rr(bx - 18, by + 10, 36, 34, 4); ctx.stroke(); ctx.beginPath(); ctx.arc(bx, by + 10, 10, Math.PI, 0); ctx.stroke();
    const bp = seg(t, 11.7, 11.95); if (bp > 0) { ctx.save(); ctx.translate(bx + 18, by + 8); ctx.scale(back(bp), back(bp)); ctx.fillStyle = C.champDeep; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fill(); text('1', 0, 8, {size: 22, weight: 700, color: '#fff'}); ctx.restore(); } }
  ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(X, y0 + 128, CW, 2);
  // hero
  const hx = X + 40, hy = y0 + 160, hw = CW - 80, hh = 940;
  ctx.save(); rr(hx, hy, hw, hh, 30); ctx.clip(); ctx.fillStyle = '#0b0a09'; ctx.fillRect(hx, hy, hw, hh);
  const sw = W * .92, sh = sw * hh / hw; ctx.drawImage(glc, (W - sw) / 2, H * .47 - sh / 2, sw, sh, hx, hy, hw, hh);
  ctx.restore();
  rr(hx + 30, hy + 30, 110, 46, 23); ctx.fillStyle = C.champ; ctx.fill(); text('NEU', hx + 85, hy + 62, {size: 22, weight: 700, ls: 4, color: C.ink});
  let yy = hy + hh + 80;
  text('Nº 001 — KOLLEKTION URGESTEIN', X + 60, yy, {size: 24, weight: 600, ls: 5, color: C.champDeep, align: 'left'});
  text('Der Stein.', X + 54, yy + 125, {font: 'Bodoni', size: 128, weight: 500, align: 'left'});
  text('Von der Natur geformt. Von Hand gefunden.', X + 60, yy + 195, {size: 33, weight: 400, color: '#5d574e', align: 'left'});
  text('2.400', X + 58, yy + 310, {font: 'Bodoni', size: 82, weight: 800, align: 'left'}); ctx.font = '800 82px Bodoni'; text('€', X + 74 + ctx.measureText('2.400').width, yy + 310, {size: 70, weight: 400, align: 'left'});
  text('inkl. MwSt. · Versand kostenlos', X + 62, yy + 358, {size: 24, weight: 500, color: '#8a8275', align: 'left'});
  // button
  const by = yy + 410, press = seg(t, 11.62, 11.68) * (1 - seg(t, 11.7, 11.8)), added = t >= 11.66;
  ctx.save(); ctx.translate(540, by + 62); ctx.scale(1 - .03 * press, 1 - .03 * press);
  rr(-(CW - 120) / 2, -62, CW - 120, 124, 62); ctx.fillStyle = added ? C.champ : C.ink; ctx.fill();
  text(added ? '✓  Im Warenkorb' : 'In den Warenkorb', 0, 12, {size: 36, weight: 600, ls: 1, color: added ? C.ink : C.white});
  ctx.restore();
  yy = by + 230;
  for (const [k, v] of [['Material', 'Stein'], ['Herkunft', 'Draußen'], ['Alter', 'ca. 300 Mio. Jahre'], ['Pflege', 'Keine nötig']]) {
    ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fillRect(X + 60, yy - 60, CW - 120, 2);
    text(k, X + 60, yy, {size: 32, weight: 500, color: '#8a8275', align: 'left'});
    text(v, X + CW - 60, yy, {size: 32, weight: 600, align: 'right'}); yy += 100;
  }
  ctx.restore(); ctx.restore();
}

// ---------- shot list ----------
// Beat grid (music "Cat Walk" mapped so its beats fall on these video times): 3.28 + n*0.4644
function frame(t) {
  ctx.setTransform(S, 0, 0, S, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1080, 1920);
  box.visible = false;
  if (t < 3.0 || t >= 17.0) { // ------------- boring table
    applyLook(LOOKS.table);
    const tt = t >= 17 ? 5 : t; stonePoseTable(tt);
    const sh = t < 3 ? Math.exp(-Math.max(0, t - TL) * 22) * (t > TL ? 1 : 0) : 0;
    orbit(TABLE_CAM[0], TABLE_CAM[1] + sh * .5 * Math.sin(t * 90), TABLE_CAM[2] + sh * .4 * Math.sin(t * 70), TABLE_CAM[3]);
    draw3D(); finish(t, .035, 0);
    if (t < 3.0) {
      const out = seg(t, 2.85, 3.1), words = [['Ich', .53], ['mache', .72], ['diesen', .92], ['Stein', 1.2], ['teuer.', 1.4]];
      ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(0, -40 * eo3(out));
      const lines = [[0, 1, 2], [3, 4]];
      ctx.font = '800 112px Inter'; ctx.letterSpacing = '-2px';
      lines.forEach((ln, li) => {
        const parts = ln.map(i => words[i][0]); const widths = parts.map(p => ctx.measureText(p + ' ').width);
        let x = 540 - (widths.reduce((a, b) => a + b, 0) - ctx.measureText(' ').width) / 2;
        ln.forEach((wi, k) => {
          const u = seg(t, words[wi][1], words[wi][1] + .14);
          if (u > 0) text(words[wi][0], x + widths[k] / 2 - ctx.measureText(' ').width / 2, 540 + li * 128 + 26 * (1 - eo3(u)), {size: 112, weight: 800, ls: -2, alpha: u, color: wi === 4 ? '#2a2620' : C.ink});
          x += widths[k];
        });
      });
      // underline swash under "teuer."
      const ul = seg(t, 1.72, 2.05);
      if (ul > 0) { ctx.strokeStyle = C.champDeep; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); const x0 = 560, x1 = 860; ctx.moveTo(x0, 700); ctx.quadraticCurveTo((x0 + x1) / 2, 685, lerp(x0, x1, eo3(ul)), 696 - 6 * eo3(ul)); ctx.stroke(); }
      ctx.restore();
    } else {
      const w1 = [['Immer', 17.33], ['noch', 17.63]], w2 = [['ein', 17.79], ['Stein.', 17.93]], fadeOut = 1 - seg(t, 19.55, 19.95);
      ctx.save(); ctx.globalAlpha = fadeOut;
      [[w1, 540], [w2, 668]].forEach(([ws, y]) => {
        ctx.font = '800 118px Inter'; ctx.letterSpacing = '-2px';
        const widths = ws.map(([w]) => ctx.measureText(w + ' ').width), sp = ctx.measureText(' ').width;
        let x = 540 - (widths.reduce((a, b) => a + b, 0) - sp) / 2;
        ws.forEach(([w, t0], k) => { const u = seg(t, t0, t0 + .12); if (u > 0) text(w, x + widths[k] / 2 - sp / 2, y + 20 * (1 - eo3(u)), {size: 118, weight: 800, ls: -2, alpha: u}); x += widths[k]; });
      });
      const q = seg(t, 18.55, 18.85);
      if (q > 0) text('Würdest du ihn kaufen? 😂', 540, 800, {size: 64, weight: 600, alpha: clamp(q * 2), scale: back(q), color: '#2b2822'});
      ctx.restore();
    }
    handle(true);
    return;
  }
  if (t < 6.07) { // ------------- design mode
    stoneRest(); orbit(...TABLE_CAM);
    const fl = seg(t, 4.21, 4.55), champOn = seg(t, 4.44, 4.75);
    const L = mixLook(LOOKS.void, LOOKS.studio, champOn * .6);
    if (fl < 1) { applyLook(LOOKS.table); draw3D(); }
    if (fl > 0) {
      applyLook(L); podium.visible = false; floor.visible = false; cone.visible = false; dust.visible = false;
      renderer.render(scene, camera);
      ctx.save(); ctx.beginPath(); ctx.arc(966, 745, 2300 * ei3(fl) * .55 + 2300 * fl * .45, 0, 7); ctx.clip(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(glc, 0, 0); ctx.restore();
    }
    finish(t, fl > .5 ? .05 : .035, fl * .5);
    const [sx, sy] = project(0, restY * .55, 0);
    // grid + construction lines
    const gi = seg(t, 3.74, 4.15), gOut = 1 - seg(t, 5.85, 6.05);
    if (gi > 0) {
      ctx.save(); ctx.globalAlpha = gOut; ctx.lineWidth = 2;
      ctx.strokeStyle = fl > .5 ? 'rgba(214,194,159,.28)' : 'rgba(40,34,26,.22)';
      for (let i = 0; i <= 6; i++) { const u = eo3(seg(gi, i * .06, i * .06 + .5)); const x = 90 + i * 150; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1920 * u); ctx.stroke(); }
      for (let j = 0; j < 14; j++) { const u = eo3(seg(gi, .2 + j * .03, .6 + j * .03)); const y = 240 + j * 120; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080 * u, y); ctx.stroke(); }
      ctx.strokeStyle = fl > .5 ? 'rgba(214,194,159,.7)' : 'rgba(120,96,60,.6)'; ctx.setLineDash([10, 10]);
      const cu = eo3(seg(gi, .3, 1));
      ctx.beginPath(); ctx.arc(sx, sy, 360, -Math.PI / 2, -Math.PI / 2 + 6.283 * cu); ctx.stroke();
      ctx.setLineDash([]); ctx.beginPath(); ctx.arc(sx, sy, 222, Math.PI / 2, Math.PI / 2 + 6.283 * cu); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx - 520 * cu, sy - 520 * cu); ctx.lineTo(sx + 520 * cu, sy + 520 * cu); ctx.moveTo(sx + 520 * cu, sy - 520 * cu); ctx.lineTo(sx - 520 * cu, sy + 520 * cu); ctx.stroke();
      ctx.restore();
    }
    // selection box
    const sel = seg(t, 3.28, 3.4), selOut = 1 - seg(t, 5.8, 6.0);
    if (sel > 0) {
      const bw = 640, bh = 380, bx = sx - bw / 2, by = sy - bh / 2 + 10;
      ctx.save(); ctx.globalAlpha = selOut; ctx.translate(sx, sy); ctx.scale(lerp(1.08, 1, eo3(sel)), lerp(1.08, 1, eo3(sel))); ctx.translate(-sx, -sy);
      ctx.globalAlpha *= sel; ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, bh);
      for (const [hx, hy] of [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh], [bx + bw / 2, by], [bx + bw / 2, by + bh], [bx, by + bh / 2], [bx + bw, by + bh / 2]]) { ctx.fillStyle = '#fff'; ctx.fillRect(hx - 9, hy - 9, 18, 18); ctx.strokeRect(hx - 9, hy - 9, 18, 18); }
      rr(bx, by - 58, 230, 44, 8); ctx.fillStyle = C.blue; ctx.fill(); text('Stein.obj', bx + 18, by - 26, {size: 26, weight: 600, color: '#fff', align: 'left'});
      rr(sx - 115, by + bh + 16, 230, 44, 8); ctx.fillStyle = C.blue; ctx.fill(); text('9,2 × 5,7 cm', sx, by + bh + 47, {size: 25, weight: 600, color: '#fff'});
      ctx.restore();
    }
    // UI chrome
    const ui = eo3(seg(t, 2.95, 3.25)), uiOut = eio(seg(t, 5.85, 6.15));
    ctx.save(); ctx.translate(0, -160 * (1 - ui) - 200 * uiOut);
    rr(190, 110, 700, 74, 22); ctx.fillStyle = 'rgba(28,28,30,.94)'; ctx.fill();
    text('STONE_Brand_FINAL_v7.fig', 222, 157, {size: 27, weight: 600, color: '#fff', align: 'left'});
    text('100 %', 858, 157, {size: 25, weight: 500, color: '#9a9aa0', align: 'right'});
    ctx.restore();
    ctx.save(); ctx.translate(-160 * (1 - ui) - 200 * uiOut, 0);
    rr(36, 620, 104, 470, 26); ctx.fillStyle = 'rgba(28,28,30,.94)'; ctx.fill();
    const tools = ['➤', '#', 'T', '◯', '✎']; tools.forEach((s, i) => { if (i === 0) { rr(52, 640, 72, 72, 16); ctx.fillStyle = C.blue; ctx.fill(); } text(s, 88, 690 + i * 90, {size: 34, weight: 700, color: '#fff'}); });
    ctx.restore();
    ctx.save(); ctx.translate(160 * (1 - ui) + 200 * uiOut, 0);
    rr(918, 620, 104, 380, 26); ctx.fillStyle = 'rgba(28,28,30,.94)'; ctx.fill();
    [[C.black, 4.21, 745], [C.champ, 4.44, 855], [C.white, 4.67, 965]].forEach(([c, t0, y]) => {
      const u = seg(t, t0 - .12, t0 + .06); if (u <= 0) return; ctx.save(); ctx.translate(970, y - 70); ctx.scale(back(u), back(u));
      ctx.beginPath(); ctx.arc(0, 0, 32, 0, 7); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.stroke(); ctx.restore();
    });
    ctx.restore();
    // wordmark letters
    const letters = 'STONE'.split(''), lt = [5.14, 5.256, 5.372, 5.488, 5.604];
    const wm = eio(seg(t, 5.95, 6.07)) * 0; // move handled in next shot
    ctx.font = '500 200px Bodoni'; ctx.letterSpacing = '0px';
    const adv = letters.map(l => ctx.measureText(l).width), gap = 34, tot = adv.reduce((a, b) => a + b, 0) + gap * 4;
    let lx = 540 - tot / 2;
    letters.forEach((l, i) => {
      const u = seg(t, lt[i] - .1, lt[i] + .02);
      if (u > 0) text(l, lx + adv[i] / 2, 560 - 70 * (1 - eo5(u)) - wm, {font: 'Bodoni', size: 200, weight: 500, color: C.white, alpha: u});
      lx += adv[i] + gap;
    });
    const lk = seg(t, 5.6, 5.85);
    if (lk > 0) { ctx.fillStyle = C.champ; const w = 520 * eo3(lk); ctx.fillRect(540 - w / 2, 610, w, 3); text('MAISON DE PIERRE', 540, 668, {size: 26, weight: 600, ls: 12, color: C.champ, alpha: lk}); }
    // cursor path
    const P = [[2.95, 960, 1560], [3.24, sx + 30, sy + 10], [3.6, sx + 30, sy + 10], [4.12, 970, 676], [4.36, 970, 786], [4.6, 970, 896], [5.0, 760, 1240], [6.05, 1200, 1700]];
    let cx = P[0][1], cy = P[0][2];
    for (let i = 0; i < P.length - 1; i++) if (t >= P[i][0]) { const u = eio(seg(t, P[i][0], P[i + 1][0])); cx = lerp(P[i][1], P[i + 1][1], u); cy = lerp(P[i][2], P[i + 1][2], u); }
    const press = Math.max(...[3.28, 4.21, 4.44, 4.67].map(c => Math.max(0, 1 - Math.abs(t - c) / .06)));
    [3.28, 4.21, 4.44, 4.67].forEach(c => ripple(cx, cy, c, t, c === 3.28 ? C.blue : C.champ));
    cursor(cx, cy, press, 1 - seg(t, 5.7, 6.0));
    handle(fl < .5);
    return;
  }
  // ------------- luxury campaign (3D studio)
  if (t < 10.2) {
    stoneRest();
    const pr = eo5(seg(t, 6.07, 6.47)); podium.position.y = lerp(-3.2, 0, pr);
    let L = LOOKS.studio;
    if (t < 6.6) L = mixLook(mixLook(LOOKS.void, LOOKS.studio, .6), LOOKS.studio, seg(t, 6.07, 6.6));
    applyLook(L);
    // camera: continuous orbit 6.07 -> 10.2
    const a = eio(seg(t, 6.07, 8.0)), b = eio(seg(t, 8.0, 9.75)), c = eio(seg(t, 9.75, 10.2));
    let az = lerp(0, 62, a) + lerp(0, 40, b) + lerp(0, 18, c);
    let el = lerp(13, 17, a) + lerp(0, 20, b) + lerp(0, 28, c);
    let dist = lerp(7.4, 5.4, a) + lerp(0, -.6, b) + lerp(0, -2.3, c);
    const ty = lerp(.95, .45, a) + lerp(0, .15, b) + lerp(0, .55, c);
    orbit([0, ty, 0], az, el, dist);
    // packaging
    if (t >= 8.0) {
      box.visible = true; const ap = eo3(seg(t, 8.0, 8.2));
      box.scale.set(lerp(.6, 1, ap), 1, lerp(.6, 1, ap));
      const f = [8.39, 8.62, 8.85, 9.08].map(t1 => back(seg(t, t1 - .22, t1)));
      setBox(f, eo3(seg(t, 9.3, 9.78)) * (t < 9.78 ? 1 : 1));
      if (t >= 9.3) { const u = seg(t, 9.3, 9.78); lid.position.y = .02 + BOX.h + lidH / 2 - .06 + 3.2 * (1 - u * u); lid.rotation.y = .5 * (1 - eo3(u)); }
    }
    updateDust(t); key.target.position.set(0, .3, 0);
    draw3D(); finish(t, .05, .45);
    // brand header (from design wordmark)
    const m = eio(seg(t, 6.07, 6.5)), ho = 1 - seg(t, 9.55, 9.8);
    text('STONE', 540, lerp(560, 300, m), {font: 'Bodoni', size: lerp(200, 112, m), weight: 500, ls: lerp(34, 30, m), color: C.white, alpha: ho});
    ctx.fillStyle = C.champ; ctx.globalAlpha = ho * (1 - seg(t, 6.07, 6.25)); ctx.fillRect(280, 610, 520, 3); ctx.globalAlpha = 1;
    text('MAISON DE PIERRE', 540, lerp(668, 352, m), {size: lerp(26, 22, m), weight: 600, ls: 12, color: C.champ, alpha: ho});
    const c1 = seg(t, 6.55, 6.8) * (1 - seg(t, 7.8, 8.0));
    if (c1 > 0) { text('Nº 001', 540, 1420 + 20 * (1 - eo3(c1)), {font: 'Bodoni', style: 'italic', size: 64, weight: 500, color: C.champ, alpha: c1}); text('GRANIT · UNBEHANDELT · UNIKAT', 540, 1486, {size: 25, weight: 600, ls: 8, color: C.white, alpha: c1 * .85}); }
    const c2 = seg(t, 8.4, 8.65) * (1 - seg(t, 9.5, 9.7));
    if (c2 > 0) text('HANDGEFALTET. FÜR DIE EWIGKEIT.', 540, 1486, {size: 25, weight: 600, ls: 8, color: C.white, alpha: c2 * .85});
    handle(false);
    // website card slides in over the lid push
    const wi = seg(t, 9.9, 10.2);
    if (wi > 0) { ctx.fillStyle = `rgba(0,0,0,${.7 * wi})`; ctx.fillRect(0, 0, 1080, 1920); }
    if (wi > 0) {
      // hero crop needs the drama render; render it only once card is visible enough
      stoneRest(); box.visible = false; podium.position.y = 0; applyLook(LOOKS.drama); dramaCam(t); renderer.render(scene, camera);
      website(t, 0, 1900 * (1 - eo5(wi)), 0);
    }
    return;
  }
  if (t < 14.0) { // ------------- website -> dramatic product shot
    stoneRest(); podium.position.y = 0; applyLook(LOOKS.drama); updateDust(t); dramaCam(t);
    renderer.render(scene, camera);
    const ex = seg(t, 11.92, 12.25);
    // background: same shot, dimmed + blurred while the website is up
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (ex < 1) { ctx.filter = `blur(${Math.round(18 * S * (1 - ex))}px)`; }
    ctx.drawImage(glc, 0, 0); ctx.restore();
    ctx.fillStyle = `rgba(0,0,0,${.7 * (1 - eio(ex))})`; ctx.fillRect(0, 0, 1080, 1920);
    finish(t, .05, .5);
    if (ex < 1) {
      const sc = t < 10.35 ? 0 : 760 * eio(seg(t, 10.35, 11.25));
      website(t, sc, 2100 * ei3(ex), .07 * ei3(ex));
      const P = [[11.05, 1180, 1560], [11.5, 600, 1092], [12.0, 640, 1150]];
      let cx = P[0][1], cy = P[0][2];
      for (let i = 0; i < P.length - 1; i++) if (t >= P[i][0]) { const u = eio(seg(t, P[i][0], P[i + 1][0])); cx = lerp(P[i][1], P[i + 1][1], u); cy = lerp(P[i][2], P[i + 1][2], u); }
      if (t > 11.05) { ripple(cx, cy, 11.64, t, C.champDeep); cursor(cx, cy, Math.max(0, 1 - Math.abs(t - 11.64) / .06), 1 - seg(t, 11.85, 11.95)); }
    }
    const m1 = seg(t, 12.57, 12.85), m2 = seg(t, 12.8, 13.1), mo = 1 - seg(t, 13.85, 14.0);
    if (m1 > 0) text('Millionen Jahre', 540, 1380 + 24 * (1 - eo3(m1)), {font: 'Bodoni', style: 'italic', size: 118, weight: 500, color: C.white, alpha: m1 * mo, shadow: 'rgba(0,0,0,.6)'});
    if (m2 > 0) text('gereift.', 540, 1510 + 24 * (1 - eo3(m2)), {font: 'Bodoni', style: 'italic', size: 118, weight: 600, color: '#F3E2C0', alpha: m2 * mo, shadow: 'rgba(0,0,0,.95)', shadowBlur: 40});
    if (m1 > 0) text('STONE', 540, 300, {font: 'Bodoni', size: 64, weight: 500, ls: 22, color: C.white, alpha: m1 * mo * .9});
    handle(false);
    return;
  }
  // ------------- 14.0–17.0 hero campaign shot: stone crowned on its box
  {
    const u = seg(t, 14.0, 17.0);
    box.visible = true; box.scale.set(1, 1, 1); setBox([1, 1, 1, 1], 1); lid.rotation.y = Math.PI; podium.position.y = 0;
    const topY = lid.position.y + lidH / 2;
    stoneRest(topY);
    const L = {...LOOKS.hero}; const beat = (t - 14.0) / .4644, bp = Math.exp(-((beat % 1)) * 5);
    L.rimL += 60 * bp; L.rimR += 50 * bp; L.sweep = 60; applyLook(L);
    sweep.position.set(lerp(-5, 5, u), 2.6, 3.5); sweep.target.position.set(0, topY + .3, 0);
    key.target.position.set(0, topY, 0); cone.position.y = 3.5 + topY * .5;
    updateDust(t);
    orbit([0, lerp(.72, .68, u), 0], lerp(-22, 10, eio(u)), lerp(9, 13, u), lerp(8.4, 7.5, eo3(u)));
    draw3D(); finish(t, .05, .5);
    // glints on stone top highlight, on beats
    const [gx, gy] = project(.18, topY + restY + stoneSize.y * .42, .12);
    [14.46, 15.39, 16.31].forEach((b0, i) => { const g = seg(t, b0 - .05, b0 + .35); if (g > 0 && g < 1) glint(gx + [0, -70, 50][i], gy + [0, 18, 8][i], .9 + .3 * Math.sin(g * 3), Math.sin(g * Math.PI)); });
    const wi = seg(t, 14.0, 14.35);
    ctx.save(); const lg = ctx.createLinearGradient(240, 0, 840, 0); lg.addColorStop(0, '#b8996a'); lg.addColorStop(.5 + .45 * Math.sin(u * 3.2 - 1.2), '#fbf0d9'); lg.addColorStop(1, '#b8996a');
    text('STONE', 540, 360 - 30 * (1 - eo3(wi)), {font: 'Bodoni', size: 180, weight: 500, ls: 44, color: lg, alpha: wi}); ctx.restore();
    text('MAISON DE PIERRE', 540, 420, {size: 24, weight: 600, ls: 14, color: C.champ, alpha: wi});
    const bt = seg(t, 14.46, 14.8);
    text('Millionen Jahre gereift.', 540, 1505 + 16 * (1 - eo3(bt)), {font: 'Bodoni', style: 'italic', size: 66, weight: 500, color: C.white, alpha: bt});
    text('Nº 001 · JETZT ERHÄLTLICH', 540, 1556, {size: 24, weight: 600, ls: 9, color: C.champ, alpha: seg(t, 14.92, 15.2)});
    // flash on the hit
    const fl = 1 - seg(t, 14.0, 14.3);
    if (fl > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,236,205,${.8 * fl * fl})`; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); }
    handle(false);
  }
}
function dramaCam(t) {
  const u = seg(t, 9.9, 14.0);
  orbit([0, lerp(.42, .36, u), 0], lerp(34, 6, eio(u)), lerp(7, 3.5, eio(u)), lerp(5.0, 4.15, eo3(u)), 34);
}

await document.fonts.ready;
window.renderFrame = async t => { frame(t); };
window.grab = (type, quality = .95) => out.toDataURL(type, quality);
window.__ready = true;

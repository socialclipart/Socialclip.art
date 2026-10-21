// 4D — "Welches Material ist deine Marke?" 3D symbol, new material every two beats, comment CTA
import * as F from './fx.js';
const {ctx, seg, lerp, eo3, eo5, eio, pulse, text, rr, THREE, makeGL, blit, canvasTex, SYM_PATHS, mulberry32} = F;
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
const A = await F.loadAudio('s4'), g = F.G.s4, b = g.beats;
const {glc, renderer, env} = makeGL();
const scene = new THREE.Scene(); scene.environment = env;
const cam = new THREE.PerspectiveCamera(30, 1080 / 1920, .05, 100);
const svg = `<svg xmlns="http://www.w3.org/2000/svg">${SYM_PATHS.map(d => `<path d="${d}"/>`).join('')}</svg>`;
const geos = []; for (const p of new SVGLoader().parse(svg).paths) for (const sh of SVGLoader.createShapes(p)) geos.push(new THREE.ExtrudeGeometry(sh, {depth: 30, bevelEnabled: true, bevelThickness: 5, bevelSize: 4, bevelSegments: 5, curveSegments: 64}));
const sym = new THREE.Group(); scene.add(sym); const meshes = geos.map(gg => { const m = new THREE.Mesh(gg); sym.add(m); return m; });
{ const bx = new THREE.Box3().setFromObject(sym), c = bx.getCenter(new THREE.Vector3()), s = 1.4 / (bx.max.y - bx.min.y); geos.forEach(gg => { gg.translate(-c.x, -c.y, -c.z); gg.computeBoundingBox(); }); sym.scale.set(s, -s, s);
  geos.forEach(gg => { const p = gg.attributes.position, uv = gg.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 120 + .5, p.getY(i) / 120 + .5 + p.getZ(i) / 200); uv.needsUpdate = true; }); }
const noiseTex = (base, veins, seed) => canvasTex(1024, 1024, (c, w, h) => { const r = mulberry32(seed); c.fillStyle = base; c.fillRect(0, 0, w, h);
  if (veins) { for (let i = 0; i < 26; i++) { c.strokeStyle = `rgba(${veins},${.15 + r() * .5})`; c.lineWidth = 1 + r() * 5; c.beginPath(); let x = r() * w, y = 0; c.moveTo(x, y); while (y < h) { x += (r() - .5) * 90; y += 30 + r() * 40; c.lineTo(x, y); } c.stroke(); } }
  else { const id = c.getImageData(0, 0, w, h); for (let i = 0; i < id.data.length; i += 4) { const n = (r() - .5) * 60; id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n; } c.putImageData(id, 0, 0); } });
const MATS = [
  {n: 'CHROM', bg: ['#1b1d22', '#050506'], m: new THREE.MeshPhysicalMaterial({color: 0xffffff, metalness: 1, roughness: .05, envMapIntensity: 1.6})},
  {n: 'GOLD', bg: ['#3a2a12', '#0a0703'], m: new THREE.MeshPhysicalMaterial({color: 0xffc35a, metalness: 1, roughness: .16, clearcoat: .6, envMapIntensity: 1.5})},
  {n: 'GLAS', bg: ['#1c2c3c', '#05080c'], m: new THREE.MeshPhysicalMaterial({color: 0xffffff, metalness: 0, roughness: .02, transmission: 1, thickness: 25, ior: 1.5, envMapIntensity: 1.3, attenuationColor: new THREE.Color(0x9fd4ff), attenuationDistance: 60})},
  {n: 'HOLO', bg: ['#2b1d3d', '#07040b'], m: new THREE.MeshPhysicalMaterial({color: 0xeeeeff, metalness: 1, roughness: .12, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [100, 900], envMapIntensity: 1.6})},
  {n: 'NEON', bg: ['#2a0620', '#060106'], m: new THREE.MeshStandardMaterial({color: 0x220011, emissive: 0xff2d8a, emissiveIntensity: 2.4, roughness: .4}), glow: 1},
  {n: 'MARMOR', bg: ['#2e2b28', '#0a0908'], m: new THREE.MeshPhysicalMaterial({map: noiseTex('#f2efe9', '90,90,100', 3), roughness: .18, clearcoat: 1, envMapIntensity: .9})},
  {n: 'BETON', bg: ['#3a3a3a', '#101010'], m: new THREE.MeshStandardMaterial({map: noiseTex('#8b8b88', null, 4), roughness: .95, envMapIntensity: .6})},
  {n: 'SAMT', bg: ['#3a0a12', '#0b0204'], m: new THREE.MeshPhysicalMaterial({color: 0x6b0f1f, roughness: .9, sheen: 1, sheenColor: new THREE.Color(0xff8fa3), sheenRoughness: .35, envMapIntensity: .7})},
  {n: 'DEINS?', bg: ['#2a241c', '#070605'], m: new THREE.MeshPhysicalMaterial({color: 0xe6d0ad, metalness: 1, roughness: .2, clearcoat: .8, envMapIntensity: 1.5})},
];
MATS.forEach(M => { M.m.side = THREE.FrontSide; });
const key = new THREE.SpotLight(0xffffff, 60, 0, .5, .7, 2); key.position.set(2.5, 3.5, 4); scene.add(key, key.target);
const rim = new THREE.SpotLight(0xffe2b0, 80, 0, .6, .8, 2); rim.position.set(-3, 2, -3); scene.add(rim, rim.target);
scene.add(new THREE.AmbientLight(0xffffff, .15));
const slot = t => { if (t >= g.drop) return 8; return Math.max(0, Math.min(7, Math.floor(F.idx(t, b) / 2))); };
export function frame(t) {
  const lo = F.env(A, 'low', t), kp = F.hitP(t, b, .2), cp = F.hitP(t, g.claps, .25);
  const brk = t >= g.brk && t < g.drop, i = slot(t), M = MATS[i], st = i === 8 ? g.drop : b[i * 2] ?? 0;
  F.begin(M.bg[1]); F.bgFill(M.bg[0], M.bg[1], 540, 860, 1200);
  if (M.glow) F.rays(540, 860, t, '255,45,138', .12, 20, .3);
  meshes.forEach(m => m.material = M.m);
  const snap = eo5(seg(t, st, st + .35)), spin = (1 - snap) * -Math.PI * 1.5;
  sym.rotation.set(.12 + .05 * Math.sin(t * 1.3), spin + .3 * Math.sin(t * .9) + (brk ? (t - g.brk) * 9 : 0), (brk ? .2 * Math.sin(t * 20) : 0));
  sym.position.y = .2 + .04 * Math.sin(t * 2);
  const z = lerp(5.6, 5.1, eo5(seg(t, st, st + .4))) - .15 * kp; cam.position.set(0, .3, z); cam.lookAt(0, .1, 0); cam.updateProjectionMatrix();
  key.intensity = 60 + 50 * cp; rim.intensity = 80 + 60 * kp; key.target.position.set(0, 0, 0); rim.target.position.set(0, 0, 0);
  renderer.toneMappingExposure = brk ? .35 : 1;
  renderer.render(scene, cam); blit(glc);
  F.bloom(F.out, (M.glow ? .9 : .3) + .25 * kp, M.glow ? 12 : 8);
  F.sweep(t, st, .5, '255,255,255', .25, -.6);
  // header + labels
  text(ctx, 'Welches Material', 540, 230, {size: 64, weight: 900, color: '#fff'}); text(ctx, 'ist deine Marke?', 540, 320, {size: 64, weight: 900, color: '#e6d0ad'});
  if (!brk && i < 8) { text(ctx, String(i + 1).padStart(2, '0'), 540, 1530, {font: 'Anton', size: 200, color: 'rgba(255,255,255,.12)', scale: lerp(1.3, 1, eo5(seg(t, st, st + .2)))}); F.slam(M.n, 540, 1470, st, t, {color: '#fff', w: 700, max: 130}); }
  if (brk) { text(ctx, 'Und deine?', 540, 1480, {size: 110, weight: 900, color: '#fff', alpha: seg(t, g.brk, g.brk + .15)}); }
  if (i === 8) { F.slam('DEINS?', 540, 1420, g.drop, t, {color: '#e6d0ad', w: 700, max: 160});
    const u = seg(t, b[20], b[20] + .2); if (u > 0) { ctx.save(); ctx.translate(540, 1640); ctx.scale(F.back(u), F.back(u)); rr(ctx, -380, -60, 760, 120, 60); ctx.fillStyle = '#fff'; ctx.fill(); text(ctx, 'Kommentiere deine Nr. 👇', 0, 18, {size: 46, weight: 800, color: '#121212'}); ctx.restore(); }
    F.burst(540, 860, g.drop, t, {n: 180, v: 2400, size: 6, cols: ['#e6d0ad', '#fff'], life: 1.2}); F.shock(540, 860, g.drop, t, '230,208,173', 1300, .5, 18); }
  // material strip
  if (!brk) MATS.slice(0, 8).forEach((m, k) => { const x = 540 - 7 * 52 + k * 104; ctx.fillStyle = k === i ? '#fff' : 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(x, 420, k === i ? 14 : 8, 0, 7); ctx.fill(); });
  F.flash(t, g.drop, .25, '255,248,236', 1); F.flash(t, st, .08, '255,255,255', .3);
  F.rgbSplit(2 + 8 * kp); F.finish(t, .045, .5); F.handle(false, 1780);
}

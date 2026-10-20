// Video 2 — "Website bis morgen? Klar." (sound 2: sparse intro, drop at 2.07 s, heavy rolling bass)
import {THREE, ctx, out, S, clamp, seg, lerp, eo3, eo5, eio, back, pulse, mulberry32, text, rr, finish, bloom, flash, glint, handle,
  makeGL, canvasTex, blit, begin, symbol, BRAND} from './common.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const INTRO = [0.209, 0.406, 0.685, 0.929, 1.184], DROP = 2.067;
const BASS = [2.104, 2.322, 2.572, 2.795, 3.043, 3.29, 3.52, 3.775, 3.988, 4.199, 4.492, 4.716, 4.926, 5.139, 5.432, 5.659, 6.024, 6.34, 6.598, 6.805, 7.024, 7.27, 7.54, 7.745, 7.966, 8.256, 8.481, 8.688, 8.907, 9.154, 9.423];
const N = {cyan: '#3DF5FF', mag: '#FF3DBE', vio: '#8A5CFF', ink: '#0A0716'};
const bassPulse = t => { let p = 0; for (const b of BASS) p = Math.max(p, pulse(t, b, .2)); return p; };

// ---------- website panels (layout on the phone screen, units) ----------
const SW = .72, SH = 1.56;
function heroImg(g, w, h) {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a1d3f'); gr.addColorStop(1, '#0d0a14'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // arches (interior design)
  for (const [x, ww, c] of [[.18, .3, '#d9c4a5'], [.52, .34, '#b7967a'], [.82, .22, '#e9dcc8']]) { g.fillStyle = c; g.beginPath(); g.moveTo(w * (x - ww / 2), h); g.lineTo(w * (x - ww / 2), h * .45); g.arc(w * x, h * .45, w * ww / 2, Math.PI, 0); g.lineTo(w * (x + ww / 2), h); g.fill(); }
  g.fillStyle = 'rgba(10,7,22,.35)'; g.fillRect(0, 0, w, h);
  text(g, 'Räume,', 40, h * .2, {font: 'Bodoni', style: 'italic', size: 86, weight: 500, color: '#fff', align: 'left'});
  text(g, 'die bleiben.', 40, h * .2 + 92, {font: 'Bodoni', style: 'italic', size: 86, weight: 500, color: '#fff', align: 'left'});
}
const PANELS = [
  {k: 'head', x: 0, y: .70, w: .70, h: .1, col: N.cyan, draw: (g, w, h) => { g.fillStyle = '#f6f2ea'; g.fillRect(0, 0, w, h); text(g, 'ATELIER NORD', 36, h * .64, {size: 38, weight: 800, ls: 6, color: '#121212', align: 'left'}); g.fillStyle = '#121212'; for (let i = 0; i < 3; i++) g.fillRect(w - 80, h * .32 + i * 14, 44, 5); }},
  {k: 'hero', x: 0, y: .31, w: .66, h: .62, col: N.mag, draw: heroImg},
  {k: 'lead', x: 0, y: -.1, w: .66, h: .13, col: N.vio, draw: (g, w, h) => { g.fillStyle = '#f6f2ea'; g.fillRect(0, 0, w, h); text(g, 'Innenarchitektur aus Erlangen.', 24, h * .45, {size: 34, weight: 600, color: '#121212', align: 'left'}); text(g, 'Planung · Material · Licht', 24, h * .8, {size: 26, weight: 500, color: '#777', align: 'left'}); }},
  {k: 'btn', x: 0, y: -.26, w: .5, h: .1, col: N.cyan, draw: (g, w, h) => { g.fillStyle = '#121212'; rr(g, 0, 0, w, h, h / 2); g.fill(); text(g, 'Projekt anfragen  →', w / 2, h * .62, {size: 34, weight: 700, color: '#fff'}); }},
  {k: 'c1', x: -.17, y: -.53, w: .31, h: .34, col: N.mag, draw: (g, w, h) => { g.fillStyle = '#d9c4a5'; g.fillRect(0, 0, w, h); g.fillStyle = '#6b4f3a'; g.beginPath(); g.arc(w / 2, h * .45, w * .28, 0, 7); g.fill(); text(g, 'Wohnen', 20, h - 24, {size: 30, weight: 700, color: '#121212', align: 'left'}); }},
  {k: 'c2', x: .17, y: -.53, w: .31, h: .34, col: N.vio, draw: (g, w, h) => { g.fillStyle = '#2b2333'; g.fillRect(0, 0, w, h); g.fillStyle = '#e9dcc8'; g.fillRect(w * .2, h * .2, w * .6, h * .45); text(g, 'Arbeiten', 20, h - 24, {size: 30, weight: 700, color: '#fff', align: 'left'}); }},
  {k: 'foot', x: 0, y: -.74, w: .70, h: .07, col: N.cyan, draw: (g, w, h) => { g.fillStyle = '#121212'; g.fillRect(0, 0, w, h); text(g, '© Atelier Nord · Impressum', w / 2, h * .66, {size: 22, weight: 500, color: '#aaa'}); }},
];
const {glc, renderer, env} = makeGL();
renderer.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x05030c, 6, 26);
const cam = new THREE.PerspectiveCamera(36, 1080 / 1920, .05, 100);
const r = mulberry32(5);
PANELS.forEach((p, i) => {
  const tex = canvasTex(Math.round(p.w * 1400), Math.round(p.h * 1400), p.draw);
  p.mat = new THREE.MeshBasicMaterial({map: tex, transparent: true, opacity: 0, fog: false});
  p.mesh = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), p.mat); scene.add(p.mesh);
  // scattered flight positions (camera looks down -z); panels fly toward the camera
  p.s = [(r() - .5) * 3.2, (r() - .5) * 3.6, -9 - r() * 9, (r() - .5) * .9, (r() - .5) * 1.1, (r() - .5) * .5];
  p.drawAt = BASS[i]; p.fillAt = BASS[8 + i];
});
const grid = new THREE.GridHelper(80, 64, 0xff3dbe, 0x6a3cff); grid.position.y = -2.2; grid.material.transparent = true; grid.material.opacity = .55; grid.material.fog = true; scene.add(grid);
const phoneG = new THREE.Group(); scene.add(phoneG);
const body = new THREE.Mesh(new RoundedBoxGeometry(.8, 1.66, .08, 6, .12), new THREE.MeshStandardMaterial({color: 0x101016, metalness: .7, roughness: .3, envMap: env, envMapIntensity: .6}));
body.position.z = -.045; phoneG.add(body);
const screenBg = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({color: 0xf6f2ea, transparent: true, opacity: 0, fog: false})); screenBg.position.z = -.002; phoneG.add(screenBg);
scene.add(new THREE.AmbientLight(0xffffff, .3)); const pl = new THREE.PointLight(0xff3dbe, 6, 0, 2); pl.position.set(-1.5, 1, 1.5); scene.add(pl); const pl2 = new THREE.PointLight(0x3df5ff, 6, 0, 2); pl2.position.set(1.5, -.5, 1.5); scene.add(pl2);

const AS = 6.024, AE = 7.27; // assemble window
function panelPose(p, i, t) {
  const fly = Math.max(0, t - DROP), z0 = p.s[2] + fly * 2.6; // flight
  const pos = new THREE.Vector3(p.s[0], p.s[1], Math.min(z0, -1.2)), rot = new THREE.Euler(p.s[3] * (1 - fly * .05), p.s[4], p.s[5]);
  const a = eio(seg(t, AS + i * .06, AE - .3 + i * .06));
  const L = new THREE.Vector3(p.x, p.y, 0);
  return {pos: pos.lerp(L, a), rot: new THREE.Euler(lerp(rot.x, 0, a), lerp(rot.y, 0, a), lerp(rot.z, 0, a)), a};
}
function proj(v) { const q = v.clone().project(cam); return [(q.x + 1) / 2 * 1080, (1 - q.y) / 2 * 1920, q.z]; }

export function frame(t) {
  if (t < DROP + .05) return chat(t);
  return neon(t);
}

function chat(t) {
  begin('#0b0b0d');
  // status bar + header
  text(ctx, '23:59', 90, 110, {size: 34, weight: 700, color: '#fff', align: 'left'});
  ctx.fillStyle = '#1a1a1d'; ctx.fillRect(0, 150, 1080, 150);
  ctx.fillStyle = '#5a5a63'; ctx.beginPath(); ctx.arc(120, 225, 46, 0, 7); ctx.fill(); text(ctx, 'K', 120, 241, {size: 44, weight: 800, color: '#fff'});
  text(ctx, 'Kunde', 190, 215, {size: 40, weight: 700, color: '#fff', align: 'left'}); text(ctx, t < 1.5 ? 'schreibt …' : 'online', 190, 262, {size: 28, weight: 500, color: '#8e8e96', align: 'left'});
  // message bubble grows word by word on the intro hits
  const words = ['Kannst', 'du bis', 'morgen', 'eine Website', 'machen? 🙏'];
  let n = 0; INTRO.forEach((h, i) => { if (t >= h) n = i + 1; });
  if (n > 0) {
    const lines = n <= 3 ? [words.slice(0, n).join(' ')] : [words.slice(0, 3).join(' '), words.slice(3, n).join(' ')];
    ctx.font = '600 74px Inter'; const bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 90, bh = 70 + lines.length * 92;
    const last = INTRO[n - 1], pop = back(seg(t, last, last + .12));
    ctx.save(); ctx.translate(60, 640); ctx.scale(lerp(.97, 1, pop), lerp(.97, 1, pop));
    rr(ctx, 0, 0, bw, bh, 40); ctx.fillStyle = '#26262b'; ctx.fill();
    lines.forEach((l, i) => text(ctx, l, 45, 108 + i * 92, {size: 74, weight: 600, color: '#fff', align: 'left'}));
    text(ctx, '23:59', bw - 30, bh - 18, {size: 22, weight: 500, color: '#8e8e96', align: 'right'});
    ctx.restore();
  }
  // our reply: typing dots, then "Klar." on the drop
  if (t > 1.45 && t < DROP) { rr(ctx, 1080 - 70 - 170, 1020, 170, 96, 48); ctx.fillStyle = '#123c41'; ctx.fill(); for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(61,245,255,${.35 + .65 * Math.max(0, Math.sin(t * 12 - i * .9))})`; ctx.beginPath(); ctx.arc(1080 - 70 - 120 + i * 35, 1068, 11, 0, 7); ctx.fill(); } }
  if (t >= DROP) { const p = back(seg(t, DROP, DROP + .1)); ctx.save(); ctx.translate(1080 - 70, 1068); ctx.scale(p, p); rr(ctx, -330, -60, 330, 120, 60); ctx.fillStyle = N.cyan; ctx.fill(); text(ctx, 'Klar.', -165, 24, {size: 70, weight: 800, color: N.ink}); ctx.restore(); }
  // input bar
  rr(ctx, 40, 1770, 1000, 100, 50); ctx.fillStyle = '#1a1a1d'; ctx.fill(); text(ctx, 'Nachricht', 100, 1832, {size: 34, weight: 500, color: '#6c6c74', align: 'left'});
  // the two-tick "seen" at 1.5
  if (t > 1.5 && n) text(ctx, '✓✓ gelesen', 70, 920, {size: 26, weight: 600, color: N.cyan, align: 'left', alpha: seg(t, 1.5, 1.6)});
  finish(t, .05, .4);
}

function neon(t) {
  begin(N.ink);
  const bg = ctx.createRadialGradient(540, 1000, 50, 540, 960, 1300); bg.addColorStop(0, '#1d0f3c'); bg.addColorStop(.6, '#0a0618'); bg.addColorStop(1, '#030208'); ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1920);
  const bp = bassPulse(t), fin = seg(t, AS, AE);
  // horizon glow
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const hz = ctx.createLinearGradient(0, 1150, 0, 1450); hz.addColorStop(0, 'rgba(255,61,190,0)'); hz.addColorStop(.5, `rgba(255,61,190,${(.18 + .12 * bp) * (1 - fin)})`); hz.addColorStop(1, 'rgba(255,61,190,0)'); ctx.fillStyle = hz; ctx.fillRect(0, 1150, 1080, 300); ctx.restore();
  // warp streaks during flight
  const warp = (1 - seg(t, 5.6, 6.3)) * seg(t, DROP, DROP + .2);
  if (warp > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const rs = mulberry32(9); for (let i = 0; i < 90; i++) { const a = rs() * 6.283, sp = .4 + rs(), ph = (rs() + t * sp * .9) % 1, r0 = 80 + ph * ph * 1300, len = 30 + ph * 260 * (1 + bp); const c = i % 3 ? '61,245,255' : '255,61,190'; ctx.strokeStyle = `rgba(${c},${.55 * warp * ph})`; ctx.lineWidth = 1 + ph * 3; ctx.beginPath(); ctx.moveTo(540 + Math.cos(a) * r0, 900 + Math.sin(a) * r0); ctx.lineTo(540 + Math.cos(a) * (r0 + len), 900 + Math.sin(a) * (r0 + len)); ctx.stroke(); } ctx.restore(); }
  // camera
  const kick = .03 * bp * (1 - fin);
  const camZ = lerp(4.0, 4.45, eio(fin)), camY = lerp(.35, .0, eio(fin));
  cam.position.set(Math.sin(t * .7) * .25 * (1 - fin), camY + kick, camZ); cam.lookAt(0, lerp(-.2, -.02, eio(fin)), lerp(-10, 0, eio(fin)));
  cam.rotation.z += Math.sin(t * .9) * .05 * (1 - fin); cam.updateProjectionMatrix();
  grid.position.z = ((t - DROP) * 2.6) % (80 / 64); grid.material.opacity = (.55 + .3 * bp) * (1 - fin);
  // panels
  const poses = PANELS.map((p, i) => panelPose(p, i, t));
  PANELS.forEach((p, i) => { const q = poses[i]; p.mesh.position.copy(q.pos); p.mesh.rotation.copy(q.rot); p.mat.opacity = eo3(seg(t, p.fillAt, p.fillAt + .3)) * (.85 + .15 * q.a); p.mesh.scale.setScalar(lerp(2.3, 1, q.a)); });
  const ph = eo5(seg(t, AE - .45, AE + .1)); phoneG.visible = ph > 0; phoneG.scale.setScalar(lerp(1.3, 1, ph)); body.material.opacity = 1; screenBg.material.opacity = ph;
  const tilt = (1 - eio(seg(t, AE, 9.0))) * .25; phoneG.rotation.set(-.05 * tilt, -.35 * tilt, 0);
  PANELS.forEach(p => { if (seg(t, AE, 9.0) > 0) { p.mesh.position.applyEuler(phoneG.rotation); p.mesh.rotation.x += phoneG.rotation.x; p.mesh.rotation.y += phoneG.rotation.y; } });
  pl.intensity = 6 + 20 * bp; pl2.intensity = 6 + 14 * bp;
  renderer.render(scene, cam); blit(glc);
  // neon outlines (projected), drawn on bass hits
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
  PANELS.forEach((p, i) => {
    const d = eo3(seg(t, p.drawAt, p.drawAt + .32)); if (d <= 0) return;
    const m = p.mesh; m.updateMatrixWorld();
    const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => proj(new THREE.Vector3(sx * p.w / 2, sy * p.h / 2, 0).applyMatrix4(m.matrixWorld)));
    if (cs.some(c => c[2] > 1)) return;
    const per = cs.reduce((s, c, k) => s + Math.hypot(cs[(k + 1) % 4][0] - c[0], cs[(k + 1) % 4][1] - c[1]), 0);
    const fade = 1 - .75 * seg(t, AE - .2, AE + .4);
    for (const [lw, a, blur, col] of [[7, .55, 30, p.col], [2.5, 1, 0, '#ffffff']]) {
      ctx.setLineDash([per * d, per]); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.globalAlpha = a * fade * (.75 + .25 * bassPulse(t)); ctx.shadowColor = p.col; ctx.shadowBlur = blur;
      ctx.beginPath(); cs.forEach((c, k) => k ? ctx.lineTo(c[0], c[1]) : ctx.moveTo(c[0], c[1])); ctx.closePath(); ctx.stroke();
    }
  });
  ctx.restore(); ctx.setLineDash([]);
  // phone neon rim
  if (ph > 0) { phoneG.updateMatrixWorld(); const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => proj(new THREE.Vector3(sx * .4, sy * .83, 0).applyMatrix4(phoneG.matrixWorld)));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const [lw, a, col] of [[10, .5, N.mag], [3, .9, '#fff']]) { ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.globalAlpha = a * ph * (.7 + .3 * bp); ctx.shadowColor = N.mag; ctx.shadowBlur = 40; ctx.beginPath(); cs.forEach((c, k) => k ? ctx.lineTo(c[0], c[1]) : ctx.moveTo(c[0], c[1])); ctx.closePath(); ctx.stroke(); } ctx.restore(); }
  bloom(out, .55 + .35 * bp, 10);
  // texts
  const k1 = seg(t, DROP + .05, DROP + .2) * (1 - seg(t, 3.0, 3.25));
  if (k1 > 0) text(ctx, 'Klar.', 540, 960, {size: 260, weight: 900, ls: -6, color: '#fff', alpha: k1, scale: lerp(1.25, 1, eo5(seg(t, DROP, DROP + .25))), shadow: N.cyan, blur: 60});
  const s2 = seg(t, 3.988, 4.15) * (1 - seg(t, 5.4, 5.6));
  if (s2 > 0) { text(ctx, 'Design.', 540, 330, {size: 110, weight: 900, ls: -2, color: '#fff', alpha: s2, shadow: N.mag, blur: 40}); }
  const s3 = seg(t, 4.926, 5.1) * (1 - seg(t, 5.9, 6.0));
  if (s3 > 0) text(ctx, 'Code.', 540, 460, {size: 110, weight: 900, ls: -2, color: '#fff', alpha: s3, shadow: N.cyan, blur: 40});
  const e = seg(t, AE, AE + .2);
  if (e > 0) {
    text(ctx, 'Bis morgen?', 540, 250, {size: 74, weight: 800, color: '#cfc9ff', alpha: e});
    text(ctx, 'Klar.', 540, 410, {size: 160, weight: 900, ls: -4, color: '#fff', alpha: seg(t, AE + .15, AE + .3), scale: lerp(1.2, 1, eo5(seg(t, AE + .15, AE + .4))), shadow: N.cyan, blur: 50});
    const e2 = seg(t, 7.966, 8.15);
    text(ctx, 'WEBDESIGN AUS ERLANGEN', 540, 1560, {size: 30, weight: 700, ls: 9, color: N.cyan, alpha: e2});
    glint(...proj(new THREE.Vector3(.33, .78, .05).applyMatrix4(phoneG.matrixWorld)).slice(0, 2), .9, Math.sin(seg(t, 8.256, 8.75) * Math.PI));
  }
  flash(t, DROP, .25, '200,250,255', .85); flash(t, AE - .05, .2, '255,200,240', .35);
  finish(t, .05, .5); handle(false);
}

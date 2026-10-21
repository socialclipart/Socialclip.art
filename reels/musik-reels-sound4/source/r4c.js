// 4C — Endlos-Zoom: frames inside frames, a zoom punch on every kick, seamless loop back to the start
import * as F from './fx.js';
const {ctx, seg, lerp, eo3, eo5, eio, pulse, text, rr, symbol, wordmark, BRAND} = F;
const A = await F.loadAudio('s4'), g = F.G.s4, b = g.beats;
const K = 6, PW = 1080 / K, PHh = 1920 / K, PX = 540 - PW / 2, PY = 960 - PHh / 2; // portal = 1/6 of the frame, centred
const N = 6;
function frameAround(c, pad, col, r = 6) { c.fillStyle = col; rr(c, PX - pad, PY - pad, PW + 2 * pad, PHh + 2 * pad, r); c.fill(); }
const SC = [
  c => { // 0 gallery wall
    c.fillStyle = '#efe9dd'; c.fillRect(0, 0, 1080, 1920); const gr = c.createRadialGradient(540, 700, 50, 540, 900, 1100); gr.addColorStop(0, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(120,100,70,.25)'); c.fillStyle = gr; c.fillRect(0, 0, 1080, 1920);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(PX - 30, PY - 10, PW + 60, PHh + 70); frameAround(c, 28, '#1b1714'); frameAround(c, 12, '#f8f4ec');
    text(c, 'Wie tief', 540, 560, {size: 96, weight: 900, ls: -2, color: '#1b1714'}); text(c, 'geht das?', 540, 660, {size: 96, weight: 900, ls: -2, color: '#b4532a'});
    text(c, 'Nº 01 — ZOOM', 540, 1300, {size: 26, weight: 700, ls: 10, color: '#6d5f4c'}); c.fillStyle = '#d9cfbf'; c.fillRect(0, 1600, 1080, 320); },
  c => { // 1 night facade with lit window
    const gr = c.createLinearGradient(0, 0, 0, 1920); gr.addColorStop(0, '#0b1026'); gr.addColorStop(1, '#1d1432'); c.fillStyle = gr; c.fillRect(0, 0, 1080, 1920);
    for (let y = 0; y < 1920; y += 160) for (let x = 0; x < 1080; x += 120) { if (Math.abs(x + 60 - 540) < 140 && Math.abs(y + 80 - 960) < 220) continue; c.fillStyle = ((x * 7 + y * 3) % 5 === 0) ? 'rgba(255,210,140,.75)' : 'rgba(255,255,255,.05)'; c.fillRect(x + 25, y + 30, 70, 100); }
    frameAround(c, 18, '#2a2340'); const gl = c.createRadialGradient(540, 960, 20, 540, 960, 420); gl.addColorStop(0, 'rgba(255,190,110,.55)'); gl.addColorStop(1, 'rgba(255,190,110,0)'); c.fillStyle = gl; c.fillRect(0, 500, 1080, 900);
    text(c, 'TIEFER.', 540, 600, {font: 'Anton', size: 170, color: '#ff3dbe', shadow: '#ff3dbe', blur: 30}); },
  c => { // 2 hand holding a phone
    c.fillStyle = '#e6d0ad'; c.fillRect(0, 0, 1080, 1920); c.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 1920; i += 48) c.fillRect(0, i, 1080, 2);
    c.fillStyle = '#c58e66'; c.beginPath(); c.ellipse(540, 1240, 230, 300, 0, 0, 7); c.fill(); c.fillRect(380, 1300, 320, 700);
    frameAround(c, 22, '#0e0e10', 34); c.fillStyle = '#c58e66'; for (const [x, y] of [[PX - 40, 900], [PX - 46, 990], [PX + PW + 28, 930]]) { c.beginPath(); c.ellipse(x + 10, y, 28, 40, 0, 0, 7); c.fill(); }
    text(c, 'NOCH TIEFER.', 540, 560, {font: 'Anton', size: 150, color: '#121212'}); },
  c => { // 3 phone screen: reels grid, centre tile is the portal
    c.fillStyle = '#0d0d10'; c.fillRect(0, 0, 1080, 1920); text(c, 'socialclip.art', 540, 300, {size: 60, weight: 800, color: '#fff'}); text(c, '24,8 Tsd. Follower', 540, 370, {size: 34, weight: 500, color: '#999'});
    const cols = ['#e8573a', '#e6d0ad', '#3df5ff', '#8a5cff', '#f4f1ea', '#ffcc00', '#2f3e2c', '#ff4d6d'];
    for (let r = -2; r <= 2; r++) for (let q = -2; q <= 2; q++) { if (!r && !q) continue; const x = PX + q * (PW + 8), y = PY + r * (PHh + 8); c.fillStyle = cols[(r * 5 + q + 20) % 8]; c.fillRect(x, y, PW, PHh); symbol(c, x + PW / 2, y + PHh / 2, 60, 'rgba(0,0,0,.35)'); }
    frameAround(c, 6, '#fff', 0); },
  c => { // 4 subway poster
    c.fillStyle = '#c9cfd6'; c.fillRect(0, 0, 1080, 1920); for (let y = 0; y < 1920; y += 64) for (let x = (y / 64) % 2 * 32; x < 1080; x += 64) { c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x, y, 60, 60); }
    c.fillStyle = '#121212'; rr(c, PX - 160, PY - 380, PW + 320, PHh + 760, 10); c.fill(); c.fillStyle = '#f4f1ea'; rr(c, PX - 140, PY - 360, PW + 280, PHh + 720, 6); c.fill();
    text(c, 'DESIGN', 540, PY - 220, {font: 'Anton', size: 140, color: '#121212'}); text(c, 'MIT TIEFE', 540, PY - 90, {font: 'Anton', size: 96, color: '#e8573a'}); frameAround(c, 6, '#121212', 0);
    text(c, 'AB JETZT · ÜBERALL', 540, PY + PHh + 150, {size: 30, weight: 800, ls: 8, color: '#121212'}); text(c, 'FAST …', 540, 300, {font: 'Anton', size: 130, color: '#121212'}); },
  c => { // 5 SocialClip brand wall (CTA) — its portal holds scene 0 again: seamless loop
    c.fillStyle = '#121212'; c.fillRect(0, 0, 1080, 1920); const gr = c.createRadialGradient(540, 960, 30, 540, 960, 900); gr.addColorStop(0, 'rgba(230,208,173,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 1080, 1920);
    wordmark(c, 540, 470, 640); text(c, 'Content mit Tiefe.', 540, 590, {size: 54, weight: 800, color: '#e6d0ad'}); frameAround(c, 16, '#e6d0ad', 8);
    text(c, '↻ Nochmal?', 540, 1420, {size: 64, weight: 900, color: '#f4f1ea'}); text(c, '@socialclip.art', 540, 1500, {size: 36, weight: 600, color: '#86827b'}); },
];
// zoom level: one scene per bar, stepped by the kicks; normalised so the end is exactly N scenes later (= loop)
function raw(t) { let p = .25 * Math.min(t, b[0]) / b[0]; for (let k = 0; k < b.length; k++) { const bk = b[k]; if (bk > t) break;
  let step = .25; if (bk > g.brk - .05 && bk < g.drop - .05) step = -.08; if (Math.abs(bk - g.drop) < .01) step = .6; p += step * eo5(seg(t, bk, bk + (step > .5 ? .35 : .26))); }
  return p + .1 * seg(t, b[b.length - 1], g.dur); }
const RAW_END = raw(g.dur);
const level = t => N * raw(t) / RAW_END;
const off = document.createElement('canvas'); off.width = 1080; off.height = 1920; const og = off.getContext('2d');
function sceneCanvas(i) { // cache each scene once
  if (!sceneCanvas.c) sceneCanvas.c = []; if (sceneCanvas.c[i]) return sceneCanvas.c[i];
  const c = document.createElement('canvas'); c.width = 1620; c.height = 2880; const g2 = c.getContext('2d'); g2.scale(1.5, 1.5); SC[i](g2); sceneCanvas.c[i] = c; return c;
}
function drawLevel(L) {
  const s = Math.floor(L), u = L - s; let z = Math.pow(K, u);
  for (let d = 0; d < 3; d++) { const idx = ((s + d) % N + N) % N, zz = z / Math.pow(K, d); if (zz * 1080 < 8) break;
    ctx.save(); ctx.translate(540, 960); ctx.scale(zz, zz); ctx.translate(-540, -960);
    if (d > 0) { ctx.beginPath(); ctx.rect(0, 0, 1080, 1920); ctx.clip(); }
    ctx.drawImage(sceneCanvas(idx), 0, 0, 1080, 1920); ctx.restore(); }
}
export function frame(t) {
  const lo = F.env(A, 'low', t), kp = F.hitP(t, b, .18), cp = F.hitP(t, g.claps, .25);
  F.begin('#000'); const L = level(t);
  ctx.save(); F.cam(1, (cp * .035) * (Math.floor(t) % 2 ? 1 : -1)); drawLevel(L); ctx.restore();
  const brk = t >= g.brk && t < g.drop; if (brk) { ctx.fillStyle = `rgba(0,0,0,${.55 * seg(t, g.brk, g.brk + .2)})`; ctx.fillRect(0, 0, 1080, 1920); text(ctx, 'Achtung …', 540, 1700, {size: 60, weight: 900, color: '#fff', alpha: seg(t, g.brk, g.brk + .15)}); }
  F.zoomBlur(kp * 1.4 + F.pulse(t, g.drop, .45) * 3); F.rgbSplit(2 + 8 * kp);
  F.flash(t, g.drop, .2, '255,250,240', .8); F.finish(t, .04, .35);
}

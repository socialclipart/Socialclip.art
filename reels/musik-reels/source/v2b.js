// Video 2 (Variante B) — "Wir bringen deine Marke zum Leuchten." Neon sign at night, sound 2.
import {ctx, out, S, W, H, clamp, seg, lerp, eo3, eo5, eio, back, pulse, mulberry32, text, rr, finish, bloom, flash, sweep, handle, begin, BRAND, SYM_PATHS} from './common.js';

const INTRO = [0.209, 0.406, 0.685, 0.929, 1.184], DROP = 2.067;
const BASS = [2.104, 2.322, 2.572, 2.795, 3.043, 3.29, 3.52, 3.775, 3.988, 4.199, 4.492, 4.716, 4.926, 5.139, 5.432, 5.659, 6.024, 6.34, 6.598, 6.805, 7.024, 7.27, 7.54, 7.745, 7.966, 8.256, 8.481, 8.688, 8.907, 9.154, 9.423];
const bassP = t => BASS.reduce((m, b) => Math.max(m, pulse(t, b, .22)), 0);
const PINK = '255,79,163', CYAN = '70,240,255', WARM = '255,231,194', RED = '255,70,70';
const GROUND = 1360, R = 1.3; // pavement line, cache resolution factor

// ---------- cached set ----------
function cnv(w, h) { const c = document.createElement('canvas'); c.width = Math.round(w * R); c.height = Math.round(h * R); const g = c.getContext('2d'); g.scale(R, R); return [c, g]; }
const [setC, sg] = cnv(1080, 1920);
{
  const rnd = mulberry32(4);
  sg.fillStyle = '#17110f'; sg.fillRect(0, 0, 1080, GROUND);
  for (let row = 0; row * 46 < GROUND; row++) for (let col = -1; col * 120 < 1080; col++) {
    const x = col * 120 + (row % 2 ? 60 : 0), y = row * 46, v = 26 + rnd() * 18;
    sg.fillStyle = `rgb(${v + 18},${v * .62},${v * .5})`; sg.fillRect(x + 3, y + 3, 114, 40);
    sg.fillStyle = `rgba(0,0,0,${rnd() * .25})`; sg.fillRect(x + 3 + rnd() * 80, y + 3, 30, 40);
  }
  const vg = sg.createLinearGradient(0, 0, 0, GROUND); vg.addColorStop(0, 'rgba(5,6,14,.75)'); vg.addColorStop(.5, 'rgba(5,6,14,.35)'); vg.addColorStop(1, 'rgba(5,6,14,.7)'); sg.fillStyle = vg; sg.fillRect(0, 0, 1080, GROUND);
  // window + frame
  sg.fillStyle = '#07080d'; sg.fillRect(130, 830, 820, 470); sg.strokeStyle = '#2a2420'; sg.lineWidth = 16; sg.strokeRect(130, 830, 820, 470); sg.lineWidth = 8; sg.beginPath(); sg.moveTo(540, 830); sg.lineTo(540, 1300); sg.stroke();
  const gl = sg.createLinearGradient(130, 830, 950, 1300); gl.addColorStop(0, 'rgba(120,140,190,.10)'); gl.addColorStop(.45, 'rgba(120,140,190,0)'); gl.addColorStop(.55, 'rgba(160,180,230,.08)'); gl.addColorStop(1, 'rgba(120,140,190,0)'); sg.fillStyle = gl; sg.fillRect(130, 830, 820, 470);
  // sill + pavement
  sg.fillStyle = '#2b2622'; sg.fillRect(110, 1300, 860, 22); sg.fillStyle = '#100f12'; sg.fillRect(0, GROUND - 10, 1080, 10);
  const pv = sg.createLinearGradient(0, GROUND, 0, 1920); pv.addColorStop(0, '#0d0e15'); pv.addColorStop(1, '#040408'); sg.fillStyle = pv; sg.fillRect(0, GROUND, 1080, 560);
  for (let i = 0; i < 3000; i++) { sg.fillStyle = `rgba(255,255,255,${rnd() * .05})`; sg.fillRect(rnd() * 1080, GROUND + rnd() * 560, 2, 1); }
  for (let i = 0; i < 12; i++) { sg.fillStyle = 'rgba(0,0,0,.35)'; sg.beginPath(); sg.ellipse(rnd() * 1080, GROUND + 60 + rnd() * 480, 80 + rnd() * 160, 10 + rnd() * 18, 0, 0, 7); sg.fill(); }
}
const [inC, ig] = cnv(820, 470); // lit interior
{
  const g = ig.createRadialGradient(410, 160, 20, 410, 230, 520); g.addColorStop(0, '#ffb35c'); g.addColorStop(.5, '#8a4a22'); g.addColorStop(1, '#1d0f08'); ig.fillStyle = g; ig.fillRect(0, 0, 820, 470);
  ig.fillStyle = 'rgba(20,10,6,.85)'; for (const x of [150, 420, 660]) { ig.fillRect(x - 70, 330, 140, 12); ig.fillRect(x - 6, 340, 12, 130); ig.beginPath(); ig.arc(x - 90, 360, 36, Math.PI, 0); ig.fill(); ig.fillRect(x - 118, 360, 56, 110); }
  for (const x of [220, 600]) { ig.strokeStyle = 'rgba(20,10,6,.9)'; ig.lineWidth = 3; ig.beginPath(); ig.moveTo(x, 0); ig.lineTo(x, 90); ig.stroke(); ig.fillStyle = '#ffd59a'; ig.beginPath(); ig.arc(x, 110, 26, Math.PI, 0); ig.fill(); }
}

// ---------- neon helpers ----------
function tube(draw, col, I, glow = 1) { // draw(g) fills the tube shape on ctx
  ctx.save();
  ctx.globalAlpha = .18; ctx.fillStyle = ctx.strokeStyle = `rgba(${col},.5)`; draw(); // unlit glass
  if (I > .01) {
    ctx.globalCompositeOperation = 'lighter';
    for (const [blur, a] of [[70, .55], [26, .8], [8, .9]]) { ctx.shadowColor = `rgba(${col},1)`; ctx.shadowBlur = blur * glow; ctx.globalAlpha = a * I; ctx.fillStyle = ctx.strokeStyle = `rgba(${col},1)`; draw(); }
    ctx.shadowBlur = 0; ctx.globalAlpha = I; const [r, g, b] = col.split(',').map(Number); ctx.fillStyle = ctx.strokeStyle = `rgb(${Math.min(255, r + 140)},${Math.min(255, g + 140)},${Math.min(255, b + 140)})`; draw(true);
  }
  ctx.restore();
}
const symPaths = SYM_PATHS.map(d => new Path2D(d));
function neonSign(I, flick, t) {
  // I: [moon, cafe, luna, underline]
  const [Im, Ic, Il, Iu] = I;
  tube(() => { ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(250, 470, 70, -2.3, 1.9); ctx.arc(282, 448, 54, 1.75, -2.15, true); ctx.closePath(); ctx.stroke(); }, CYAN, Im * flick);
  tube(core => { ctx.font = '300 74px Inter'; ctx.letterSpacing = '26px'; ctx.textAlign = 'center'; ctx.fillText('CAFÉ', 553, 440); }, WARM, Ic * flick);
  tube(core => { ctx.font = '400 330px Sacramento'; ctx.letterSpacing = '0px'; ctx.textAlign = 'center'; ctx.fillText('Luna', 575, 700); }, PINK, Il * flick, 1.1);
  tube(() => { ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(330, 760); ctx.lineTo(820, 760); ctx.stroke(); }, PINK, Iu * flick);
}
function openSign(I) {
  tube(() => { ctx.lineWidth = 7; ctx.beginPath(); ctx.roundRect(700, 900, 210, 96, 20); ctx.stroke(); }, RED, I);
  tube(() => { ctx.font = '600 58px Inter'; ctx.letterSpacing = '8px'; ctx.textAlign = 'center'; ctx.fillText('OPEN', 809, 970); }, CYAN, I);
}
function neonSymbol(x, y, size, I) {
  tube(() => { ctx.save(); ctx.translate(x, y); const k = size / 194; ctx.scale(k, k); ctx.translate(-128, -128); ctx.lineWidth = 7 / k; ctx.lineJoin = 'round'; for (const p of symPaths) ctx.stroke(p); ctx.restore(); }, WARM, I);
}
function spill(I, Io) { // light falling onto wall + pavement
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(560, 600, 20, 560, 600, 780); g.addColorStop(0, `rgba(${PINK},${.42 * I})`); g.addColorStop(.5, `rgba(${PINK},${.12 * I})`); g.addColorStop(1, `rgba(${PINK},0)`); ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, GROUND);
  const c = ctx.createRadialGradient(250, 470, 10, 250, 470, 380); c.addColorStop(0, `rgba(${CYAN},${.25 * I})`); c.addColorStop(1, `rgba(${CYAN},0)`); ctx.fillStyle = c; ctx.fillRect(0, 0, 1080, GROUND);
  const w = ctx.createRadialGradient(540, 1300, 20, 540, 1450, 640); w.addColorStop(0, `rgba(255,170,90,${.35 * Io})`); w.addColorStop(1, 'rgba(255,170,90,0)'); ctx.fillStyle = w; ctx.fillRect(0, 1000, 1080, 920);
  ctx.restore();
}
// mirrored, rippled reflection of everything above the pavement line
const [refC, rg] = (() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return [c, c.getContext('2d')]; })();
function reflection(t) {
  const gy = GROUND * camK.z + camK.ty, h = H - gy * S; if (h <= 0) return;
  rg.setTransform(1, 0, 0, 1, 0, 0); rg.clearRect(0, 0, W, H);
  const strip = Math.max(2, Math.round(6 * S));
  for (let y = 0; y < h; y += strip) { const src = gy * S - y - strip, dx = Math.sin(y * .045 / S + t * 5) * 7 * S * (y / h + .2); if (src < 0) break; rg.drawImage(out, 0, src, W, strip, dx, gy * S + y, W, strip); }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = .55; ctx.filter = `blur(${3 * S}px)`; ctx.drawImage(refC, 0, gy * S, W, h, 0, gy * S, W, h); ctx.restore();
  ctx.save(); const fade = ctx.createLinearGradient(0, gy, 0, 1920); fade.addColorStop(0, 'rgba(4,4,8,.15)'); fade.addColorStop(1, 'rgba(4,4,8,.75)'); ctx.fillStyle = fade; ctx.fillRect(0, gy, 1080, 1920 - gy); ctx.restore();
}
function rain(t, I) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = mulberry32(12);
  for (let i = 0; i < 260; i++) { const x = r() * 1180 - 50, sp = 1500 + r() * 900, len = 40 + r() * 60, y = ((r() * 2400 + t * sp) % 2400) - 300, near = r();
    const lit = Math.max(0, 1 - Math.hypot(x - 560, y - 600) / 900) * I;
    ctx.strokeStyle = `rgba(${lit > .15 ? PINK : '170,190,230'},${(.12 + .3 * lit) * (.4 + .6 * near)})`; ctx.lineWidth = 1 + near * 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + len); ctx.stroke(); }
  for (let i = 0; i < 14; i++) { const ph = ((t * 1.3 + i * .37) % 1), x = (i * 211) % 1080, y = GROUND + 80 + (i * 97) % 440; ctx.strokeStyle = `rgba(200,210,255,${.18 * (1 - ph)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y, 10 + 60 * ph, 3 + 12 * ph, 0, 0, 7); ctx.stroke(); }
  ctx.restore();
}

// ---------- intensities ----------
function signI(t) {
  if (t >= DROP) { const b = bassP(t); const flick = (t > 4.70 && t < 4.78) || (t > 6.36 && t < 6.40) ? .35 : 1; return {I: [1, 1, 1, 1], f: (.86 + .14 * b) * flick}; }
  // sputter on the intro hits
  const sp = (h, len) => (t >= h && t < h + len) ? (Math.sin((t - h) * 140) > -.3 ? 1 : .2) : 0;
  return {I: [Math.max(sp(.209, .09), sp(.685, .12), sp(1.184, .2)), Math.max(sp(.406, .08), sp(.929, .14), sp(1.184, .16) * .7), Math.max(sp(.685, .1), sp(.929, .16), sp(1.184, .22)), Math.max(sp(.929, .1), sp(1.184, .1))], f: 1};
}
const camK = {z: 1, tx: 0, ty: 0};
function camera(t) {
  let z = lerp(1.0, 1.05, eio(seg(t, 0, DROP)));
  z += .07 * (1 - eo5(seg(t, DROP, DROP + .45))) * (t >= DROP ? 1 : 0);
  z = lerp(z, 1.14, eio(seg(t, DROP + .4, 6.6)));
  z = lerp(z, .94, eio(seg(t, 6.6, 8.0)));
  const fx = 560, fy = lerp(720, 860, eio(seg(t, 6.6, 8.0)));
  camK.z = z; camK.tx = 540 - fx * z + Math.sin(t * .8) * 6; camK.ty = 960 - fy * z + (t >= DROP ? 4 * bassP(t) : 0) + lerp(0, 60, eio(seg(t, 6.6, 8.0)));
}

export function frame(t) {
  begin('#05050a'); camera(t);
  const {I, f} = signI(t), lightI = Math.max(...I) * f, openI = t >= 5.432 ? (t < 5.5 ? (Math.sin(t * 160) > 0 ? 1 : .3) : 1) * f : 0;
  const interior = eo3(seg(t, 5.432, 5.8));
  ctx.save(); ctx.translate(camK.tx, camK.ty); ctx.scale(camK.z, camK.z);
  ctx.drawImage(setC, 0, 0, 1080, 1920);
  if (interior > 0) { ctx.globalAlpha = interior * .82; ctx.drawImage(inC, 130, 830, 820, 470); ctx.globalAlpha = 1; }
  spill(lightI * (t >= DROP ? 1 : .6), interior * f);
  neonSign(I, f, t); openSign(openI);
  const se = eo3(seg(t, 7.966, 8.3)); if (se > 0) neonSymbol(540, 1095, 230, se * (t < 8.05 ? (Math.sin(t * 150) > 0 ? 1 : .3) : f));
  ctx.restore();
  reflection(t); rain(t, lightI * (t >= DROP ? 1 : 0));
  bloom(out, .45 * lightI + .1, 9);
  // captions
  const cap = (s, y, a, b, o = {}) => { const u = seg(t, a, a + .12), v = 1 - seg(t, b - .15, b); if (u <= 0 || v <= 0) return; text(ctx, s, 540, y + 16 * (1 - eo3(u)), {size: 72, weight: 800, color: '#fff', alpha: u * v, shadow: 'rgba(0,0,0,.8)', blur: 30, ...o}); };
  cap('Dein Laden um 23 Uhr …', 230, .2, 1.95, {size: 64});
  cap('… sieht dich keiner.', 320, 1.184, 1.95, {size: 64, color: '#9aa0b8'});
  cap('Jetzt schon.', 260, DROP + .02, 3.95, {size: 96, weight: 900, shadow: `rgba(${PINK},.9)`, blur: 40});
  [['Logo.', 3.988], ['Licht.', 4.926], ['Auftritt.', 5.432]].forEach(([s, a], i) => cap(s, 200 + i * 92, a, 6.6, {size: 84, weight: 900, shadow: `rgba(${[CYAN, PINK, CYAN][i]},.9)`, blur: 36}));
  const e = seg(t, 7.966, 8.2);
  if (e > 0) {
    text(ctx, 'Wir bringen deine Marke', 540, 220, {size: 64, weight: 800, color: '#fff', alpha: e, shadow: 'rgba(0,0,0,.8)', blur: 30});
    text(ctx, 'zum Leuchten.', 540, 330, {size: 112, weight: 900, ls: -2, color: '#fff', alpha: seg(t, 8.256, 8.4), scale: lerp(1.15, 1, eo5(seg(t, 8.256, 8.5))), shadow: `rgba(${PINK},1)`, blur: 50});
    text(ctx, 'LOGO · LICHTWERBUNG · SOCIAL MEDIA', 540, 1560, {size: 28, weight: 700, ls: 7, color: `rgb(${WARM})`, alpha: seg(t, 8.481, 8.7), shadow: 'rgba(0,0,0,.9)', blur: 20});
  }
  flash(t, DROP, .22, '255,210,235', .8);
  finish(t, .055, .55); handle(false);
}

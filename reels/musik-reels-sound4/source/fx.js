// Effects toolkit for the 15 beat reels. All functions draw in 1080x1920 design space on ctx.
import {ctx, out, S, W, H, clamp, seg, lerp, eo3, eo5, ei3, eio, back, pulse, mulberry32, text, measure, rr, finish, bloom, flash, sweep, rays, glint, handle, begin, shake, symbol, wordmark, BRAND} from './common.js';
export * from './common.js';

// ---------- music data ----------
const cache = {};
export async function loadAudio(n) { if (!cache[n]) cache[n] = await (await fetch(`audio/${n}.json`)).json(); return cache[n]; }
export function env(a, band, t, smooth = 1) { const arr = a[band], f = t * a.fps; let s = 0, w = 0; for (let k = -smooth; k <= smooth; k++) { const i = Math.round(f) + k; if (i >= 0 && i < arr.length) { const ww = smooth + 1 - Math.abs(k); s += arr[i] * ww; w += ww; } } return w ? s / w : 0; }

// ---------- beat grids (measured) ----------
const range = (a, step, end) => { const r = []; for (let x = a; x < end - 1e-6; x += step) r.push(+x.toFixed(4)); return r; };
export const G = {
  s1: {dur: 10.70, build: [0.035, 0.186, 0.395, 0.615, 0.859, 1.103, 1.312, 1.556, 1.776, 2.241, 2.705, 2.937, 3.17, 3.39, 3.634, 4.087, 4.551, 4.783, 5.004, 5.236, 5.468], gap: 5.70, drop: 5.927,
    kicks: [5.927, 6.379, 6.85, 7.311, 7.772, 8.224, 8.695, 9.154, 9.615, 10.072, 10.533]},
  s2: {dur: 9.545, intro: [0.209, 0.406, 0.685, 0.929, 1.184], drop: 2.067,
    bass: [2.104, 2.322, 2.572, 2.795, 3.043, 3.29, 3.52, 3.775, 3.988, 4.199, 4.492, 4.716, 4.926, 5.139, 5.432, 5.659, 6.024, 6.34, 6.598, 6.805, 7.024, 7.27, 7.54, 7.745, 7.966, 8.256, 8.481, 8.688, 8.907, 9.154, 9.423],
    beats: range(2.104, 0.4627, 9.545)},
  s4: {dur: 12.42, beats: range(0.465, 0.50855, 12.42), claps: range(0.974, 1.0171, 12.42), brk: 8.9, drop: 9.619, bar: 2.0342},
  s3: {dur: 16.882, hits: [0.07, 0.453, 0.906], swell: 1.516, sub: [1.516, 1.791, 1.993, 2.224, 2.47, 2.701, 2.946, 3.163, 3.378, 3.61, 3.825, 4.086],
    g0: 6.455, q: 0.4627, beats: range(6.455, 0.4627, 16.882), eighths: range(6.455, 0.23135, 16.882)},
};
export const hitP = (t, list, len = .2) => { let p = 0; for (const h of list) { if (h > t) break; p = Math.max(p, pulse(t, h, len)); } return p; };
export const idx = (t, list) => { let i = -1; for (let k = 0; k < list.length; k++) if (t >= list[k]) i = k; return i; };
export const since = (t, list) => { const i = idx(t, list); return i < 0 ? 99 : t - list[i]; };

// ---------- camera helpers ----------
export function cam(z = 1, rot = 0, dx = 0, dy = 0, cx = 540, cy = 960) { ctx.translate(cx + dx, cy + dy); ctx.rotate(rot); ctx.scale(z, z); ctx.translate(-cx, -cy); }

// ---------- snapshot based post fx ----------
const snap = document.createElement('canvas'); snap.width = W; snap.height = H; const sg = snap.getContext('2d');
const tint = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; });
export function takeSnap() { sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = 'copy'; sg.drawImage(out, 0, 0); sg.globalCompositeOperation = 'source-over'; return snap; }
export function rgbSplit(amt) { // amt in px
  if (amt < .5) return; takeSnap(); const cols = ['#ff0000', '#00ff00', '#0000ff'], off = [-amt, 0, amt];
  tint.forEach((c, i) => { const g = c.getContext('2d'); g.globalCompositeOperation = 'copy'; g.drawImage(snap, 0, 0); g.globalCompositeOperation = 'multiply'; g.fillStyle = cols[i]; g.fillRect(0, 0, W, H); });
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
  tint.forEach((c, i) => ctx.drawImage(c, off[i] * S, 0)); ctx.restore();
}
export function glitch(t, amt, seed = 1) {
  if (amt <= 0) return; takeSnap(); const r = mulberry32(Math.floor(t * 30) * 7 + seed);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const n = Math.floor(4 + 14 * amt);
  for (let i = 0; i < n; i++) { const y = r() * H, h = (8 + r() * 90) * S, dx = (r() - .5) * 220 * S * amt; ctx.drawImage(snap, 0, y, W, h, dx, y, W, h); if (r() < .3 * amt) { ctx.fillStyle = r() < .5 ? 'rgba(255,0,90,.35)' : 'rgba(0,255,230,.3)'; ctx.fillRect(0, y, W, h * .3); } }
  ctx.restore();
}
export function scanlines(a = .12) { ctx.save(); ctx.fillStyle = `rgba(0,0,0,${a})`; for (let y = 0; y < 1920; y += 6) ctx.fillRect(0, y, 1080, 2); ctx.restore(); }
export function kaleido(segs = 8, rot = 0, zoom = 1) {
  takeSnap(); ctx.save(); ctx.setTransform(S, 0, 0, S, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1080, 1920);
  for (let i = 0; i < segs; i++) { ctx.save(); ctx.translate(540, 960); ctx.rotate(rot + i * Math.PI * 2 / segs); if (i % 2) ctx.scale(1, -1);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1600, -Math.PI / segs, Math.PI / segs); ctx.closePath(); ctx.clip(); ctx.scale(zoom, zoom); ctx.drawImage(snap, -540, -960, 1080, 1920); ctx.restore(); }
  ctx.restore();
}
export function zoomBlur(amt, cx = 540, cy = 960) { // radial echo
  if (amt <= .01) return; takeSnap(); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
  for (let k = 1; k <= 4; k++) { const z = 1 + amt * k * .04; ctx.globalAlpha = .18 * amt; ctx.drawImage(snap, cx * S - cx * S * z, cy * S - cy * S * z, W * z, H * z); }
  ctx.restore();
}
export function invert(a = 1) { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); }

// ---------- particles & shapes ----------
export function burst(x, y, t0, t, o = {}) {
  const pt = t - t0; if (pt < 0 || pt > (o.life || 1.2)) return; const r = mulberry32(o.seed || 3), n = o.n || 80, cols = o.cols || ['#fff'];
  ctx.save(); if (o.add !== false) ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const a = r() * 6.283, v = (o.v || 900) * (.3 + r()), s = (o.size || 5) * (.4 + r()); const k = 1 - Math.exp(-pt * (o.drag || 3));
    const px = x + Math.cos(a) * v * k / (o.drag || 3), py = y + Math.sin(a) * v * k / (o.drag || 3) + (o.grav || 0) * pt * pt;
    ctx.globalAlpha = (1 - pt / (o.life || 1.2)) * (.5 + .5 * r()); ctx.fillStyle = cols[i % cols.length];
    if (o.rect) { ctx.save(); ctx.translate(px, py); ctx.rotate(pt * 8 * (r() - .5) + a); ctx.fillRect(-s, -s * .45, s * 2, s * .9); ctx.restore(); } else { ctx.beginPath(); ctx.arc(px, py, s, 0, 7); ctx.fill(); } }
  ctx.restore();
}
export function shock(x, y, t0, t, col = '255,255,255', maxR = 900, len = .5, lw = 14) {
  const u = seg(t, t0, t0 + len); if (u <= 0 || u >= 1) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${col},${(1 - u) * .9})`; ctx.lineWidth = lw * (1 - u) + 1; ctx.beginPath(); ctx.arc(x, y, maxR * eo3(u), 0, 7); ctx.stroke(); ctx.restore();
}
export function speedLines(cx, cy, t, amt, col = '255,255,255', n = 70, seed = 5) {
  if (amt <= 0) return; const r = mulberry32(seed); ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const a = r() * 6.283, ph = (r() + t * (.8 + r())) % 1, r0 = 120 + ph * ph * 1300, len = 40 + ph * 380; ctx.strokeStyle = `rgba(${col},${.6 * amt * ph})`; ctx.lineWidth = 1 + ph * 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len)); ctx.stroke(); }
  ctx.restore();
}
export function leaks(t, a = .35, cols = ['255,140,60', '255,60,140', '120,90,255']) {
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  cols.forEach((c, i) => { const x = 540 + Math.sin(t * .7 + i * 2.1) * 520, y = 960 + Math.cos(t * .5 + i * 1.7) * 820, r = 600 + 200 * Math.sin(t + i); const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1920); });
  ctx.restore();
}
export function bokeh(t, n = 30, a = .25, col = '255,230,190', seed = 8) {
  const r = mulberry32(seed); ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const x = (r() * 1080 + t * 20 * (r() - .5)) % 1080, y = (r() * 1920 - t * 40 * r() + 1920) % 1920, s = 20 + r() * 70; const g = ctx.createRadialGradient(x, y, 0, x, y, s); g.addColorStop(0, `rgba(${col},${a * r()})`); g.addColorStop(.7, `rgba(${col},${a * .4})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill(); }
  ctx.restore();
}
export function tunnel(t, speed, col = '255,255,255', a = .5, n = 16, cx = 540, cy = 960, rot = 0) {
  ctx.save(); ctx.lineWidth = 3;
  for (let i = 0; i < n; i++) { const ph = ((i / n) + t * speed) % 1, z = Math.pow(ph, 2.4) * 3; ctx.strokeStyle = `rgba(${col},${a * ph})`; ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot * ph); ctx.strokeRect(-540 * z, -960 * z, 1080 * z, 1920 * z); ctx.restore(); }
  ctx.restore();
}
export function rings(cx, cy, t, e, col = '255,255,255', n = 5) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const r = 180 + i * 90 + e * 60 * (i + 1) * .5; ctx.strokeStyle = `rgba(${col},${.5 - i * .08})`; ctx.lineWidth = 3 + e * 6; ctx.setLineDash([20 + i * 10, 14 + i * 6]); ctx.lineDashOffset = t * (i % 2 ? 120 : -160); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); }
  ctx.restore(); ctx.setLineDash([]);
}
export function blobs(t, cols, e = 0, a = .9) { // liquid gradient
  ctx.save(); ctx.filter = 'blur(60px)'; cols.forEach((c, i) => { const x = 540 + Math.sin(t * .9 + i * 2.4) * 380, y = 960 + Math.cos(t * .7 + i * 1.9) * 620, r = 380 + 120 * Math.sin(t * 1.3 + i) + 160 * e; ctx.fillStyle = c; ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }); ctx.restore();
}
export function grid(a = .1, step = 90, col = '255,255,255', off = 0) { ctx.save(); ctx.strokeStyle = `rgba(${col},${a})`; ctx.lineWidth = 1.5; for (let x = (off % step); x <= 1080; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1920); ctx.stroke(); } for (let y = (off % step); y <= 1920; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke(); } ctx.restore(); }
export function strobe(on, col = '#fff', a = 1) { if (!on) return; ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = a; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); }

// ---------- kinetic type ----------
export function fit(str, maxW, o) { return Math.min(o.max || 400, maxW / measure(ctx, str, {...o, size: 100}) * 100); }
export function slam(str, x, y, t0, t, o = {}) { // big word slams in from scale
  const u = seg(t, t0, t0 + (o.dur || .12)); if (u <= 0) return; const size = o.size || fit(str, o.w || 980, o);
  text(ctx, str, x, y + size * .36, {font: o.font || 'Anton', weight: o.weight || 400, size, color: o.color || '#fff', scale: lerp(o.from || 1.6, 1, eo5(u)) * (o.scale || 1), alpha: Math.min(1, u * 2) * (o.alpha ?? 1), ls: o.ls || 0, shadow: o.shadow, blur: o.blur, rot: o.rot});
}
export function letters(str, x, y, t0, t, o = {}) { // staggered letter drop
  const size = o.size || 80; ctx.save(); ctx.font = `${o.weight || 800} ${size}px ${o.font || 'Inter'}`; ctx.letterSpacing = `${o.ls || 0}px`;
  const ws = [...str].map(c => ctx.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0); let cx = x - tot / 2; ctx.restore();
  [...str].forEach((c, i) => { const u = seg(t, t0 + i * (o.step || .03), t0 + i * (o.step || .03) + (o.dur || .2)); if (u > 0) text(ctx, c, cx + ws[i] / 2, y - (o.dy ?? 90) * (1 - eo5(u)), {font: o.font || 'Inter', weight: o.weight || 800, size, color: o.color || '#fff', alpha: u, rot: (o.spin || 0) * (1 - u)}); cx += ws[i]; });
}
export function wipeText(str, x, y, t0, t, o = {}) { // mask reveal from below
  const u = eo5(seg(t, t0, t0 + (o.dur || .25))); if (u <= 0) return; const size = o.size || 120;
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - size * 1.05, 1080, size * 1.3); ctx.clip();
  text(ctx, str, x, y + size * 1.1 * (1 - u), {font: o.font || 'Inter', weight: o.weight || 900, size, color: o.color || '#fff', ls: o.ls || -2, align: o.align}); ctx.restore();
}
export function echo(fn, t, n = 4, dt = .03) { for (let k = n; k >= 1; k--) { ctx.save(); ctx.globalAlpha *= .14 * (n - k + 1) / n; fn(t - k * dt); ctx.restore(); } fn(t); }
export function bgFill(c1, c2, cx = 540, cy = 900, r = 1300) { const g = ctx.createRadialGradient(cx, cy, 30, cx, cy, r); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1920); }
export function endTag(t, t0, dark = true, y = 1400) {
  const u = seg(t, t0, t0 + .2); if (u <= 0) return; const c = dark ? BRAND.cream : '#121212';
  symbol(ctx, 540, y - 120, 130 * lerp(.6, 1, eo5(u)), c); wordmark(ctx, 540, y + 40, 380, c, u);
}

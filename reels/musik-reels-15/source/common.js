// Shared helpers for the three SocialClip music reels (1080x1920, deterministic).
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export const S = Number(new URLSearchParams(location.search).get('scale')) || 1;
export const W = 2 * Math.round(1080 * S / 2), H = 2 * Math.round(1920 * S / 2);
export const out = document.getElementById('c'); out.width = W; out.height = H;
export const ctx = out.getContext('2d');

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, x) => a + (b - a) * x;
export const eo3 = x => 1 - Math.pow(1 - x, 3);
export const eo5 = x => 1 - Math.pow(1 - x, 5);
export const ei3 = x => x * x * x;
export const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const back = (x, c1 = 1.6) => { const c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
export const pulse = (t, t0, len = .25) => (t >= t0 && t < t0 + len) ? Math.pow(1 - (t - t0) / len, 2) : 0;
export const lastHit = (t, hits) => { let h = -1; for (const x of hits) if (t >= x) h = x; return h; };
export function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const hash = (n) => { const r = mulberry32(Math.floor(n * 1000) + 17); return r(); };

// fonts
const FONTS = [
  ['Bodoni', 'BodoniModa.woff2', {weight: '400 900'}], ['Bodoni', 'BodoniModa-Italic.woff2', {weight: '400 900', style: 'italic'}],
  ['Inter', 'Inter.woff2', {weight: '300 900'}], ['Comic', 'ComicNeue.woff2', {weight: '700'}], ['Anton', 'Anton.woff2', {weight: '400'}], ['Sacramento', 'Sacramento.woff2', {weight: '400'}],
];
for (const [n, f, o] of FONTS) { const ff = new FontFace(n, `url(fonts/${f})`, o); await ff.load(); document.fonts.add(ff); }

// SocialClip symbol (from logo/socialclip-symbol-cream.svg), drawn centred, height = size
const SYM = ['M146.10 66.74 L186.11 43.64 A67.10 67.10 0 1 0 94.45 135.30 L100.57 138.84 L146.77 112.16 L117.55 95.29 A20.90 20.90 0 1 1 146.10 66.74 Z',
  'M109.90 189.26 L69.89 212.36 A67.10 67.10 0 1 0 161.55 120.70 L155.43 117.16 L109.23 143.84 L138.45 160.71 A20.90 20.90 0 1 1 109.90 189.26 Z'];
export const SYM_PATHS = SYM;
const symPaths = SYM.map(d => new Path2D(d));
export function symbol(g, x, y, size, color) {
  g.save(); g.translate(x, y); const k = size / 194; g.scale(k, k); g.translate(-128, -128); g.fillStyle = color; for (const p of symPaths) g.fill(p); g.restore();
}
async function img(src) { const i = new Image(); i.src = src; await i.decode(); return i; }
export const wordmarkImg = await img('assets/socialclip-wordmark-cream.svg');
export function wordmark(g, x, y, w, color = '#f4f1ea', alpha = 1) { // centred
  const h = w * 57 / 598; if (color === '#f4f1ea') { g.save(); g.globalAlpha *= alpha; g.drawImage(wordmarkImg, x - w / 2, y - h / 2, w, h); g.restore(); return; }
  const c = tint(wordmarkImg, color, Math.ceil(w), Math.ceil(h)); g.save(); g.globalAlpha *= alpha; g.drawImage(c, x - w / 2, y - h / 2, w, h); g.restore();
}
const tintCache = new Map();
function tint(im, color, w, h) {
  const k = color + w + 'x' + h; if (tintCache.has(k)) return tintCache.get(k);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.drawImage(im, 0, 0, w, h); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, w, h); tintCache.set(k, c); return c;
}

export const BRAND = {bg: '#121212', cream: '#f4f1ea', dim: '#86827b', soft: '#b0aca4', sand: '#e6d0ad'};

// text with letterSpacing, centred by default
export function text(g, str, x, y, o = {}) {
  g.save(); g.globalAlpha *= o.alpha ?? 1;
  g.font = `${o.style || 'normal'} ${o.weight || 700} ${o.size || 60}px ${o.font || 'Inter'}, "Noto Color Emoji"`;
  g.letterSpacing = `${o.ls || 0}px`; g.textAlign = o.align || 'center'; g.textBaseline = o.base || 'alphabetic';
  g.fillStyle = o.color || '#fff';
  if (o.shadow) { g.shadowColor = o.shadow; g.shadowBlur = o.blur ?? 30; g.shadowOffsetY = o.sy ?? 0; }
  const dx = (o.align || 'center') === 'center' ? (o.ls || 0) / 2 : 0;
  g.translate(x, y); if (o.rot) g.rotate(o.rot); if (o.scale != null) g.scale(o.scale, o.scale);
  if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.strokeW || 8; g.strokeStyle = o.stroke; g.strokeText(str, dx, 0); }
  g.fillText(str, dx, 0); g.restore();
}
export const measure = (g, str, o) => { g.save(); g.font = `${o.style || 'normal'} ${o.weight || 700} ${o.size || 60}px ${o.font || 'Inter'}`; g.letterSpacing = `${o.ls || 0}px`; const w = g.measureText(str).width; g.restore(); return w; };
export function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

// film grain + vignette
const grains = [];
for (let k = 0; k < 4; k++) { const c = document.createElement('canvas'); c.width = 540; c.height = 960; const g = c.getContext('2d'), id = g.createImageData(540, 960), r = mulberry32(50 + k); for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); grains.push(c); }
export function finish(t, grain = .045, vign = .45) {
  if (vign > 0) { const gr = ctx.createRadialGradient(540, 960, 380, 540, 960, 1300); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${vign})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, 1080, 1920); }
  if (grain > 0) { ctx.save(); ctx.globalAlpha = grain; ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(grains[Math.floor(t * 30) % 4], 0, 0, 1080, 1920); ctx.restore(); }
}
// cheap bloom: downsample, blur, add
const bl = document.createElement('canvas'); bl.width = Math.round(W / 4); bl.height = Math.round(H / 4); const blg = bl.getContext('2d');
export function bloom(src, amount = .8, radius = 6, threshold = 0) {
  blg.save(); blg.filter = 'none'; blg.clearRect(0, 0, bl.width, bl.height);
  blg.filter = `blur(${radius}px)${threshold ? ` brightness(${1 - threshold}) contrast(${1 + threshold * 3})` : ''}`; blg.drawImage(src, 0, 0, bl.width, bl.height); blg.restore();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = amount; ctx.drawImage(bl, 0, 0, W, H); ctx.restore();
}
export function flash(t, t0, len = .22, col = '255,250,240', max = .9) {
  const p = pulse(t, t0, len); if (p <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${col},${max * p})`; ctx.fillRect(0, 0, 1080, 1920); ctx.restore();
}
export function sweep(t, t0, dur = .5, col = '255,245,225', a = .35, angle = -.5) { // diagonal light band
  const u = seg(t, t0, t0 + dur); if (u <= 0 || u >= 1) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(540, 960); ctx.rotate(angle);
  const x = lerp(-1400, 1400, eio(u)); const gr = ctx.createLinearGradient(x - 260, 0, x + 260, 0);
  gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(.5, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = gr; ctx.fillRect(-1600, -1600, 3200, 3200); ctx.restore();
}
export function rays(cx, cy, t, col = '255,230,180', a = .25, n = 18, rot = .2) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(cx, cy); ctx.rotate(t * rot);
  for (let i = 0; i < n; i++) {
    ctx.rotate(Math.PI * 2 / n); const gr = ctx.createLinearGradient(0, 0, 0, -1500); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-60 - 30 * Math.sin(i * 7.1), -1500); ctx.lineTo(60 + 30 * Math.sin(i * 3.3), -1500); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
export function glint(x, y, s, a) {
  if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.translate(x, y);
  const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 40 * s); gr.addColorStop(0, 'rgba(255,250,240,1)'); gr.addColorStop(.3, 'rgba(255,235,200,.45)'); gr.addColorStop(1, 'rgba(255,220,170,0)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 40 * s, 0, 7); ctx.fill();
  for (const [len, wid, r] of [[160, 3, 0], [160, 3, Math.PI / 2], [70, 2, Math.PI / 4], [70, 2, -Math.PI / 4]]) { ctx.save(); ctx.rotate(r); const l = ctx.createLinearGradient(-len * s, 0, len * s, 0); l.addColorStop(0, 'rgba(255,235,200,0)'); l.addColorStop(.5, 'rgba(255,252,245,.95)'); l.addColorStop(1, 'rgba(255,235,200,0)'); ctx.fillStyle = l; ctx.fillRect(-len * s, -wid * s / 2, 2 * len * s, wid * s); ctx.restore(); }
  ctx.restore();
}
export function handle(dark = false, y = 1612, a = .6) { text(ctx, '@socialclip.art', 540, y, {size: 32, weight: 600, ls: 1, color: dark ? '#151412' : BRAND.cream, alpha: a}); }

// three.js studio
export function makeGL() {
  const glc = document.createElement('canvas'); glc.width = W; glc.height = H;
  const renderer = new THREE.WebGLRenderer({canvas: glc, antialias: true, preserveDrawingBuffer: true, alpha: true});
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const pmrem = new THREE.PMREMGenerator(renderer); const env = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  return {glc, renderer, env};
}
export function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
export function blit(glc, alpha = 1) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.drawImage(glc, 0, 0); ctx.restore(); }
export function begin(col = '#000') { ctx.setTransform(S, 0, 0, S, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.fillStyle = col; ctx.fillRect(0, 0, 1080, 1920); }
export function shake(t, amt) { if (amt <= 0) return; ctx.translate(amt * Math.sin(t * 97.3) * 14, amt * Math.cos(t * 83.1) * 14); }
export {THREE};

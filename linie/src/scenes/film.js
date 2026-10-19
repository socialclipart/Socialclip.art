// SocialClip reel — one absolute-time timeline. Every frame depends only on t.
const C = { bg: '#121212', cream: '#f4f1ea', soft: '#b0aca4', dim: '#86827b', line: 'rgba(244,241,234,.13)', warm: '#d2b894' };
const FONT = 'Arimo';
const W = 1080, H = 1920;

// ---------- math ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, x) => a + (b - a) * x;
const P = (t, a, b) => clamp((t - a) / (b - a));
const outExpo = x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
const outQuint = x => 1 - Math.pow(1 - x, 5);
const inOutCubic = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const inExpo = x => x <= 0 ? 0 : Math.pow(2, 10 * x - 10);
const outBack = (x, s = 1.6) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
// damped spring 0→1 with one visible overshoot ("Nachfedern")
const spring = (x, k = 7, f = 13) => x <= 0 ? 0 : 1 - Math.exp(-k * x) * Math.cos(f * x);
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ---------- assets ----------
let bgTex, grain = [], das = {};
export async function init() {
  const ff = new FontFace(FONT, 'url(../assets/fonts/arimo-latin-wght.woff2)', { weight: '400 700' });
  await ff.load(); document.fonts.add(ff);
  // background: brand dark + warm top glow + faint concentric rings (as on socialclip.art)
  bgTex = document.createElement('canvas'); bgTex.width = W; bgTex.height = H;
  const b = bgTex.getContext('2d');
  b.fillStyle = C.bg; b.fillRect(0, 0, W, H);
  let g = b.createRadialGradient(540, 260, 0, 540, 260, 1100);
  g.addColorStop(0, 'rgba(70,46,30,.38)'); g.addColorStop(1, 'rgba(18,18,18,0)');
  b.fillStyle = g; b.fillRect(0, 0, W, H);
  b.strokeStyle = 'rgba(255,255,255,.022)'; b.lineWidth = 1;
  for (let r = 10; r < 1500; r += 9) { b.beginPath(); b.arc(540, 820, r, 0, Math.PI * 2); b.stroke(); }
  g = b.createRadialGradient(540, 960, 500, 540, 960, 1300);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
  b.fillStyle = g; b.fillRect(0, 0, W, H);
  for (let i = 0; i < 4; i++) {
    const c = document.createElement('canvas'); c.width = 270; c.height = 480;
    const x = c.getContext('2d'), id = x.createImageData(270, 480), r = rng(99 + i);
    for (let p = 0; p < id.data.length; p += 4) { const v = r() * 255; id.data[p] = id.data[p + 1] = id.data[p + 2] = v; id.data[p + 3] = 255; }
    x.putImageData(id, 0, 0); grain.push(c);
  }
  await initLate();
}

// ---------- drawing helpers ----------
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function glow(ctx, x, y, r, a, col = '255,236,214') {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(.25, `rgba(${col},${a * .35})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function caret(ctx, x, y, h, a) { if (a <= 0) return; ctx.globalAlpha = a; ctx.fillStyle = C.cream; ctx.fillRect(x - 3, y - h / 2, 6, h); ctx.globalAlpha = 1; }
function pointer(ctx, x, y, sc, a) {
  if (a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.globalAlpha = a;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.lineTo(11, 35); ctx.lineTo(20, 55); ctx.lineTo(28, 51); ctx.lineTo(19, 32); ctx.lineTo(34, 32); ctx.closePath();
  ctx.fillStyle = C.cream; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#121212'; ctx.stroke(); ctx.restore();
}
function font(ctx, size, w = 700) { ctx.font = `${w} ${size}px ${FONT}`; ctx.letterSpacing = `${-0.055 * size}px`; }

// ---------- shared text block: words rise behind a mask, block leaves upwards ----------
function textBlock(ctx, lines, t, tIn, tOut, opt = {}) {
  if (t < tIn || t > tOut + .4) return;
  const size = opt.size || 100, x0 = opt.x ?? 90, align = opt.align || 'left';
  const out = inOutCubic(P(t, tOut, tOut + .35));
  ctx.save(); ctx.translate(0, -out * 60); ctx.globalAlpha = 1 - out;
  lines.forEach((l, li) => {
    const lt = t - tIn - li * (opt.gap ?? .16); if (lt <= 0) return;
    font(ctx, size, l.w || 700); if (l.ls != null) ctx.letterSpacing = l.ls + 'px';
    const words = l.text.split(' ');
    const total = ctx.measureText(l.text).width;
    let x = align === 'center' ? 540 - total / 2 : x0;
    ctx.save(); ctx.beginPath(); ctx.rect(0, l.y - size * 1.0, W, size * 1.32); ctx.clip();
    words.forEach((w, i) => {
      const p = clamp((lt - i * .06) / .5), e = outQuint(p);
      ctx.fillStyle = l.col || C.cream;
      ctx.globalAlpha = (1 - out) * clamp(p * 3);
      if (opt.shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 30; }
      ctx.fillText(w, x, l.y + (1 - e) * size * 1.1);
      x += ctx.measureText(w + ' ').width;
    });
    ctx.restore();
  });
  ctx.restore();
}

// logo symbol (two interlocking halves from socialclip-symbol-cream.svg), centred on 0,0
const SYM = [new Path2D('M146.10 66.74 L186.11 43.64 A67.10 67.10 0 1 0 94.45 135.30 L100.57 138.84 L146.77 112.16 L117.55 95.29 A20.90 20.90 0 1 1 146.10 66.74 Z'),
  new Path2D('M109.90 189.26 L69.89 212.36 A67.10 67.10 0 1 0 161.55 120.70 L155.43 117.16 L109.23 143.84 L138.45 160.71 A20.90 20.90 0 1 1 109.90 189.26 Z')];
function drawSymbol(ctx, col, off = [[0, 0], [0, 0]]) {
  ctx.fillStyle = col;
  SYM.forEach((p, i) => { ctx.save(); ctx.translate(off[i][0], off[i][1]); ctx.scale(.9075, .9075); ctx.translate(-128, -128); ctx.fill(p); ctx.restore(); });
}



// =====================================================================
// "Eine Linie" — one continuous line traces real photos, then becomes the logo
// =====================================================================
const SAND = '#e6d0ad';
const P8 = 8 * 60 / 123;              // 8 beats of the track
const R0 = 3.8, RS = [0, 1, 2, 3, 4].map(k => R0 + k * P8); // reveal times (4 photos + logo)
const SUBJ = [
  { key: 'cafe', img: '1-cafe', word: 'Café.', tag: '01 · GASTRONOMIE' },
  { key: 'schere', img: '2-schere', word: 'Friseur.', tag: '02 · BEAUTY' },
  { key: 'hammer', img: '3-hammer', word: 'Handwerk.', tag: '03 · HANDWERK' },
  { key: 'rose', img: '4-rose', word: 'Floristik.', tag: '04 · FLORISTIK' },
];
let CT = {}, PH = [], photoLayer, maskLayer;
async function initLate() {
  CT = await (await fetch(new URL('../contours.json', import.meta.url))).json();
  PH = await Promise.all(SUBJ.map(async s => { const i = new Image(); i.src = `../assets/photos/${s.img}.png`; await i.decode(); return i; }));
}
export function shutter(t) {
  let s = 0;
  RS.forEach(R => { if (t > R - 1.45 && t < R - .3) s = Math.max(s, .8); if (t > R - .05 && t < R + .4) s = Math.max(s, .6); });
  if (t > .8 && t < 2.4) s = Math.max(s, .5);
  return s;
}

// ---------- geometry ----------
const centroid = pts => { let x = 0, y = 0; for (const p of pts) { x += p[0]; y += p[1]; } return [x / pts.length, y / pts.length]; };
function morph(a, b, e, t, dir = 1) {
  const ca = centroid(a), cb = centroid(b), c = [lerp(ca[0], cb[0], e), lerp(ca[1], cb[1], e)];
  const rot = Math.sin(Math.PI * e) * .55 * dir, cs = Math.cos(rot), sn = Math.sin(rot), w = Math.sin(Math.PI * e);
  return a.map((p, i) => {
    let x = lerp(p[0], b[i][0], e) - c[0], y = lerp(p[1], b[i][1], e) - c[1];
    const r = 1 + .12 * w; x *= r; y *= r;
    const wob = Math.sin(i * .045 + t * 7) * 26 * w;
    return [c[0] + x * cs - y * sn + wob, c[1] + x * sn + y * cs + wob * .6];
  });
}
// which contour (and how far drawn) at time t
function linePts(t) {
  let k = RS.findIndex(R => t < R + P8 - 1.4); if (k < 0) k = 4; // current subject index (0..4)
  const S = RS[k] - 1.4;
  if (k === 0) return { pts: CT.cafe, frac: inOutCubic(P(t, S, S + 1.35)), k };
  if (k < 4) {
    const a = CT[SUBJ[k - 1].key], b = CT[SUBJ[k].key];
    return { pts: t < S + 1.1 ? morph(a, b, inOutCubic(P(t, S, S + 1.1)), t) : b, frac: 1, k };
  }
  const a = CT.rose, e = inOutCubic(P(t, S, S + 1.1));
  return { pts: e < 1 ? morph(a, CT.sym0, e, t, 1) : CT.sym0, pts2: e < 1 ? morph(a, CT.sym1, e, t, -1) : CT.sym1, frac: 1, k, split: e };
}

// ---------- line rendering ----------
function strokePath(ctx, pts, frac, closed) {
  ctx.beginPath(); const n = pts.length, m = frac * n; if (m < 2) return null;
  ctx.moveTo(pts[0][0], pts[0][1]);
  const full = Math.floor(m);
  for (let i = 1; i < Math.min(full, n); i++) ctx.lineTo(pts[i][0], pts[i][1]);
  let hx, hy;
  if (full >= n) { if (closed) ctx.closePath(); hx = pts[0][0]; hy = pts[0][1]; }
  else { const a = pts[full - 1], b = pts[full % n], f = m - full; hx = lerp(a[0], b[0], f); hy = lerp(a[1], b[1], f); ctx.lineTo(hx, hy); }
  return [hx, hy];
}
function glowLine(ctx, pts, frac, alpha, closed = true) {
  if (alpha <= 0) return null;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
  let head;
  [[22, `rgba(230,190,140,${.07 * alpha})`], [10, `rgba(230,208,173,${.22 * alpha})`], [4.5, `rgba(244,230,205,${.55 * alpha})`], [2, `rgba(255,250,240,${.95 * alpha})`]].forEach(([w, c]) => {
    head = strokePath(ctx, pts, frac, closed); if (!head) return; ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke();
  });
  ctx.restore();
  return head;
}
function headSpark(ctx, x, y, t, a, size = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y, 170 * size, .55 * a, '255,226,190');
  ctx.globalAlpha = a; ctx.fillStyle = '#fffaf2'; ctx.beginPath(); ctx.arc(x, y, 6 * size, 0, 7); ctx.fill();
  const r = rng(Math.floor(t * 30) + 7);
  for (let i = 0; i < 14; i++) { const ang = r() * 6.28, d = r() * 60 * size; ctx.globalAlpha = a * r() * .8; ctx.fillStyle = r() > .5 ? SAND : '#fff'; ctx.beginPath(); ctx.arc(x + Math.cos(ang) * d, y + Math.sin(ang) * d, 1 + r() * 2, 0, 7); ctx.fill(); }
  ctx.restore();
}
// pulse running once around the closed shape before the reveal
function tracePulse(ctx, pts, q) {
  if (q <= 0 || q >= 1) return null;
  const i = Math.floor(q * pts.length) % pts.length, p = pts[i];
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  const seg = 60; ctx.beginPath();
  for (let j = 0; j < seg; j++) { const pp = pts[(i - j + pts.length) % pts.length]; j ? ctx.lineTo(pp[0], pp[1]) : ctx.moveTo(pp[0], pp[1]); }
  ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,240,215,.9)'; ctx.stroke(); ctx.restore();
  return p;
}

// ---------- intro trail: the dot wanders up to where the café begins ----------
function introTrail(t) {
  const start = [540, 1250], end = CT.cafe[0], pts = [];
  for (let i = 0; i <= 160; i++) {
    const u = i / 160;
    const x = lerp(start[0], end[0], u) + Math.sin(u * Math.PI * 2.2) * 240 * (1 - u);
    const y = lerp(start[1], end[1], u * u * (3 - 2 * u)) + Math.sin(u * Math.PI * 3) * 60 * (1 - u);
    pts.push([x, y]);
  }
  return pts;
}

// ---------- camera: slow push while a photo is shown ----------
function camS(t) {
  let s = 1;
  RS.slice(0, 4).forEach(R => { s += .07 * inOutCubic(P(t, R, R + 2.0)) * (1 - inOutCubic(P(t, R + 2.0, R + 2.5))); });
  return s;
}

export function draw(ctx, t) {
  ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H);
  glow(ctx, 540, 900, 1100, .1, '120,84,52');
  const s = camS(t);
  ctx.save(); ctx.translate(540, 960); ctx.scale(s, s); ctx.translate(-540, -960);

  // photos: revealed by an ink circle from the line's head, then dissolve
  for (let k = 0; k < 4; k++) {
    const R = RS[k], a = P(t, R - .05, R + .55), out = 1 - P(t, R + 2.0, R + 2.5);
    if (a <= 0 || out <= 0) continue;
    const c0 = CT[SUBJ[k].key][0], rad = outQuint(a) * 2300;
    ctx.save(); ctx.globalAlpha = out; ctx.beginPath(); ctx.arc(c0[0], c0[1], Math.max(1, rad), 0, 7); ctx.clip();
    const zs = 1 + .05 * (1 - out); ctx.translate(540, 960); ctx.scale(zs, zs); ctx.translate(-540, -960);
    ctx.drawImage(PH[k], 0, 0, W, H); ctx.restore();
    if (a < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,232,200,${.5 * (1 - a)})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(c0[0], c0[1], rad, 0, 7); ctx.stroke(); ctx.restore(); }
  }

  // intro dot + wandering trail
  if (t < 3.8) {
    const tr = introTrail(t), f = inOutCubic(P(t, .8, 2.4)), fade = 1 - P(t, 2.6, 3.6);
    const dotA = P(t, .25, .45);
    if (f <= 0) { const pulse = 1 + .3 * Math.sin(t * 9); headSpark(ctx, 540, 1250, t, dotA, pulse * .8); }
    else { const h = glowLine(ctx, tr, f, fade * .8, false); if (h && t < 2.45) headSpark(ctx, h[0], h[1], t, 1); }
  }

  // the line
  const L = linePts(t), R = RS[L.k], lineA = 1 - .72 * P(t, R + .1, R + .6) * (L.k < 4 ? 1 : 0) + (L.k < 4 ? .72 * P(t, R + 1.9, R + 2.4) : 0);
  if (t >= RS[0] - 1.4) {
    const head = glowLine(ctx, L.pts, L.frac, clamp(lineA));
    if (L.pts2) glowLine(ctx, L.pts2, 1, clamp(L.split * 3));
    if (L.k === 0 && L.frac < 1 && head) headSpark(ctx, head[0], head[1], t, 1);
    const q = P(t, R - .32, R - .02), hp = tracePulse(ctx, L.pts, q);
    if (hp) headSpark(ctx, hp[0], hp[1], t, .9);
    if (L.pts2) { const hp2 = tracePulse(ctx, L.pts2, q); if (hp2) headSpark(ctx, hp2[0], hp2[1], t, .9); }
    // reveal flash at the start point
    if (t > R - .05 && t < R + .6) { const c0 = L.pts[0]; headSpark(ctx, c0[0], c0[1], t, 1 - P(t, R, R + .6), 1.6); }
  }
  ctx.restore();

  // labels
  for (let k = 0; k < 4; k++) {
    const R = RS[k];
    if (t < R || t > R + 2.6) continue;
    const sc = P(t, R + .1, R + .5) * (1 - P(t, R + 2.0, R + 2.4));
    const g = ctx.createLinearGradient(0, 1150, 0, 1600); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${.75 * sc})`); ctx.fillStyle = g; ctx.fillRect(0, 1150, W, 770);
    const ta = P(t, R + .2, R + .45) * (1 - P(t, R + 2.0, R + 2.3));
    ctx.globalAlpha = ta; ctx.fillStyle = SAND; font(ctx, 24, 400); ctx.letterSpacing = '6px'; ctx.fillText(SUBJ[k].tag, 90, 1330 + (1 - outQuint(ta)) * 20); ctx.globalAlpha = 1;
    textBlock(ctx, [{ text: SUBJ[k].word, y: 1465 }], t, R + .22, R + 2.0, { size: 150 });
  }
  textBlock(ctx, [{ text: 'Jedes Business', y: 330 }, { text: 'beginnt mit einer Linie.', y: 430, col: SAND }], t, .6, 2.25, { size: 92 });

  // logo end
  const R4 = RS[4];
  if (t > R4 - .05) {
    const f = outQuint(P(t, R4, R4 + .45)), pop = 1 + .06 * Math.exp(-7 * Math.max(0, t - R4)) * Math.sin(Math.max(0, t - R4) * 18);
    ctx.save(); ctx.translate(540, 700); ctx.scale(pop, pop); ctx.translate(-540, -700);
    glow(ctx, 540, 700, 600, .35 * (1 - P(t, R4, R4 + 1.2)) + .08, '255,226,190');
    ctx.globalAlpha = f; ctx.fillStyle = C.cream;
    ['sym0', 'sym1'].forEach(k => { ctx.beginPath(); CT[k].forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); });
    ctx.restore(); ctx.globalAlpha = 1;
    sparksAt(ctx, t, R4, 540, 700);
    textBlock(ctx, [{ text: 'Wir zeichnen', y: 1150 }, { text: 'deine.', y: 1285, col: SAND }], t, R4 + .3, 99, { size: 130, align: 'center' });
    const wm = 'SOCIALCLIP.ART'; font(ctx, 44); ctx.letterSpacing = '9px';
    const tw = ctx.measureText(wm).width - 9; let x = 540 - tw / 2;
    for (let i = 0; i < wm.length; i++) {
      const q = clamp((t - R4 - 1.0 - i * .03) / .4), ee = outBack(q, 1.4);
      ctx.globalAlpha = clamp(q * 3); ctx.fillStyle = C.soft; ctx.fillText(wm[i], x, 1430 + (1 - ee) * 30); x += ctx.measureText(wm[i]).width;
    }
    ctx.globalAlpha = 1;
  }

  // fine grain
  ctx.globalAlpha = .05; ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(grain[Math.floor(t * 24) % 4], 0, 0, W, H);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function sparksAt(ctx, t, t0, cx, cy) {
  const r = rng(51);
  for (let i = 0; i < 60; i++) {
    const ang = r() * 6.28, sp = 250 + r() * 700, life = .4 + r() * .6, q = clamp((t - t0) / life), sz = 1.5 + r() * 3, warm = r() > .5;
    if (q <= 0 || q >= 1) continue;
    const d = sp * outQuint(q) * life;
    ctx.globalAlpha = (1 - q); ctx.fillStyle = warm ? SAND : '#fff'; ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, sz, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

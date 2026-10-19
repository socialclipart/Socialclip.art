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
// Handbuch-Video: "Profi-Marketing für 14 €?"
// =====================================================================
const SAND = '#e6d0ad', PAPER = '#f3eee4', INK = '#1a1816', GREY = '#a29e96';
async function initLate() {}
const R1 = 3.13, R2 = 6.59, R3 = 20.41, R4 = 22.14;

export function shutter(t) {
  const win = [[0.15, 0.9, .8], [1.75, 2.1, .6], [2.15, 3.0, .5], [3.08, 3.43, 1], [3.5, 4.8, 1], [6.31, 6.9, .5], [7.15, 7.7, .9],
    [8.4, 8.85, 1], [9.35, 9.8, 1], [10.3, 10.75, 1], [11.25, 11.7, 1], [12.45, 12.9, 1], [15.55, 16.6, .6], [16.65, 17.3, 1],
    [R3 - .03, R3 + .3, .8], [21.25, 22.3, 1], [23.2, 23.5, .5]];
  let s = 0; for (const [a, b, v] of win) if (t > a && t < b) s = Math.max(s, v); return s;
}
function tilt(ctx, a) { ctx.transform(Math.cos(a), Math.sin(a) * .22, 0, 1, 0, 0); }
function sparks(ctx, t, t0, cx, cy, n = 40, spread = 520, seed = 3) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const ang = r() * Math.PI * 2, sp = 200 + r() * spread, life = .35 + r() * .45, q = clamp((t - t0) / life), sz = 2 + r() * 2.5, warm = r() > .6;
    if (q <= 0 || q >= 1) continue;
    const d = sp * outQuint(q) * life;
    ctx.globalAlpha = (1 - q) * .9; ctx.fillStyle = warm ? C.warm : C.cream;
    ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d * .8, sz, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function shake(t, t0, amp = 10) { const k = P(t, t0, t0 + .45); if (k <= 0 || k >= 1) return [0, 0]; const a = (1 - k) * (1 - k) * amp; return [Math.sin(t * 91) * a, Math.cos(t * 77) * a]; }

// ---------- scene 1: the agency quote ----------
const ITEMS = [['Logo & Branding', '1.200 €'], ['Website', '2.900 €'], ['Social-Media-Setup', '750 €']];
const TOTAL = '4.850 €';
function invoice(ctx, t, dim) {
  const W2 = 390, H2 = 350;
  rr(ctx, -W2, -H2, W2 * 2, H2 * 2, 18); ctx.fillStyle = PAPER; ctx.fill();
  ctx.fillStyle = '#8a7f70'; font(ctx, 18, 400); ctx.letterSpacing = '5px'; ctx.fillText('ANGEBOT', -330, -270);
  ctx.fillStyle = INK; font(ctx, 34); ctx.fillText('Marketing-Paket · Agentur', -330, -222);
  ctx.fillStyle = 'rgba(26,24,22,.15)'; ctx.fillRect(-330, -190, 660, 2); ctx.fillRect(-330, 80, 660, 2);
  ITEMS.forEach(([n, p], i) => {
    const y = -125 + i * 68; ctx.fillStyle = '#3a3631'; font(ctx, 30, 400); ctx.letterSpacing = '0px'; ctx.fillText(n, -330, y);
    font(ctx, 30); ctx.textAlign = 'right'; ctx.fillStyle = INK; ctx.fillText(p, 330, y); ctx.textAlign = 'left';
  });
  ctx.fillStyle = INK; font(ctx, 34); ctx.fillText('Gesamt', -330, 190);
  ctx.fillStyle = '#8a7f70'; font(ctx, 20, 400); ctx.letterSpacing = '0px'; ctx.fillText('zzgl. laufender Betreuung', -330, 300);
  // total digits (they fall away after the strike)
  font(ctx, 110); const tw = ctx.measureText(TOTAL).width; let x = 330 - tw;
  for (let i = 0; i < TOTAL.length; i++) {
    const ch = TOTAL[i], cw = ctx.measureText(ch).width, t0 = 2.15 + i * .05, q = Math.max(0, t - t0);
    const r = rng(40 + i); const vx = (r() - .4) * 300, rot = (r() - .5) * 4;
    ctx.save(); ctx.translate(x + cw / 2 + vx * q, 200 + .5 * 4200 * q * q - 280 * q); ctx.rotate(rot * q);
    ctx.globalAlpha = 1 - P(t, t0 + .35, t0 + .7); ctx.fillStyle = INK; ctx.fillText(ch, -cw / 2, 0); ctx.restore();
    x += cw;
  }
  ctx.globalAlpha = 1;
  // strike line drawn by the cursor
  const s = outExpo(P(t, 1.75, 2.1));
  if (s > 0) { const q = Math.max(0, t - 2.3); ctx.save(); ctx.translate(0, .5 * 4200 * q * q); ctx.rotate(q * .8); ctx.globalAlpha = 1 - P(t, 2.6, 2.9); ctx.fillStyle = C.warm; ctx.fillRect(330 - tw - 20, 158, (tw + 40) * s, 12); ctx.restore(); ctx.globalAlpha = 1; }
  if (dim > 0) { rr(ctx, -W2, -H2, W2 * 2, H2 * 2, 18); ctx.fillStyle = `rgba(18,18,18,${dim})`; ctx.fill(); }
}
function scene1(ctx, t) {
  const [sx, sy] = shake(t, R1, 12);
  ctx.save(); ctx.translate(sx, sy);
  const drop = spring(P(t, .15, 1.15), 6, 10), out = inOutCubic(P(t, 3.5, 4.0));
  const cy = lerp(-520, 1010, drop) + out * 1300, cx = 540 - out * 400;
  const sc = lerp(1, .9, inOutCubic(P(t, R1 - .25, R1 + .05)));
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(lerp(-.14, -.025, drop) - out * .5); ctx.scale(sc, sc);
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 80; ctx.shadowOffsetY = 40; rr(ctx, -390, -350, 780, 700, 18); ctx.fillStyle = PAPER; ctx.fill(); ctx.shadowColor = 'transparent';
  invoice(ctx, t, .62 * P(t, R1 - .25, R1));
  ctx.restore();
  textBlock(ctx, [{ text: 'Was kostet', y: 330 }, { text: 'gutes Marketing?', y: 430, col: GREY }], t, .55, 2.8);
  // cursor strikes the total
  if (t > 1.25 && t < 2.6) {
    const a = inOutCubic(P(t, 1.25, 1.7)), s = outExpo(P(t, 1.75, 2.1));
    const tx0 = cx - 70, ty = cy + 168;
    const px = lerp(1000, tx0, a) + s * 420, py = lerp(1750, ty, a);
    const press = P(t, 1.7, 1.8);
    pointer(ctx, px, py, 1 - .14 * Math.sin(press * Math.PI), 1 - P(t, 2.3, 2.55));
  }
  ctx.restore();
  // 14 € slams in, then becomes the badge
  if (t > R1 - .02) badgePrice(ctx, t);
}
function badgePos(t) { const c = coverState(t); return { x: c.x + 285 * c.s, y: c.y - 380 * c.s, s: c.s }; }
function badgePrice(ctx, t) {
  const k = P(t, R1, R1 + .3), e = outExpo(k), m = inOutCubic(P(t, 3.6, 4.7));
  const b = badgePos(Math.max(t, 4.7));
  const x = lerp(540, b.x, m), y = lerp(1060, b.y, m), sc = lerp(lerp(2.3, 1, e), .33 * b.s / .95, m), fs = lerp(330, 84 / .33, m);
  if (t < 4.75) {
    const fl = P(t, R1, R1 + .55); if (fl < 1) glow(ctx, 540, 1060, 700, .55 * Math.pow(1 - fl, 2));
    sparks(ctx, t, R1, 540, 1060, 50, 600, 9);
  }
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.rotate(-m * .2);
  if (m > 0) { ctx.globalAlpha = m; ctx.beginPath(); ctx.arc(0, 0, 300, 0, 7); ctx.fillStyle = SAND; ctx.fill(); ctx.globalAlpha = 1; }
  font(ctx, fs); const w = ctx.measureText('14 €').width;
  ctx.globalAlpha = clamp(k * 5); ctx.fillStyle = m > .5 ? INK : SAND; ctx.fillText('14 €', -w / 2, fs * .35); ctx.restore(); ctx.globalAlpha = 1;
}

// ---------- scene 2: the cover ----------
function coverState(t) {
  const k = P(t, 3.8, 4.75), sp = spring(k, 6, 10);
  let s = lerp(.15, .95, sp), ry = lerp(1.1, -.12, outQuint(k)), rot = lerp(.3, -.03, outQuint(k)), x = 540, y = 1060;
  ry += Math.sin(t * .9) * .05 * P(t, 4.7, 5.2); s *= 1 + .04 * P(t, 4.7, 7.2);
  // end card: returns smaller
  if (t > 21.3) { const r = spring(P(t, 21.3, R4 + .1), 6, 10); x = lerp(1600, 540, r); y = 880; s = .62; ry = lerp(-1.0, -.1, outQuint(P(t, 21.3, R4 + .1))) + Math.sin(t * .9) * .04; rot = lerp(.25, -.02, r); }
  return { x, y, s, ry, rot };
}
function drawCover(ctx, t, sweep = -1) {
  const w = 600, h = 800;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 100; ctx.shadowOffsetY = 50;
  rr(ctx, -w / 2, -h / 2, w, h, 6); ctx.fillStyle = '#151311'; ctx.fill(); ctx.restore();
  ctx.save(); rr(ctx, -w / 2, -h / 2, w, h, 6); ctx.clip();
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, '#24201b'); g.addColorStop(1, '#121212'); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.save(); ctx.globalAlpha = .07; ctx.translate(210, 230); ctx.scale(3.3, 3.3); drawSymbol(ctx, C.cream); ctx.restore();
  ctx.save(); ctx.translate(-238, -305); ctx.scale(.2, .2); drawSymbol(ctx, C.cream); ctx.restore();
  ctx.fillStyle = C.cream; font(ctx, 24); ctx.letterSpacing = '4px'; ctx.fillText('SOCIALCLIP', -212, -296);
  ctx.fillStyle = C.warm; font(ctx, 13, 400); ctx.letterSpacing = '3px'; ctx.fillText('DAS SELBERMACHER-HANDBUCH · AUSGABE 2026', -250, -150);
  [['Marketing', -88, C.cream], ['wie die Profis.', -26, C.cream], ['Einfach selbst', 36, SAND], ['gemacht.', 98, SAND]].forEach(([s, y, c]) => { ctx.fillStyle = c; font(ctx, 62, 400); ctx.letterSpacing = '-2px'; ctx.fillText(s, -250, y); });
  ctx.fillStyle = C.soft; font(ctx, 18, 400); ctx.letterSpacing = '0px'; ctx.fillText('Website, Logo, Social Media, Google und', -250, 150); ctx.fillText('Werbung mit KI selbst erstellen.', -250, 176);
  let cx = -250; font(ctx, 14, 400); ctx.letterSpacing = '0px';
  ['11 Kapitel', '60+ Prompts', 'Checklisten', '30-Tage-Plan'].forEach(s => { const cw = ctx.measureText(s).width + 26; rr(ctx, cx, 208, cw, 30, 15); ctx.strokeStyle = 'rgba(244,241,234,.3)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = C.soft; ctx.fillText(s, cx + 13, 228); cx += cw + 8; });
  ctx.fillStyle = 'rgba(244,241,234,.12)'; ctx.fillRect(-250, 320, 500, 1);
  ctx.fillStyle = C.dim; font(ctx, 13, 400); ctx.letterSpacing = '0px'; ctx.fillText('Mircea Alin · SocialClip Erlangen', -250, 350); ctx.textAlign = 'right'; ctx.fillText('socialclip.art', 250, 350); ctx.textAlign = 'left';
  if (sweep >= 0 && sweep <= 1) { const x = lerp(-w, w, inOutCubic(sweep)); const gg = ctx.createLinearGradient(x - 180, 0, x + 180, 0); gg.addColorStop(0, 'rgba(255,240,220,0)'); gg.addColorStop(.5, 'rgba(255,240,220,.22)'); gg.addColorStop(1, 'rgba(255,240,220,0)'); ctx.save(); ctx.rotate(-.35); ctx.fillStyle = gg; ctx.fillRect(-w, -h, w * 2, h * 2); ctx.restore(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(244,241,234,.12)'; ctx.lineWidth = 1.5; rr(ctx, -w / 2, -h / 2, w, h, 6); ctx.stroke();
}
function badge(ctx, t, c) {
  const pop = outBack(P(t, 4.6, 4.9), 2.2); if (pop <= 0) return;
  ctx.save(); ctx.translate(285, -380); ctx.rotate(-.2); ctx.scale(pop, pop);
  ctx.beginPath(); ctx.arc(0, 0, 99, 0, 7); ctx.fillStyle = SAND; ctx.fill();
  font(ctx, 84); const w = ctx.measureText('14 €').width; ctx.fillStyle = INK; ctx.fillText('14 €', -w / 2, 30); ctx.restore();
}
function scene2(ctx, t) {
  const c = coverState(t), open = P(t, 7.2, 7.7);
  if (t > 7.15) { drawPages(ctx, t); }
  ctx.save(); ctx.translate(c.x, c.y);
  if (open <= 0) {
    if (Math.abs(t - R2) < .6) glow(ctx, 0, 0, 760, .35 * (1 - Math.abs(t - R2) / .6), '255,226,190');
    ctx.rotate(c.rot); ctx.scale(c.s, c.s); tilt(ctx, c.ry);
    drawCover(ctx, t, P(t, R2 - .28, R2 + .32)); badge(ctx, t, c);
  } else if (open < 1) {
    // the cover swings open around the spine and grows into the first page
    const pr = pageRect(t), sc = lerp(c.s, pr.w / 600, inOutCubic(open));
    ctx.translate(lerp(0, pr.x + pr.w / 2 - c.x, inOutCubic(open)), lerp(0, pr.y + pr.h / 2 - c.y, inOutCubic(open)));
    ctx.rotate(c.rot * (1 - open)); ctx.scale(sc, sc);
    ctx.translate(-300, 0); ctx.scale(Math.cos(inOutCubic(open) * Math.PI / 2), 1); ctx.transform(1, -.25 * Math.sin(open * Math.PI / 2), 0, 1, 0, 0); ctx.translate(300, 0);
    drawCover(ctx, t); badge(ctx, t, c);
    ctx.fillStyle = `rgba(0,0,0,${.6 * open})`; ctx.fillRect(-300, -400, 600, 800);
  }
  ctx.restore();
  if (t < 4.75) return;
  sparks(ctx, t, R2, c.x, c.y, 34, 480, 21);
  textBlock(ctx, [{ text: 'Oder du machst', y: 330 }, { text: 'es einfach selbst.', y: 430, col: SAND }], t, 4.3, 6.95);
}

// ---------- scene 3: chapters ----------
const PAGES = [
  { n: '04', t1: 'Logo und Marke', t2: 'selbst erstellen', il: 'logo' },
  { n: '05', t1: 'Deine Website', t2: 'mit Claude bauen', il: 'web' },
  { n: '06', t1: 'Bei Google', t2: 'gefunden werden', il: 'google' },
  { n: '07', t1: 'Social Media,', t2: 'das Kunden bringt', il: 'social' },
  { n: '09', t1: 'Werbung mit', t2: 'kleinem Budget', il: 'ads' },
];
const TURN = [8.4, 9.35, 10.3, 11.25, 12.45];
const PG = { w: 860, h: 1140, cx: 540, cy: 1065 };
function pageRect(t) { return { x: PG.cx - PG.w / 2, y: PG.cy - PG.h / 2, w: PG.w, h: PG.h }; }
function illus(ctx, kind, lp) {
  if (kind === 'logo') {
    const e = spring(lp, 6, 10);
    ctx.save(); ctx.scale(1.5, 1.5); drawSymbol(ctx, INK, [[lerp(-150, 0, e), lerp(-80, 0, e)], [lerp(150, 0, e), lerp(80, 0, e)]]); ctx.restore();
    [INK, C.warm, GREY, SAND].forEach((col, i) => { const p = outBack(clamp(lp * 3 - 1 - i * .2)); ctx.beginPath(); ctx.arc(-150 + i * 100, 230, 32 * p, 0, 7); ctx.fillStyle = col; ctx.fill(); });
  } else if (kind === 'web') {
    ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(ctx, -290, -190, 580, 400, 14); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-290, -145); ctx.lineTo(290, -145); ctx.stroke();
    [0, 1, 2].forEach(i => { ctx.beginPath(); ctx.arc(-262 + i * 22, -168, 6, 0, 7); ctx.fillStyle = INK; ctx.fill(); });
    const b = (k, x, y, w, h, c) => { const p = outQuint(clamp(lp * 2.2 - k * .22)); if (p <= 0) return; ctx.fillStyle = c; rr(ctx, x, y, w * p, h, 6); ctx.fill(); };
    b(0, -250, -110, 300, 34, INK); b(1, -250, -60, 220, 34, GREY); b(2, -250, 0, 140, 36, C.warm);
    b(3, -250, 70, 160, 110, '#d9d1c3'); b(3.5, -80, 70, 160, 110, '#d9d1c3'); b(4, 90, 70, 160, 110, '#d9d1c3');
  } else if (kind === 'google') {
    rr(ctx, -290, -170, 580, 84, 42); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    const q = 'Friseur Erlangen', n = Math.floor(clamp(lp * 1.8) * q.length); ctx.fillStyle = INK; font(ctx, 34, 400); ctx.letterSpacing = '0px'; ctx.fillText(q.slice(0, n), -240, -116);
    if (lp < .56) ctx.fillRect(-240 + ctx.measureText(q.slice(0, n)).width + 4, -144, 3, 38);
    const r = outQuint(clamp(lp * 2.4 - 1.1)); ctx.globalAlpha = r; rr(ctx, -290, -40 + (1 - r) * 40, 580, 210, 16); ctx.fillStyle = '#e9e2d4'; ctx.fill();
    ctx.fillStyle = INK; font(ctx, 34); ctx.fillText('Dein Betrieb', -250, 30); ctx.fillStyle = '#6d655b'; font(ctx, 24, 400); ctx.letterSpacing = '0px'; ctx.fillText('4,9 · 128 Bewertungen', -250, 130);
    for (let i = 0; i < 5; i++) { const s = outBack(clamp(lp * 3.2 - 1.6 - i * .12), 2); star(ctx, -232 + i * 52, 72, 20 * s, C.warm); }
    ctx.globalAlpha = 1;
  } else if (kind === 'social') {
    rr(ctx, -140, -230, 280, 470, 34); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    for (let i = 0; i < 9; i++) { const p = outBack(clamp(lp * 2.6 - i * .14), 1.8); const x = -112 + (i % 3) * 76, y = -150 + Math.floor(i / 3) * 76; ctx.fillStyle = [C.warm, '#cfc6b7', INK][i % 3]; ctx.save(); ctx.translate(x + 34, y + 34); ctx.scale(p, p); rr(ctx, -34, -34, 68, 68, 6); ctx.fill(); ctx.restore(); }
    const h = outBack(clamp(lp * 2 - 1.1), 2.5); heart(ctx, 190, -40, 54 * h);
  } else if (kind === 'ads') {
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-270, 200); ctx.lineTo(280, 200); ctx.stroke();
    [.3, .45, .4, .7, .95].forEach((v, i) => { const p = outBack(clamp(lp * 2.4 - i * .18), 1.4); ctx.fillStyle = i === 4 ? C.warm : '#cfc6b7'; ctx.fillRect(-240 + i * 105, 200 - 360 * v * p, 70, 360 * v * p); });
    const l = clamp(lp * 1.6 - .6); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-230, 60); ctx.lineTo(lerp(-230, 230, l), lerp(60, -200, l)); ctx.stroke();
  }
}
function star(ctx, x, y, r, col) { if (r <= 0) return; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } ctx.closePath(); ctx.fillStyle = col; ctx.fill(); }
function heart(ctx, x, y, s) { if (s <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(s / 50, s / 50); ctx.beginPath(); ctx.moveTo(0, 18); ctx.bezierCurveTo(-50, -14, -24, -50, 0, -26); ctx.bezierCurveTo(24, -50, 50, -14, 0, 18); ctx.fillStyle = '#c4553f'; ctx.fill(); ctx.restore(); }
function page(ctx, p, lp) {
  const w = PG.w, h = PG.h;
  rr(ctx, -w / 2, -h / 2, w, h, 8); ctx.fillStyle = PAPER; ctx.fill();
  ctx.fillStyle = C.warm; font(ctx, 22, 400); ctx.letterSpacing = '6px'; ctx.fillText('KAPITEL ' + p.n, -w / 2 + 70, -h / 2 + 110);
  ctx.fillStyle = INK; font(ctx, 74); ctx.fillText(p.t1, -w / 2 + 70, -h / 2 + 205); ctx.fillText(p.t2, -w / 2 + 70, -h / 2 + 285);
  ctx.fillStyle = C.warm; ctx.fillRect(-w / 2 + 70, -h / 2 + 330, 120, 5);
  ctx.save(); ctx.translate(0, 130); illus(ctx, p.il, lp); ctx.restore();
  ctx.fillStyle = '#9a9085'; font(ctx, 18, 400); ctx.letterSpacing = '3px'; ctx.fillText('MARKETING WIE DIE PROFIS', -w / 2 + 70, h / 2 - 55); ctx.textAlign = 'right'; ctx.fillText(p.n, w / 2 - 70, h / 2 - 55); ctx.textAlign = 'left';
}
function drawPages(ctx, t) {
  if (t > 12.95) return;
  // draw from the back of the stack: next page first, then the current one turning
  for (let i = PAGES.length - 1; i >= 0; i--) {
    const start = i === 0 ? 7.2 : TURN[i - 1], end = TURN[i];
    if (t < start - .01 || t > end + .5) continue;
    const turn = inOutCubic(P(t, end, end + .45)), lp = P(t, start + .15, start + .9);
    ctx.save(); ctx.translate(PG.cx, PG.cy);
    const float = Math.sin(t * 1.1 + i) * .006; ctx.rotate(float);
    if (turn > 0) { ctx.translate(-PG.w / 2, 0); ctx.scale(Math.max(.001, Math.cos(turn * Math.PI / 2)), 1); ctx.transform(1, .3 * Math.sin(turn * Math.PI / 2), 0, 1, 0, 0); ctx.translate(PG.w / 2, 0); }
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 30; rr(ctx, -PG.w / 2, -PG.h / 2, PG.w, PG.h, 8); ctx.fillStyle = PAPER; ctx.fill(); ctx.restore();
    page(ctx, PAGES[i], lp);
    if (turn > 0) { ctx.fillStyle = `rgba(0,0,0,${.5 * turn})`; ctx.fillRect(-PG.w / 2, -PG.h / 2, PG.w, PG.h); }
    ctx.restore();
  }
}
function scene3text(ctx, t) { textBlock(ctx, [{ text: '11 Kapitel.', y: 330 }, { text: 'Schritt für Schritt.', y: 430, col: GREY }], t, 7.75, 12.3); }

// ---------- scene 4: prompts ----------
const PL = ['Schreib mir alle Texte für', 'eine One-Page-Website für', '[DEIN BETRIEB] in [DEINE STADT].', 'Ton: [3 WÖRTER]. Kurze Sätze.'];
const PCHARS = PL.join('').length;
function promptCard(ctx, t, x0, y0) {
  const w = 900, h = 640;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 80; ctx.shadowOffsetY = 30; rr(ctx, x0, y0, w, h, 18); ctx.fillStyle = '#1b1a19'; ctx.fill(); ctx.restore();
  rr(ctx, x0, y0, w, h, 18); ctx.strokeStyle = 'rgba(244,241,234,.14)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = C.warm; font(ctx, 18, 400); ctx.letterSpacing = '5px'; ctx.fillText('PROMPT · WEBSITE-TEXTE', x0 + 50, y0 + 70);
  const copied = P(t, 15.3, 15.38);
  rr(ctx, x0 + w - 220, y0 + 36, 170, 52, 10); ctx.fillStyle = copied > 0 ? SAND : 'rgba(244,241,234,0)'; ctx.fill(); ctx.strokeStyle = copied > 0 ? SAND : 'rgba(244,241,234,.45)'; ctx.stroke();
  ctx.fillStyle = copied > 0 ? INK : C.cream; font(ctx, 22, 700); ctx.letterSpacing = '0px'; ctx.textAlign = 'center'; ctx.fillText(copied > 0 ? 'Kopiert ✓' : 'Kopieren', x0 + w - 135, y0 + 70); ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(244,241,234,.08)'; ctx.fillRect(x0 + 50, y0 + 115, w - 100, 1.5);
  let n = Math.floor(clamp((t - 13.0) / 2.0) * PCHARS), lastX = x0 + 50, lastY = y0 + 190;
  ctx.font = `500 33px "DejaVu Sans Mono", monospace`; ctx.letterSpacing = '0px';
  PL.forEach((l, li) => {
    const y = y0 + 190 + li * 66, show = Math.max(0, Math.min(l.length, n)); n -= l.length;
    let x = x0 + 50, br = false;
    for (let k = 0; k < show; k++) {
      const ch = l[k]; if (ch === '[') br = true;
      const cw = ctx.measureText(ch).width;
      if (br) { ctx.fillStyle = 'rgba(230,208,173,.14)'; ctx.fillRect(x, y - 32, cw, 44); }
      ctx.fillStyle = br ? SAND : C.cream; ctx.fillText(ch, x, y); x += cw;
      if (ch === ']') br = false;
    }
    if (show > 0) { lastX = x; lastY = y; }
  });
  if (t > 12.9 && t < 15.25) caret(ctx, lastX + 6, lastY - 11, 40, t < 15.0 ? 1 : (Math.floor(t * 3) % 2 ? 0 : 1));
}
function scene4(ctx, t) {
  const enter = P(t, 12.45, 12.9), mult = inOutCubic(P(t, 15.6, 16.2)), leave = inOutCubic(P(t, 16.65, 17.1));
  ctx.save(); ctx.translate(0, -leave * 1500);
  // copies fan out: "60+"
  if (mult > 0) {
    const r = rng(77);
    for (let i = 0; i < 14; i++) {
      const col = i % 3, row = Math.floor(i / 3), d = clamp(mult * 1.6 - i * .05);
      if (d <= 0) continue;
      const x = 200 + col * 340 + (row % 2) * 40 - 170, y = 560 + row * 230 + (r() - .5) * 30;
      ctx.save(); ctx.translate(lerp(540, x + 150, outQuint(d)), lerp(1050, y, outQuint(d))); ctx.rotate((r() - .5) * .2 * d); ctx.scale(.3, .3); ctx.globalAlpha = d * .9;
      promptCardMini(ctx); ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  const s = lerp(1, .32, mult);
  ctx.save(); ctx.translate(540, lerp(lerp(1600, 1060, outQuint(enter)), 1060, 1)); ctx.scale(s, s); ctx.translate(-450, -320);
  if (enter > 0) promptCard(ctx, t, 0, (1 - outQuint(enter)) * 300);
  ctx.restore();
  const n = outBack(P(t, 16.0, 16.35), 2);
  if (n > 0) { ctx.save(); ctx.translate(540, 1080); ctx.scale(n, n); glow(ctx, 0, -40, 400, .25); font(ctx, 260); const w = ctx.measureText('60+').width; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; ctx.fillStyle = SAND; ctx.fillText('60+', -w / 2, 60); ctx.restore(); }
  ctx.restore();
  // pointer clicks "Kopieren"
  if (t > 14.95 && t < 15.8) {
    const a = inOutCubic(P(t, 14.95, 15.28)), bx = 540 - 450 + 900 - 135, by = 1060 - 320 + 70;
    pointer(ctx, lerp(1000, bx, a), lerp(1700, by, a), 1 - .14 * Math.sin(P(t, 15.28, 15.38) * Math.PI), 1 - P(t, 15.55, 15.75));
  }
  textBlock(ctx, [{ text: '60+ Prompts', y: 330 }, { text: 'zum Kopieren.', y: 430, col: SAND }], t, 12.95, 16.7);
}
function promptCardMini(ctx) {
  rr(ctx, -450, -320, 900, 640, 18); ctx.fillStyle = '#1b1a19'; ctx.fill(); ctx.strokeStyle = 'rgba(244,241,234,.2)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = C.warm; ctx.fillRect(-400, -270, 320, 20);
  [[-400, -150, 700], [-400, -60, 620], [-400, 30, 520], [-400, 120, 660]].forEach(([x, y, w], i) => { ctx.fillStyle = i === 2 ? 'rgba(230,208,173,.6)' : 'rgba(244,241,234,.35)'; ctx.fillRect(x, y, w, 26); });
}

// ---------- scene 5: 30-day plan ----------
const CAL = { x: 90, y: 690, w: 900, h: 780 };
const dayT = d => 17.7 + (R3 - 17.7) * Math.pow((d - 1) / 29, .75);
function scene5(ctx, t) {
  const enter = outQuint(P(t, 16.75, 17.3)), leave = inOutCubic(P(t, 21.25, 21.7));
  const [sx, sy] = shake(t, R3, 10);
  ctx.save(); ctx.translate(sx, sy + (1 - enter) * 1400); ctx.translate(540, 1080); ctx.scale(1 - leave * .4, 1 - leave * .4); ctx.translate(-540, -1080); ctx.globalAlpha = 1 - leave;
  const { x, y, w, h } = CAL;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 80; ctx.shadowOffsetY = 30; rr(ctx, x, y, w, h, 22); ctx.fillStyle = '#1b1a19'; ctx.fill(); ctx.restore();
  rr(ctx, x, y, w, h, 22); ctx.strokeStyle = 'rgba(244,241,234,.14)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = C.warm; font(ctx, 18, 400); ctx.letterSpacing = '5px'; ctx.fillText('DEIN 30-TAGE-PLAN', x + 45, y + 64);
  const done = EL_COUNT(t); ctx.fillStyle = C.soft; font(ctx, 22, 400); ctx.letterSpacing = '0px'; ctx.textAlign = 'right'; ctx.fillText(`${String(done).padStart(2, '0')} / 30 erledigt`, x + w - 45, y + 64); ctx.textAlign = 'left';
  const dimGrid = .75 * P(t, R3 + .1, R3 + .4);
  for (let d = 1; d <= 30; d++) {
    const c = (d - 1) % 6, r = Math.floor((d - 1) / 6), cx = x + 45 + c * 138, cy = y + 110 + r * 128, cw = 120, ch = 112;
    const k = P(t, dayT(d), dayT(d) + .22);
    rr(ctx, cx, cy, cw, ch, 14); ctx.fillStyle = k > 0 ? `rgba(230,208,173,${.9 * outQuint(k)})` : 'rgba(244,241,234,.03)'; ctx.fill();
    ctx.strokeStyle = 'rgba(244,241,234,.14)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = k > .5 ? INK : C.dim; font(ctx, 24, 400); ctx.letterSpacing = '0px'; ctx.fillText(String(d).padStart(2, '0'), cx + 14, cy + 34);
    if (k > 0) { const e = outBack(k, 2); ctx.save(); ctx.translate(cx + cw - 40, cy + ch - 40); ctx.scale(e, e); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-4, 10); ctx.lineTo(16, -12); ctx.stroke(); ctx.restore(); }
    if (d === 30) { if (t > R3 && t < R3 + .7) glow(ctx, cx + cw / 2, cy + ch / 2, 520, .55 * (1 - P(t, R3, R3 + .7))); sparks(ctx, t, R3, cx + cw / 2, cy + ch / 2, 44, 620, 13); }
  }
  if (dimGrid > 0) { rr(ctx, x, y + 90, w, h - 90, 22); ctx.fillStyle = `rgba(27,26,25,${dimGrid})`; ctx.fill(); }
  // results pop over the grid
  ['Logo', 'Website', 'Google-Profil', 'Social Media'].forEach((s, i) => {
    const p = outBack(P(t, 20.55 + i * .1, 20.85 + i * .1), 2); if (p <= 0) return;
    const cx = 540 + (i % 2 ? 210 : -210), cy = y + 300 + Math.floor(i / 2) * 170;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(p, p); rr(ctx, -190, -60, 380, 120, 60); ctx.fillStyle = SAND; ctx.fill();
    ctx.fillStyle = INK; font(ctx, 38); const tw = ctx.measureText(s + '  ✓').width; ctx.fillText(s + '  ✓', -tw / 2, 13); ctx.restore();
  });
  ctx.restore(); ctx.globalAlpha = 1;
  textBlock(ctx, [{ text: 'Dein', y: 330 }, { text: '30-Tage-Plan.', y: 430, col: SAND }], t, 17.15, 20.15);
  textBlock(ctx, [{ text: 'In 30 Tagen steht', y: 330 }, { text: 'dein Auftritt.', y: 430, col: SAND }], t, 20.5, 21.25);
}
function EL_COUNT(t) { let n = 0; for (let d = 1; d <= 30; d++) if (t >= dayT(d) + .1) n = d; return n; }

// ---------- scene 6: end card ----------
function scene6(ctx, t) {
  const c = coverState(t);
  const [sx, sy] = shake(t, R4, 8);
  ctx.save(); ctx.translate(sx, sy);
  const fl = P(t, R4, R4 + .6); if (fl < 1 && t > R4) glow(ctx, 540, 880, 700, .45 * Math.pow(1 - fl, 2));
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.scale(c.s, c.s); tilt(ctx, c.ry); drawCover(ctx, t, P(t, 22.9, 23.5)); badge(ctx, 99, c); ctx.restore();
  sparks(ctx, t, R4, 540, 880, 40, 560, 31);
  // brand line on top
  const lo = outQuint(P(t, 21.6, 22.1));
  if (lo > 0) { ctx.globalAlpha = lo; ctx.save(); ctx.translate(372, 300 - (1 - lo) * 30); ctx.scale(.3, .3); drawSymbol(ctx, C.cream); ctx.restore(); ctx.fillStyle = C.cream; font(ctx, 40); ctx.letterSpacing = '8px'; ctx.fillText('SOCIALCLIP', 420, 316 - (1 - lo) * 30); ctx.globalAlpha = 1; }
  textBlock(ctx, [{ text: 'Marketing wie die Profis.', y: 1270 }], t, 22.3, 99, { size: 62, align: 'center' });
  // CTA button + click
  const b = outQuint(P(t, 22.55, 22.95));
  if (b > 0) {
    const fill = P(t, 23.25, 23.4), bw = 640, bh = 100, bx = 540 - bw / 2, by = 1340 + (1 - b) * 30;
    ctx.globalAlpha = b; rr(ctx, bx, by, bw, bh, 50); ctx.fillStyle = fill > 0 ? SAND : 'rgba(0,0,0,0)'; ctx.fill(); ctx.strokeStyle = fill > 0 ? SAND : 'rgba(244,241,234,.6)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = fill > 0 ? INK : C.cream; font(ctx, 36); const s = 'Jetzt sofort starten →', tw = ctx.measureText(s).width; ctx.fillText(s, 540 - tw / 2, by + 62);
    if (fill > 0 && fill < 1) {} const rp = P(t, 23.25, 23.85); if (rp > 0 && rp < 1) { ctx.globalAlpha = (1 - rp) * .6; ctx.strokeStyle = SAND; ctx.lineWidth = 3; rr(ctx, bx - rp * 40, by - rp * 40, bw + rp * 80, bh + rp * 80, 50 + rp * 40); ctx.stroke(); }
    ctx.globalAlpha = b; ctx.fillStyle = C.dim; font(ctx, 26, 400); ctx.letterSpacing = '1px'; const u = 'socialclip.art/marketing-handbuch', uw = ctx.measureText(u).width; ctx.fillText(u, 540 - uw / 2, 1490); ctx.globalAlpha = 1;
  }
  if (t > 22.8 && t < 24.2) { const a = inOutCubic(P(t, 22.8, 23.22)); pointer(ctx, lerp(1000, 640, a), lerp(1800, 1400, a), 1 - .14 * Math.sin(P(t, 23.22, 23.34) * Math.PI), 1 - P(t, 23.8, 24.1)); }
  ctx.restore();
}

// ---------- compositing ----------
export function draw(ctx, t) {
  ctx.drawImage(bgTex, 0, 0);
  glow(ctx, 540, 1000, 1000, .12, '140,104,70');
  if (t < 4.0) scene1(ctx, t);
  if (t > 3.75 && t < 7.75) scene2(ctx, t);
  if (t >= 7.75 && t < 12.95) { drawPages(ctx, t); }
  if (t > 7.6 && t < 12.7) scene3text(ctx, t);
  if (t > 12.4 && t < 17.2) { if (t < 12.95) drawPages(ctx, t); scene4(ctx, t); }
  if (t > 16.7 && t < 21.8) scene5(ctx, t);
  if (t > 21.25) scene6(ctx, t);
  ctx.globalAlpha = .045; ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(grain[Math.floor(t * 24) % 4], 0, 0, W, H);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

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
  // locate the D stem of "DAS" so the camera can dive into solid letter body
  const m = document.createElement('canvas'); m.width = 900; m.height = 400;
  const mc = m.getContext('2d'); mc.font = `700 ${DAS_SIZE}px ${FONT}`; mc.letterSpacing = '-12px';
  mc.fillStyle = '#fff'; mc.fillText('DAS', 0, 300);
  das.w = mc.measureText('DAS').width;
  const row = mc.getImageData(0, 300 - 90, 900, 1).data;
  let a = -1, e = -1;
  for (let x = 0; x < 900; x++) { const on = row[x * 4 + 3] > 128; if (on && a < 0) a = x; if (!on && a >= 0) { e = x; break; } }
  das.stemX = (a + e) / 2; das.stemW = e - a;
  await initLate();
}

// ---------- layout (world coordinates, scene 1) ----------
const WIN = { x: 170, w: 740, top: 560, bot: 1400, midY: 980 };
const TX = 222;
const DAS_SIZE = 250;
const L = [
  { text: 'Du fragst dich,', y: 790, size: 88, col: C.cream, t: 1.78 },
  { text: 'wie ich', y: 885, size: 88, col: C.cream, t: 1.94 },
  { text: 'gemacht habe?', y: 1262, size: 88, col: C.soft, t: 2.56 },
];
const DAS_Y = 1140, DAS_T = 2.30;

// ---------- camera ----------
function cam1(t) {
  let x = 540, y = 960, s = 1;
  const push = inOutCubic(P(t, 1.18, 2.05));
  x = lerp(x, 540, push); y = lerp(y, 990, push); s = lerp(s, 1.32, push);
  // slow drift so the frame never sits dead still
  s *= 1 + 0.025 * P(t, 2.05, 3.4);
  // impact shake on DAS
  const k = P(t, DAS_T, DAS_T + .45);
  if (k > 0 && k < 1) { const a = (1 - k) * (1 - k) * 9; x += Math.sin(t * 91) * a; y += Math.cos(t * 77) * a; }
  // push towards DAS while it turns into a window
  const d = inOutCubic(P(t, 3.45, 4.0));
  if (d > 0) { x = lerp(x, TX + das.w / 2, d); y = lerp(y, DAS_Y - 90, d); s = lerp(s, 2.3, d); }
  return { x, y, s };
}
function applyCam(ctx, c) { ctx.translate(W / 2, H / 2); ctx.scale(c.s, c.s); ctx.translate(-c.x, -c.y); }

export function shutter(t) {
  const win = [[1.2, 2.0, .7], [2.25, 2.6, 1], [3.6, 4.15, 1.1], [4.0, 4.7, .6], [8.3, 10.2, .8], [12.3, 13.1, .7], [13.55, 14.8, .8], [15.45, 16.1, 1.2], [16.45, 18.4, .6], [19.0, 20.5, .9], [20.55, 21.45, 1.2], [21.43, 22.0, .7], [22.3, 22.8, .5]];
  let s = 0; for (const [a, b, v] of win) if (t > a && t < b) s = Math.max(s, v); return s;
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

// word-by-word rise behind a line mask
function riseLine(ctx, l, t) {
  const p0 = t - l.t; if (p0 <= 0) return;
  font(ctx, l.size); ctx.textBaseline = 'alphabetic';
  const words = l.text.split(' '); let x = TX;
  ctx.save(); ctx.beginPath(); ctx.rect(WIN.x, l.y - l.size * 1.05, WIN.w, l.size * 1.35); ctx.clip();
  words.forEach((w, i) => {
    const p = clamp((p0 - i * .07) / .5);
    const e = outQuint(p);
    ctx.globalAlpha = clamp(p * 3); ctx.fillStyle = l.col;
    ctx.fillText(w, x, l.y + (1 - e) * l.size * 1.1);
    x += ctx.measureText(w + ' ').width;
  });
  ctx.restore(); ctx.globalAlpha = 1;
  return x;
}

// ---------- scene 1: cursor → line → browser → headline ----------
function scene1(ctx, t) {
  const c = cam1(t);
  ctx.save(); applyCam(ctx, c);
  const lineP = outExpo(P(t, 0.62, 1.02));
  const open = P(t, 1.0, 1.6);
  const tipX = lerp(WIN.x, WIN.x + WIN.w, lineP);

  // window body
  if (open > 0) {
    const sp = spring(open * 1.25);
    const top = lerp(WIN.midY, WIN.top, sp), bot = lerp(WIN.midY, WIN.bot, sp);
    const h = Math.max(2, bot - top);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 80; ctx.shadowOffsetY = 30;
    rr(ctx, WIN.x, top, WIN.w, h, Math.min(26, h / 2)); ctx.fillStyle = '#161514'; ctx.fill(); ctx.restore();
    rr(ctx, WIN.x, top, WIN.w, h, Math.min(26, h / 2)); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(244,241,234,.22)'; ctx.stroke();
    // toolbar
    const tb = clamp((open - .35) / .4);
    if (tb > 0 && h > 120) {
      ctx.globalAlpha = tb;
      ctx.fillStyle = 'rgba(244,241,234,.07)'; ctx.fillRect(WIN.x + 1, top + 64, WIN.w - 2, 1.5);
      [0, 1, 2].forEach(i => { const s = outBack(clamp(tb * 2 - i * .3)); ctx.beginPath(); ctx.arc(WIN.x + 38 + i * 26, top + 32, 7 * s, 0, 7); ctx.fillStyle = i ? 'rgba(244,241,234,.28)' : C.cream; ctx.fill(); });
      rr(ctx, WIN.x + 230, top + 16, 280, 32, 16); ctx.fillStyle = 'rgba(244,241,234,.06)'; ctx.fill();
      font(ctx, 19, 400); ctx.letterSpacing = '1px'; ctx.fillStyle = C.dim; ctx.textAlign = 'center'; ctx.fillText('socialclip.art', WIN.x + 370, top + 39); ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }
    // light sweep across the frame edge as it opens
    const sw = P(t, 1.05, 1.7);
    if (sw > 0 && sw < 1) { ctx.save(); rr(ctx, WIN.x, top, WIN.w, h, 26); ctx.clip(); const gx = lerp(WIN.x - 200, WIN.x + WIN.w + 200, inOutCubic(sw)); const g = ctx.createLinearGradient(gx - 160, 0, gx + 160, 0); g.addColorStop(0, 'rgba(255,240,220,0)'); g.addColorStop(.5, 'rgba(255,240,220,.07)'); g.addColorStop(1, 'rgba(255,240,220,0)'); ctx.fillStyle = g; ctx.fillRect(WIN.x, top, WIN.w, h); ctx.restore(); }
  }

  // drawn line + light tip
  if (lineP > 0 && open < .35) {
    ctx.globalAlpha = 1 - clamp(open / .35);
    ctx.fillStyle = C.cream; ctx.fillRect(WIN.x, WIN.midY - 1.5, tipX - WIN.x, 3);
    ctx.globalAlpha = 1;
  }
  if (lineP > 0 && t < 1.5) glow(ctx, tipX, WIN.midY, 120, .55 * (1 - P(t, 1.0, 1.5)));

  // caret: blinks, then rides the line tip
  if (t < 1.05) {
    const blink = t < .62 ? ((Math.floor(t * 2.6) % 2) ? .0 : 1) : 1;
    caret(ctx, t < .62 ? WIN.x : tipX + 8, WIN.midY, 70, blink * (1 - P(t, .95, 1.05)));
  }

  // headline
  L.slice(0, 2).forEach(l => riseLine(ctx, l, t));
  // DAS — the hit
  if (t > DAS_T) {
    const k = P(t, DAS_T, DAS_T + .32), e = outExpo(k);
    const sc = lerp(1.9, 1, e);
    font(ctx, DAS_SIZE); ctx.letterSpacing = '-12px';
    const cx = TX + das.w / 2, cy = DAS_Y - 90;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
    ctx.globalAlpha = clamp(k * 5); ctx.fillStyle = C.cream; ctx.fillText('DAS', TX, DAS_Y); ctx.restore(); ctx.globalAlpha = 1;
    const fl = P(t, DAS_T, DAS_T + .5);
    if (fl < 1) glow(ctx, cx, cy, 520, .5 * Math.pow(1 - fl, 2));
    // sparks
    if (fl < 1) {
      const r = rng(7);
      for (let i = 0; i < 46; i++) {
        const ang = r() * Math.PI * 2, sp = 200 + r() * 520, life = .35 + r() * .4;
        const q = clamp((t - DAS_T) / life); if (q >= 1) continue;
        const d = sp * outQuint(q) * life;
        ctx.globalAlpha = (1 - q) * .9; ctx.fillStyle = r() > .7 ? C.warm : C.cream;
        ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * (das.w * .45 + d), cy + Math.sin(ang) * (80 + d * .6), 2 + r() * 2.5, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
  const endX = riseLine(ctx, L[2], t);
  // caret waits after the question
  if (t > 2.95 && t < 3.3) caret(ctx, endX + 4, L[2].y - 32, 82, Math.floor((t - 2.95) * 3.2) % 2 ? 0 : 1);

  // pointer selects DAS
  const pa = P(t, 3.02, 3.3);
  if (pa > 0) {
    const e = inOutCubic(pa);
    const px = lerp(980, TX + das.w * .58, e), py = lerp(1560, DAS_Y - 60, e);
    const press = P(t, 3.3, 3.42); const sc = 1 - .14 * Math.sin(press * Math.PI);
    // selection frame with handles around DAS
    const sel = P(t, 3.32, 3.5);
    if (sel > 0) {
      const se = outBack(sel), pad = 18;
      const x0 = TX - pad, y0 = DAS_Y - 196 - pad, w = das.w + pad * 2, h = 196 + pad * 2 + 10;
      ctx.save(); ctx.translate(x0 + w / 2, y0 + h / 2); ctx.scale(lerp(.9, 1, se), lerp(.9, 1, se)); ctx.translate(-x0 - w / 2, -y0 - h / 2);
      ctx.strokeStyle = C.warm; ctx.lineWidth = 2.5; ctx.strokeRect(x0, y0, w, h);
      ctx.fillStyle = C.bg;
      [[x0, y0], [x0 + w, y0], [x0, y0 + h], [x0 + w, y0 + h]].forEach(([hx, hy]) => { ctx.fillRect(hx - 8, hy - 8, 16, 16); ctx.strokeRect(hx - 8, hy - 8, 16, 16); });
      ctx.restore();
    }
    pointer(ctx, px, py, sc, 1 - P(t, 3.5, 3.65));
  }
  ctx.restore();
  return c;
}

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

// ---------- scenes 2–3: ideas in space → they snap into a website ----------
const NAT = { swatch: [140, 180], type: [220, 200], sketch: [240, 170], frag: [300, 120] };
const EL = [
  { id: 'type', k: 'type', p: [790, 560], z: 1.0 },
  { id: 'frag1', k: 'frag', p: [300, 470], z: .8, ord: 3, to: { x: 410, y: 905, w: 260, h: 54, r: 3, web: 'button' } },
  { id: 'sk1', k: 'sketch', p: [250, 1230], z: 1.05, ord: 4, to: { x: 130, y: 1000, w: 255, h: 230, r: 12, web: 'card', n: '01 / SOCIALCLIP', title: 'Webdesign' } },
  { id: 'sk2', k: 'sketch', p: [830, 1300], z: .75, ord: 5, to: { x: 412, y: 1000, w: 255, h: 230, r: 12, web: 'card', n: '02 / SOCIALCLIP', title: 'Social Media' } },
  { id: 'sk3', k: 'sketch', p: [530, 1480], z: .9, ord: 6, to: { x: 694, y: 1000, w: 255, h: 230, r: 12, web: 'card', n: '03 / SOCIALCLIP', title: 'Grafikdesign' } },
  { id: 'swC', k: 'swatch', col: '#f4f1ea', p: [560, 370], z: .6, ord: 1, to: { x: 130, y: 578, w: 34, h: 50, r: 0, web: 'logo' } },
  { id: 'swS', k: 'swatch', col: '#a29e96', p: [130, 700], z: .75, ord: 2, to: { x: 340, y: 652, w: 400, h: 18, r: 2, web: 'label' } },
  { id: 'swD', k: 'swatch', col: '#86827b', p: [960, 1080], z: .65, ord: 7, to: { x: 130, y: 1255, w: 255, h: 120, r: 12, web: 'img', g: ['#4a433b', '#1c1a18'] } },
  { id: 'swW', k: 'swatch', col: '#d2b894', p: [905, 760], z: .85, ord: 8, to: { x: 412, y: 1255, w: 255, h: 120, r: 12, web: 'img', g: ['#a8896a', '#2a221c'] } },
  { id: 'swK', k: 'swatch', col: '#36332e', p: [170, 1500], z: .7, ord: 9, to: { x: 694, y: 1255, w: 255, h: 120, r: 12, web: 'img', g: ['#5f5953', '#1f1d1b'] } },
  { id: 'frag2', k: 'frag', p: [740, 1660], z: .8, ord: 0, to: { x: 640, y: 586, w: 310, h: 34, r: 0, web: 'nav' } },
];
EL.forEach((e, i) => { e.i = i; e.ph = i * 1.7 + .3; e.rot = (((i * 37) % 11) - 5) * .035; });
const byId = Object.fromEntries(EL.map(e => [e.id, e]));
const S3 = 8.85, WIN3 = { x: 90, y: 500, w: 900, h: 920 };
const HL = [{ text: 'Eine digitale', y: 762, col: C.cream }, { text: 'Reise beginnt.', y: 840, col: C.cream, soft: 6 }];
const HL_SIZE = 76;
let glyphs = null;
function layoutGlyphs(ctx) {
  glyphs = []; font(ctx, HL_SIZE);
  HL.forEach((l, li) => {
    const total = ctx.measureText(l.text).width, x0 = 540 - total / 2;
    for (let k = 0; k < l.text.length; k++) {
      const ch = l.text[k]; if (ch === ' ') continue;
      glyphs.push({ ch, x: x0 + ctx.measureText(l.text.slice(0, k)).width, y: l.y, col: (l.soft != null && k >= l.soft) ? '#a29e96' : l.col, n: glyphs.length });
    }
  });
  const r = rng(5); glyphs.forEach(g => { g.dx = (r() - .5) * 180; g.dy = (r() - .5) * 150; g.rot = (r() - .5) * 1.6; });
}

function arrival(e, t) { return clamp((t - 3.55 - e.i * .045) / 1.25); }
function pos2(e, t) {
  const a = arrival(e, t), sc = lerp(.22, 1, spring(a, 6, 11));
  const bob = Math.sin(t * 1.25 + e.ph) * 12, sway = Math.cos(t * .9 + e.ph) * 8;
  const drift = (e.z - .85) * (t - 4) * -7;
  return {
    x: 540 + (e.p[0] + sway + drift - 540) * sc, y: 960 + (e.p[1] + bob - 960) * sc,
    s: e.z * sc, rot: e.rot + Math.sin(t * .7 + e.ph) * .05, a: clamp(a * 2.2) * (.62 + .38 * e.z),
  };
}

function drawIdea(ctx, e) {
  const k = e.k;
  if (k === 'swatch') { rr(ctx, -70, -90, 140, 180, 14); ctx.fillStyle = '#1b1a19'; ctx.fill(); ctx.strokeStyle = 'rgba(244,241,234,.1)'; ctx.lineWidth = 1.5; ctx.stroke(); rr(ctx, -58, -78, 116, 116, 8); ctx.fillStyle = e.col; ctx.fill(); ctx.fillStyle = C.dim; font(ctx, 15, 400); ctx.letterSpacing = '2px'; ctx.fillText(e.col.toUpperCase(), -56, 68); }
  else if (k === 'type') { rr(ctx, -110, -100, 220, 200, 14); ctx.fillStyle = '#1b1a19'; ctx.fill(); ctx.strokeStyle = 'rgba(244,241,234,.12)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = C.cream; font(ctx, 120); ctx.fillText('Aa', -88, 38); ctx.fillStyle = C.dim; font(ctx, 15, 400); ctx.letterSpacing = '3px'; ctx.fillText('ARIMO BOLD', -88, 80); }
  else if (k === 'sketch') { rr(ctx, -120, -85, 240, 170, 10); ctx.fillStyle = '#ece5d8'; ctx.fill(); ctx.strokeStyle = '#5b554d'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-95, -55); ctx.lineTo(95, -55); ctx.moveTo(-95, -30); ctx.bezierCurveTo(-40, -50, 20, -10, 80, -35); ctx.moveTo(-95, 10); ctx.lineTo(-10, 10); ctx.lineTo(-10, 60); ctx.lineTo(-95, 60); ctx.closePath(); ctx.moveTo(15, 20); ctx.lineTo(90, 20); ctx.moveTo(15, 40); ctx.lineTo(70, 40); ctx.stroke(); }
  else { rr(ctx, -150, -60, 300, 120, 12); ctx.fillStyle = '#1b1a19'; ctx.fill(); ctx.strokeStyle = 'rgba(244,241,234,.2)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = C.cream; font(ctx, 26); ctx.fillText(e.id === 'frag1' ? 'Eine digitale' : 'LEISTUNGEN', -126, -12); rr(ctx, -126, 12, 150, 34, 4); ctx.strokeStyle = 'rgba(244,241,234,.5)'; ctx.stroke(); font(ctx, 12, 400); ctx.letterSpacing = '2px'; ctx.fillText('ANFRAGE →', -110, 34); }
}
function drawWeb(ctx, e, w, h) {
  const d = e.to, x = -w / 2, y = -h / 2;
  if (d.web === 'button') { ctx.strokeStyle = 'rgba(244,241,234,.55)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h); ctx.fillStyle = C.cream; font(ctx, 13, 400); ctx.letterSpacing = '3px'; ctx.textAlign = 'center'; ctx.fillText('BETRETE DIE MEDIENWELT →', 0, 5); ctx.textAlign = 'left'; }
  else if (d.web === 'card') {
    rr(ctx, x, y, w, h, 10); ctx.fillStyle = '#1b1a19'; ctx.fill(); ctx.strokeStyle = 'rgba(244,241,234,.12)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#d2b894'; font(ctx, 11, 400); ctx.letterSpacing = '2px'; ctx.fillText(d.n, x + 18, y + 32);
    ctx.fillStyle = C.cream; font(ctx, 24); ctx.fillText(d.title, x + 18, y + 72);
    ctx.fillStyle = 'rgba(244,241,234,.18)'; [100, 118, 136].forEach((yy, i) => ctx.fillRect(x + 18, y + yy, w - 50 - i * 30, 6));
    ctx.strokeStyle = 'rgba(244,241,234,.4)'; ctx.strokeRect(x + w - 108, y + h - 50, 90, 32); ctx.fillStyle = '#d2b894'; ctx.fillRect(x + 18, y + h - 30, 70, 2);
  }
  else if (d.web === 'img') { const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, d.g[0]); g.addColorStop(1, d.g[1]); rr(ctx, x, y, w, h, 10); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(244,241,234,.08)'; ctx.lineWidth = 1; ctx.beginPath(); for (let r = 20; r < 300; r += 14) { ctx.moveTo(x + w * .7 + r, y + h * .3); ctx.arc(x + w * .7, y + h * .3, r, 0, 7); } ctx.save(); rr(ctx, x, y, w, h, 10); ctx.clip(); ctx.stroke(); ctx.restore(); }
  else if (d.web === 'logo') { ctx.save(); ctx.scale(w / 122, w / 122); drawSymbol(ctx, C.cream); ctx.restore(); }
  else if (d.web === 'label') { ctx.fillStyle = '#a29e96'; font(ctx, 13, 400); ctx.letterSpacing = '4px'; ctx.textAlign = 'center'; ctx.fillText('A DIGITAL FILM BY SOCIALCLIP', 0, 5); ctx.textAlign = 'left'; }
  else if (d.web === 'nav') { ctx.fillStyle = C.soft; font(ctx, 13, 400); ctx.letterSpacing = '3px'; ctx.textAlign = 'right'; ctx.fillText('LEISTUNGEN   IDEEN   KONTAKT', w / 2, 5); ctx.textAlign = 'left'; }
}

// logo symbol (two interlocking halves from socialclip-symbol-cream.svg), centred on 0,0
const SYM = [new Path2D('M146.10 66.74 L186.11 43.64 A67.10 67.10 0 1 0 94.45 135.30 L100.57 138.84 L146.77 112.16 L117.55 95.29 A20.90 20.90 0 1 1 146.10 66.74 Z'),
  new Path2D('M109.90 189.26 L69.89 212.36 A67.10 67.10 0 1 0 161.55 120.70 L155.43 117.16 L109.23 143.84 L138.45 160.71 A20.90 20.90 0 1 1 109.90 189.26 Z')];
function drawSymbol(ctx, col, off = [[0, 0], [0, 0]]) {
  ctx.fillStyle = col;
  SYM.forEach((p, i) => { ctx.save(); ctx.translate(off[i][0], off[i][1]); ctx.scale(.9075, .9075); ctx.translate(-128, -128); ctx.fill(p); ctx.restore(); });
}

function camA(t) {
  let x = 540, y = 960, s = 1 + .035 * P(t, 4, 8);
  const f1 = inOutCubic(P(t, 8.0, 8.6)); x = lerp(x, 650, f1); y = lerp(y, 760, f1); s = lerp(s, 1.16, f1);
  const f2 = inOutCubic(P(t, 8.8, 10.3)); x = lerp(x, 540, f2); y = lerp(y, 960, f2); s = lerp(s, .97, f2);
  s *= 1 + .03 * P(t, 10.3, 12.2);
  const f3 = inOutCubic(P(t, 12.2, 12.9)); x = lerp(x, 540, f3); y = lerp(y, 960, f3); s = lerp(s, 1, f3);
  return { x, y, s };
}

// light point: travels between ideas and connects them
const VISITS = [['swC', 4.9], ['type', 5.45], ['swW', 6.0], ['sk2', 6.55], ['sk1', 7.1], ['frag1', 7.6]];
function lightPos(t) {
  let px = 540, py = 960, pt = 4.2;
  for (const [id, vt] of VISITS) {
    const q = pos2(byId[id], t);
    if (t < vt) { const e = inOutCubic(P(t, pt, vt)); return { x: lerp(px, q.x, e) + Math.sin(e * Math.PI) * 60, y: lerp(py, q.y, e) - Math.sin(e * Math.PI) * 40 }; }
    px = q.x; py = q.y; pt = vt;
  }
  return { x: px, y: py };
}

function elState(e, t) {
  if (!e.to || t < S3 + e.ord * .1) { const q = pos2(e, t); const [nw, nh] = NAT[e.k]; return { x: q.x, y: q.y, w: nw * q.s, h: nh * q.s, rot: q.rot, m: 0, a: q.a, f: 0 }; }
  const ts = S3 + e.ord * .1, f = clamp((t - ts) / .62), q = pos2(e, ts), [nw, nh] = NAT[e.k];
  const pe = spring(f, 7, 12), se = outQuint(f), d = e.to;
  return {
    x: lerp(q.x, d.x + d.w / 2, pe), y: lerp(q.y, d.y + d.h / 2, pe) - Math.sin(Math.PI * clamp(f * 1.4)) * 70,
    w: lerp(nw * q.s, d.w, se), h: lerp(nh * q.s, d.h, se), rot: lerp(q.rot, 0, se), m: clamp((f - .2) / .45), a: lerp(q.a, 1, se), f,
  };
}

function sceneMid(ctx, t) {
  if (!glyphs) layoutGlyphs(ctx);
  const c = camA(t);
  // warm depth
  glow(ctx, 540, 900, 1000, .16, '140,104,70');
  if (t > 12.3) drawToDesk(ctx, t, 'frame');
  ctx.save(); applyCam(ctx, c);
  const fade3 = 1 - P(t, 12.5, 12.85); // layout fades as the real site wipes in

  // browser frame builds itself around the snapping pieces
  const fb = P(t, 9.0, 9.75);
  if (fb > 0) {
    const { x, y, w, h } = WIN3;
    ctx.globalAlpha = P(t, 9.15, 9.8) * (t > 12.3 ? 0 : 1); rr(ctx, x, y, w, h, 24); ctx.fillStyle = '#151413'; ctx.fill(); ctx.globalAlpha = 1;
  }

  // connection lines of the light point
  const lineA = (1 - P(t, 8.3, 8.9)) * P(t, 4.9, 5.0);
  if (lineA > 0) {
    ctx.strokeStyle = `rgba(230,208,173,${.32 * lineA})`; ctx.lineWidth = 1.6; ctx.beginPath();
    const lp = lightPos(t);
    for (let k = 0; k < VISITS.length; k++) {
      if (t < VISITS[k][1]) { if (k > 0) { const a = pos2(byId[VISITS[k - 1][0]], t); ctx.moveTo(a.x, a.y); ctx.lineTo(lp.x, lp.y); } break; }
      if (k > 0) { const a = pos2(byId[VISITS[k - 1][0]], t), b = pos2(byId[VISITS[k][0]], t); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
    }
    ctx.stroke();
  }

  // ideas / layout pieces (far ones first)
  [...EL].sort((a, b) => a.z - b.z).forEach(e => {
    if (e.id === 'type' && t >= 8.35) return;
    const s = elState(e, t);
    if (s.a <= 0) return;
    const [nw, nh] = NAT[e.k];
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.globalAlpha = s.a * fade3;
    if (s.m < 1) { ctx.save(); const k = Math.min(s.w / nw, s.h / nh); ctx.scale(k, k); ctx.globalAlpha = s.a * (1 - s.m) * fade3; drawIdea(ctx, e); ctx.restore(); }
    if (s.m > 0) { ctx.globalAlpha = s.m * fade3; drawWeb(ctx, e, s.w, s.h); }
    ctx.restore();
    // visit flash
    const v = VISITS.find(v => v[0] === e.id);
    if (v && t > v[1] && t < v[1] + .7) glow(ctx, s.x, s.y, 170 * s.w / nw, .35 * (1 - P(t, v[1], v[1] + .7)), '255,230,200');
    // snap flash
    if (s.f > .3 && s.f < 1) glow(ctx, s.x, s.y, 140, .25 * (1 - P(s.f, .3, 1)), '255,236,214');
  });

  // the type card is grabbed, dragged, and bursts into the headline
  const te = byId.type;
  if (t >= 8.35 && t < 8.9) {
    const q = pos2(te, 8.35), d = inOutCubic(P(t, 8.35, 8.8));
    const x = lerp(q.x, 540, d), y = lerp(q.y, 790, d), lift = 1 + .12 * Math.sin(P(t, 8.35, 8.8) * Math.PI * .5);
    ctx.save(); ctx.translate(x, y); ctx.rotate(lerp(q.rot, 0, d)); ctx.scale(q.s * lift, q.s * lift);
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26;
    ctx.globalAlpha = 1 - P(t, 8.8, 8.9); drawIdea(ctx, te); ctx.restore();
  }
  if (t >= 8.8) {
    font(ctx, HL_SIZE);
    glyphs.forEach(g => {
      const f = clamp((t - 8.8 - g.n * .018) / .55); if (f <= 0) return;
      const e = outBack(f, 1.2);
      const sx = 540 + g.dx, sy = 790 + g.dy;
      ctx.save(); ctx.translate(lerp(sx, g.x, e), lerp(sy, g.y, e)); ctx.rotate(g.rot * (1 - outQuint(f)));
      const sc = lerp(1.7, 1, outQuint(f)); ctx.scale(sc, sc);
      ctx.globalAlpha = clamp(f * 4) * fade3; ctx.fillStyle = g.col; ctx.fillText(g.ch, 0, 0); ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  // frame stroke + toolbar
  if (fb > 0) {
    const { x, y, w, h } = WIN3, per = 2 * (w + h);
    ctx.globalAlpha = t > 12.3 ? 0 : 1;
    ctx.setLineDash([per * outQuint(fb), per]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(244,241,234,.28)';
    rr(ctx, x, y, w, h, 24); ctx.stroke(); ctx.setLineDash([]);
    const tb = P(t, 9.4, 9.8);
    if (tb > 0) {
      ctx.globalAlpha = tb * fade3;
      ctx.fillStyle = 'rgba(244,241,234,.07)'; ctx.fillRect(x + 1, y + 56, w - 2, 1.5);
      [0, 1, 2].forEach(i => { ctx.beginPath(); ctx.arc(x + 34 + i * 24, y + 28, 6.5 * outBack(clamp(tb * 2 - i * .3)), 0, 7); ctx.fillStyle = i ? 'rgba(244,241,234,.28)' : C.cream; ctx.fill(); });
      rr(ctx, x + w / 2 - 140, y + 13, 280, 30, 15); ctx.fillStyle = 'rgba(244,241,234,.06)'; ctx.fill();
      font(ctx, 18, 400); ctx.letterSpacing = '1px'; ctx.fillStyle = C.dim; ctx.textAlign = 'center'; ctx.fillText('socialclip.art', x + w / 2, y + 34); ctx.textAlign = 'left';
    }
    ctx.globalAlpha = 1;
  }

  // light point → becomes the pointer
  const la = P(t, 4.1, 4.5) * (1 - P(t, 7.95, 8.15));
  if (la > 0) { const lp = lightPos(t); glow(ctx, lp.x, lp.y, 150, .75 * la); ctx.globalAlpha = la; ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(lp.x, lp.y, 6, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  if (t > 7.95 && t < 9.4) {
    const l0 = lightPos(7.95), q = pos2(te, 8.35);
    let px, py;
    if (t < 8.35) { const e = inOutCubic(P(t, 8.0, 8.33)); px = lerp(l0.x, q.x + 10, e); py = lerp(l0.y, q.y + 10, e); }
    else if (t < 8.8) { const d = inOutCubic(P(t, 8.35, 8.8)); px = lerp(q.x + 10, 550, d); py = lerp(q.y + 10, 800, d); }
    else { const d = inOutCubic(P(t, 8.85, 9.35)); px = lerp(550, 900, d); py = lerp(800, 1250, d); }
    const press = P(t, 8.35, 8.45), rel = P(t, 8.8, 8.9);
    const sc = 1 - .14 * Math.sin(press * Math.PI) - .1 * Math.sin(rel * Math.PI);
    pointer(ctx, px, py, sc / c.s, P(t, 7.95, 8.1) * (1 - P(t, 9.1, 9.35)));
  }
  ctx.restore();

  // scrim behind the scene-2 text so it always reads
  const tA = P(t, 4.4, 4.8) * (1 - P(t, 7.6, 7.95));
  if (tA > 0) { const g = ctx.createRadialGradient(330, 950, 0, 330, 950, 560); g.addColorStop(0, `rgba(12,11,10,${.72 * tA})`); g.addColorStop(1, 'rgba(12,11,10,0)'); ctx.fillStyle = g; ctx.fillRect(0, 300, W, 1300); }
  textBlock(ctx, [{ text: 'Am Anfang war', y: 905 }, { text: 'nur eine Idee.', y: 1012, col: '#e6d0ad' }], t, 4.55, 7.6);
  if (t > 12.3) drawToDesk(ctx, t, 'content');
  textBlock(ctx, [{ text: 'Dann bekam', y: 330 }, { text: 'sie Form.', y: 430, col: '#a29e96' }], t, 9.2, 12.0);

}

// ---------- browser + phone helpers (screen space) ----------
let deskImg, mobImg;
async function loadImg(src) { const i = new Image(); i.src = src; await i.decode(); return i; }
async function initLate() { deskImg = await loadImg('../assets/site/deskA.jpg'); mobImg = await loadImg('../assets/site/mob-tex.jpg'); }
const WD = { x: 60, y: 640, w: 960, h: 650, tb: 50 };
function browserChrome(ctx, x, y, w, h, tb, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = 90; ctx.shadowOffsetY = 40;
  rr(ctx, x, y, w, h, 22); ctx.fillStyle = '#151413'; ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha = a;
  if (tb > 4) {
    ctx.fillStyle = 'rgba(244,241,234,.07)'; ctx.fillRect(x + 1, y + tb - 1, w - 2, 1.5);
    [0, 1, 2].forEach(i => { ctx.beginPath(); ctx.arc(x + 30 + i * 22, y + tb / 2, 6, 0, 7); ctx.fillStyle = i ? 'rgba(244,241,234,.28)' : C.cream; ctx.fill(); });
    rr(ctx, x + w / 2 - 140, y + tb / 2 - 14, 280, 28, 14); ctx.fillStyle = 'rgba(244,241,234,.06)'; ctx.fill();
    font(ctx, 17, 400); ctx.letterSpacing = '1px'; ctx.fillStyle = C.dim; ctx.textAlign = 'center'; ctx.fillText('socialclip.art', x + w / 2, y + tb / 2 + 6); ctx.textAlign = 'left';
  }
  ctx.restore();
}
function deskContent(ctx, x, y, w, h, scrollCss) {
  // viewport 1440 css wide; texture is 2x
  const k = w / 1440, vh = h / k;
  ctx.drawImage(deskImg, 0, scrollCss * 2, 2880, vh * 2, x, y, w, h);
}
function mobContent(ctx, x, y, w, h, sy) {
  const k = w / 780, vh = h / k;
  ctx.drawImage(mobImg, 0, sy, 780, vh, x, y, w, h);
}
function lightWipe(ctx, x, y, w, yy) { const g = ctx.createLinearGradient(0, yy - 120, 0, yy + 20); g.addColorStop(0, 'rgba(255,240,220,0)'); g.addColorStop(.85, 'rgba(255,240,220,.35)'); g.addColorStop(1, 'rgba(255,240,220,0)'); ctx.fillStyle = g; ctx.fillRect(x, yy - 120, w, 140); }

function drawToDesk(ctx, t, part) {
  // window morphs from the built layout to a desktop browser; real site wipes in from the top
  const c = camA(t), e = inOutCubic(P(t, 12.3, 12.95));
  const toS = r => ({ x: W / 2 + (r.x - c.x) * c.s, y: H / 2 + (r.y - c.y) * c.s, w: r.w * c.s, h: r.h * c.s });
  const a = toS(WIN3);
  const r = { x: lerp(a.x, WD.x, e), y: lerp(a.y, WD.y, e), w: lerp(a.w, WD.w, e), h: lerp(a.h, WD.h, e) };
  if (part === 'frame') { browserChrome(ctx, r.x, r.y, r.w, r.h, WD.tb * e, 1); return; }
  const cy = r.y + WD.tb * e, ch = r.h - WD.tb * e, wipe = lerp(cy, cy + ch, inOutCubic(P(t, 12.5, 13.09)));
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, cy, r.w, wipe - cy); ctx.clip(); rr(ctx, r.x, r.y, r.w, r.h, 22); ctx.clip();
  deskContent(ctx, r.x, cy, r.w, ch, 0); ctx.restore();
  if (wipe < cy + ch) { ctx.save(); ctx.beginPath(); ctx.rect(r.x, cy, r.w, ch); ctx.clip(); lightWipe(ctx, r.x, cy, r.w, wipe); ctx.restore(); }
}

// ---------- scene 4: the real site — desktop details, then phone ----------
function camD(t) {
  let x = 540, y = 965, s = 1 + .02 * P(t, 13.09, 14);
  const p = inOutCubic(P(t, 14.0, 15.05)); x = lerp(x, 330, p); y = lerp(y, 840, p); s = lerp(s, 1.5, p);
  const q = inOutCubic(P(t, 15.1, 15.6)); x = lerp(x, 540, q); y = lerp(y, 965, q); s = lerp(s, 1, q);
  return { x, y, s };
}
const PH = { x: 327, y: 600, w: 426, h: 920 };
const deskScroll = t => 900 * spring(P(t, 13.55, 14.75), 8, 10);
const mobScroll = t => { const sp = x => spring(x, 8, 10); return 2350 + 1900 * sp(P(t, 16.45, 17.35)) + 2150 * sp(P(t, 17.55, 18.4)); };
function phone(ctx, x, y, w, h, rad, bezel, rot, sc, content) {
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.scale(sc, sc); ctx.translate(-w / 2, -h / 2);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 90; ctx.shadowOffsetY = 40; rr(ctx, 0, 0, w, h, rad); ctx.fillStyle = '#0a0a0a'; ctx.fill(); ctx.restore();
  rr(ctx, 0, 0, w, h, rad); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(244,241,234,.2)'; ctx.stroke();
  ctx.save(); rr(ctx, bezel, bezel, w - bezel * 2, h - bezel * 2, Math.max(4, rad - bezel)); ctx.clip(); content(bezel, bezel, w - bezel * 2, h - bezel * 2); ctx.restore();
  if (bezel > 4) { rr(ctx, w / 2 - 50, bezel + 12, 100, 28, 14); ctx.fillStyle = '#000'; ctx.fill(); }
  ctx.restore();
}
function scene4(ctx, t) {
  glow(ctx, 540, 900, 1000, .14, '140,104,70');
  const c = camD(t), o = inOutCubic(P(t, 15.5, 16.04));
  const toS = r => ({ x: W / 2 + (r.x - c.x) * c.s, y: H / 2 + (r.y - c.y) * c.s, w: r.w * c.s, h: r.h * c.s });
  if (o <= 0) {
    ctx.save(); applyCam(ctx, c);
    browserChrome(ctx, WD.x, WD.y, WD.w, WD.h, WD.tb);
    ctx.save(); rr(ctx, WD.x, WD.y, WD.w, WD.h, 22); ctx.clip(); deskContent(ctx, WD.x, WD.y + WD.tb, WD.w, WD.h - WD.tb, deskScroll(t)); ctx.restore();
    ctx.restore();
    // reveal flash
    const fl = P(t, 13.09, 13.6); if (fl < 1) { glow(ctx, 540, 965, 900, .4 * Math.pow(1 - fl, 2)); }
  } else {
    const a = toS(WD);
    const land = t > 16.04 ? 1 + .035 * Math.exp(-6 * (t - 16.04)) * Math.sin((t - 16.04) * 16) : 1;
    const r = { x: lerp(a.x, PH.x, o), y: lerp(a.y, PH.y, o), w: lerp(a.w, PH.w, o), h: lerp(a.h, PH.h, o) };
    const tb = lerp(WD.tb, 0, clamp(o * 2)), bez = lerp(0, 12, o), cf = P(o, .3, .7);
    phone(ctx, r.x, r.y, r.w, r.h, lerp(22, 58, o), bez, -Math.sin(Math.PI * o) * .07, land, (x, y, w, h) => {
      ctx.fillStyle = '#121212'; ctx.fillRect(x, y, w, h);
      if (cf < 1) { ctx.globalAlpha = 1 - cf; const dw = Math.max(w, (h - tb) * 1.6); deskContent(ctx, x + (w - dw) / 2, y + tb, dw, h - tb, 900); }
      if (cf > 0) { ctx.globalAlpha = cf; mobContent(ctx, x, y, w, h, mobScroll(t)); }
      ctx.globalAlpha = 1;
      if (tb > 4) { ctx.fillStyle = '#151413'; ctx.fillRect(x, y, w, tb); }
    });
  }
  textBlock(ctx, [{ text: 'Design,', y: 330 }, { text: 'das auffällt.', y: 430, col: '#a29e96' }], t, 13.45, 15.25);
  textBlock(ctx, [{ text: 'Bewegung, die', y: 330 }, { text: 'hängen bleibt.', y: 430, col: '#e6d0ad' }], t, 16.6, 18.6);
}

// ---------- scene 5: pull back, everything finds its place, end card ----------
const ORBIT = [['type', [-200, 300], [230, 740]], ['swW', [1280, 420], [650, 760]], ['swC', [1300, 1500], [220, 1000]], ['sk1', [-260, 1500], [600, 1010]], ['frag1', [540, -200], [430, 1020]]];
function scene5(ctx, t) {
  glow(ctx, 540, 900, 1000, .14, '140,104,70');
  if (t < 21.43) {
    const u = inOutCubic(P(t, 19.0, 20.0)), col = inExpo(P(t, 20.55, 21.43));
    const G = { x: 540, y: 920 };
    ctx.save();
    ctx.translate(G.x, G.y); ctx.rotate(col * .25); ctx.scale(1 - col * .98, 1 - col * .98); ctx.translate(-G.x, -G.y);
    // desktop slides in behind
    const dc = { x: lerp(-420, 430, u), y: lerp(880, 860, u) }, ds = .64, dr = lerp(-.12, 0, u);
    ctx.save(); ctx.translate(dc.x, dc.y); ctx.rotate(dr); ctx.scale(ds, ds); ctx.translate(-WD.w / 2, -WD.h / 2);
    browserChrome(ctx, 0, 0, WD.w, WD.h, WD.tb); ctx.save(); rr(ctx, 0, 0, WD.w, WD.h, 22); ctx.clip(); deskContent(ctx, 0, WD.tb, WD.w, WD.h - WD.tb, 0); ctx.restore();
    ctx.restore();
    // ideas fly in and are absorbed by the site
    ORBIT.forEach(([id, from, to], i) => {
      const e = byId[id], fi = P(t, 19.15 + i * .07, 19.8 + i * .06), ab = P(t, 19.8 + i * .06, 20.15 + i * .06);
      if (fi <= 0 || ab >= 1) return;
      const fe = outQuint(fi);
      const x = lerp(from[0], to[0], fe) + Math.sin(fe * Math.PI) * 80, y = lerp(from[1], to[1], fe);
      const s = .55 * (1 - inExpo(ab) * .98);
      ctx.save(); ctx.translate(x, y); ctx.rotate(e.rot * (1 - fe)); ctx.scale(s, s); ctx.globalAlpha = 1 - ab * .3; drawIdea(ctx, e); ctx.restore();
      if (ab > .6) glow(ctx, x, y, 130, .5 * (1 - ab));
    });
    // phone moves to the front right
    const pc = { x: lerp(540, 735, u), y: lerp(1060, 1090, u) }, ps = lerp(1, .7, u);
    phone(ctx, pc.x - PH.w / 2, pc.y - PH.h / 2, PH.w, PH.h, 58, 12, lerp(0, .04, u), ps, (x, y, w, h) => { ctx.fillStyle = '#121212'; ctx.fillRect(x, y, w, h); mobContent(ctx, x, y, w, h, mobScroll(t)); });
    ctx.restore();
    // the light point orbits, then swallows the scene
    const ang = t * 2.4, lx = lerp(540 + Math.cos(ang) * 420, G.x, col), ly = lerp(900 + Math.sin(ang) * 520, G.y, col);
    const la = P(t, 19.2, 19.6);
    glow(ctx, lx, ly, lerp(150, 1100, col), lerp(.6, 1, col) * la);
  } else {
    endCard(ctx, t);
  }
  const fl = P(t, 21.43, 22.0);
  if (fl > 0 && fl < 1) { ctx.fillStyle = `rgba(255,244,228,${.4 * Math.pow(1 - fl, 2.2)})`; ctx.fillRect(0, 0, W, H); }
}
function endCard(ctx, t) {
  const s = 1 + .035 * P(t, 21.43, 24);
  ctx.save(); ctx.translate(540, 960); ctx.scale(s, s); ctx.translate(-540, -960);
  // logo: the two halves fly in and interlock
  const k = P(t, 21.43, 22.15), e = spring(k, 6, 10), lock = P(t, 21.43, 21.75);
  glow(ctx, 540, 620, 420, .35 * (1 - P(t, 21.6, 22.6)) + .08);
  ctx.save(); ctx.translate(540, 620); ctx.scale(1.15, 1.15); ctx.rotate(lerp(-.5, 0, outQuint(k)));
  drawSymbol(ctx, C.cream, [[lerp(-240, 0, e), lerp(-150, 0, e)], [lerp(240, 0, e), lerp(150, 0, e)]]);
  ctx.restore();
  textBlock(ctx, [{ text: 'Ideen werden', y: 940 }, { text: 'Wirkung.', y: 1064, col: '#e6d0ad' }], t, 21.75, 99, { size: 120, align: 'center' });
  // wordmark letters drop in
  const wm = 'SOCIALCLIP.ART'; font(ctx, 46); ctx.letterSpacing = '9px';
  const tw = ctx.measureText(wm).width - 9; let x = 540 - tw / 2;
  for (let i = 0; i < wm.length; i++) {
    const f = clamp((t - 22.3 - i * .03) / .4), ee = outBack(f, 1.4), ch = wm[i];
    ctx.globalAlpha = clamp(f * 3); ctx.fillStyle = C.cream; ctx.fillText(ch, x, 1208 + (1 - ee) * 40);
    x += ctx.measureText(ch).width;
  }
  ctx.globalAlpha = 1;
  // CTA with a line drawn by the caret from the opening
  const ca = P(t, 22.8, 23.1);
  if (ca > 0) {
    font(ctx, 36, 400); ctx.letterSpacing = '0px'; const cta = 'Entdecke, was möglich ist.', cw = ctx.measureText(cta).width;
    ctx.globalAlpha = ca; ctx.fillStyle = C.soft; ctx.fillText(cta, 540 - cw / 2, 1320 + (1 - outQuint(ca)) * 16); ctx.globalAlpha = 1;
    const lp = outExpo(P(t, 23.0, 23.45)), lx = 540 - cw / 2 + cw * lp;
    ctx.fillStyle = '#d2b894'; ctx.fillRect(540 - cw / 2, 1346, cw * lp, 2.5);
    if (t > 23.0) caret(ctx, lx + 8, 1310, 46, t < 23.45 ? 1 : (Math.floor((t - 23.45) * 2.6) % 2 ? 0 : 1));
  }
  ctx.restore();
}

// ---------- compositing ----------
let mask, s2c;
function s2Layer(t, arrive, sx) {
  if (!s2c) s2c = document.createElement('canvas');
  s2c.width = Math.round(W * sx); s2c.height = Math.round(H * sx);
  const m = s2c.getContext('2d'); m.setTransform(sx, 0, 0, sx, 0, 0); m.drawImage(bgTex, 0, 0); sceneMid(m, t); return s2c;
}
export function draw(ctx, t) {
  ctx.drawImage(bgTex, 0, 0);
  if (t < 4.0) {
    const c = scene1(ctx, t);
    // the letters of DAS become a window into scene 2, then the selection frame opens to full screen
    const portal = P(t, 3.4, 3.62);
    if (portal > 0) {
      const sx = ctx.getTransform().a;
      const layer = s2Layer(t, P(t, 3.5, 4.9), sx);
      if (!mask) mask = document.createElement('canvas');
      mask.width = layer.width; mask.height = layer.height;
      const m = mask.getContext('2d'); m.setTransform(sx, 0, 0, sx, 0, 0);
      // screen rect of the selection box
      const pad = 18, bx = TX - pad, by = DAS_Y - 196 - pad, bw = das.w + pad * 2, bh = 196 + pad * 2 + 10;
      const toS = (wx, wy) => [W / 2 + (wx - c.x) * c.s, H / 2 + (wy - c.y) * c.s];
      const [x0, y0] = toS(bx, by), [x1, y1] = toS(bx + bw, by + bh);
      const o = inOutCubic(P(t, 3.6, 3.97));
      const rx0 = lerp(x0, -4, o), ry0 = lerp(y0, -4, o), rx1 = lerp(x1, W + 4, o), ry1 = lerp(y1, H + 4, o);
      // letters filled with the next scene
      m.save(); applyCam(m, c); font(m, DAS_SIZE); m.letterSpacing = '-12px'; m.fillStyle = '#fff'; m.fillText('DAS', TX, DAS_Y); m.restore();
      if (o > 0) { m.fillStyle = '#fff'; m.beginPath(); m.roundRect(rx0, ry0, rx1 - rx0, ry1 - ry0, lerp(4, 0, o)); m.fill(); }
      m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-in'; m.drawImage(layer, 0, 0);
      // keep the letters readable as light while the window is still small
      m.globalCompositeOperation = 'source-atop'; m.globalAlpha = .55 * (1 - inOutCubic(portal)) + .25 * (1 - o); m.fillStyle = C.cream; m.fillRect(0, 0, mask.width, mask.height);
      m.globalAlpha = 1; m.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(mask, 0, 0); ctx.restore();
      // frame edge of the opening window
      if (o > 0 && o < 1) { ctx.save(); ctx.strokeStyle = C.warm; ctx.globalAlpha = 1 - o; ctx.lineWidth = 3; ctx.strokeRect(rx0, ry0, rx1 - rx0, ry1 - ry0); ctx.restore(); }
    }
  } else if (t < 13.09) {
    sceneMid(ctx, t);
  } else if (t < 19.0) {
    scene4(ctx, t);
  } else {
    scene5(ctx, t);
  }
  ctx.globalAlpha = .045; ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(grain[Math.floor(t * 24) % 4], 0, 0, W, H);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

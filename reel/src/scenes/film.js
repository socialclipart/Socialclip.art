// SocialClip reel — one absolute-time timeline. Every frame depends only on t.
const C = { bg: '#121212', cream: '#f4f1ea', soft: '#b0aca4', dim: '#86827b', line: 'rgba(244,241,234,.13)', warm: '#c9a27e' };
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
  if (t > 1.2 && t < 2.0) return 0.7;
  if (t > DAS_T - .05 && t < DAS_T + .3) return 1;
  if (t > 3.6 && t < 4.15) return 1.1;
  return 0;
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

// ---------- scene 2 (ideas floating in space) ----------
const IDEAS = (() => {
  const r = rng(21), items = [];
  const kinds = ['sketch', 'swatch', 'type', 'frag', 'swatch', 'sketch', 'frag', 'type', 'swatch', 'frag', 'sketch', 'swatch'];
  const pos = [[250, 520], [800, 430], [560, 800], [180, 1000], [880, 900], [700, 1240], [300, 1380], [850, 1550], [480, 300], [120, 1650], [600, 1650], [960, 1180]];
  kinds.forEach((k, i) => items.push({ k, x: pos[i][0], y: pos[i][1], z: .55 + r() * .9, rot: (r() - .5) * .35, ph: r() * 6.28, col: [C.cream, C.soft, C.dim, C.warm, '#2a2725'][i % 5] }));
  return items;
})();
function drawIdea(ctx, it, a) {
  ctx.globalAlpha = a;
  if (it.k === 'swatch') { rr(ctx, -70, -90, 140, 180, 14); ctx.fillStyle = '#1b1a19'; ctx.fill(); rr(ctx, -58, -78, 116, 116, 8); ctx.fillStyle = it.col; ctx.fill(); ctx.fillStyle = C.dim; font(ctx, 16, 400); ctx.letterSpacing = '2px'; ctx.fillText(it.col.toUpperCase(), -56, 70); }
  else if (it.k === 'type') { rr(ctx, -110, -100, 220, 200, 14); ctx.fillStyle = '#1b1a19'; ctx.fill(); ctx.fillStyle = C.cream; font(ctx, 120); ctx.fillText('Aa', -88, 40); ctx.fillStyle = C.dim; font(ctx, 16, 400); ctx.letterSpacing = '2px'; ctx.fillText('ARIMO BOLD', -88, 80); }
  else if (it.k === 'sketch') { rr(ctx, -120, -85, 240, 170, 10); ctx.fillStyle = '#efe9dd'; ctx.fill(); ctx.strokeStyle = '#5b554d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-95, -55); ctx.lineTo(95, -55); ctx.moveTo(-95, -30); ctx.bezierCurveTo(-40, -50, 20, -10, 80, -35); ctx.moveTo(-95, 10); ctx.lineTo(-10, 10); ctx.lineTo(-10, 60); ctx.lineTo(-95, 60); ctx.closePath(); ctx.moveTo(15, 20); ctx.lineTo(90, 20); ctx.moveTo(15, 40); ctx.lineTo(70, 40); ctx.stroke(); }
  else { rr(ctx, -150, -60, 300, 120, 12); ctx.fillStyle = '#1b1a19'; ctx.fill(); ctx.strokeStyle = 'rgba(244,241,234,.2)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = C.cream; font(ctx, 26); ctx.fillText('Eine digitale', -126, -12); rr(ctx, -126, 12, 150, 34, 4); ctx.strokeStyle = 'rgba(244,241,234,.5)'; ctx.stroke(); font(ctx, 12, 400); ctx.letterSpacing = '2px'; ctx.fillText('ANFRAGE →', -110, 34); }
  ctx.globalAlpha = 1;
}
function scene2(ctx, t, arrive) {
  // arrive: 0 (seen far away, through the letter) → 1 (we are in the space)
  ctx.fillStyle = '#100f0e'; ctx.fillRect(0, 0, W, H);
  glow(ctx, 540, 900, 900, .18, '120,82,52');
  const camZ = lerp(-2.4, 0, outQuint(arrive));
  IDEAS.forEach(it => {
    const z = it.z + camZ * .0 ; const depth = 1 / Math.max(.15, 1 - camZ * .0);
    const persp = Math.max(.05, (it.z) / Math.max(.2, it.z - camZ * .35));
    const bob = Math.sin(t * 1.3 + it.ph) * 10;
    const x = 540 + (it.x - 540) * persp, y = 960 + (it.y + bob - 960) * persp;
    ctx.save(); ctx.translate(x, y); ctx.rotate(it.rot + Math.sin(t * .8 + it.ph) * .04); ctx.scale(persp * it.z, persp * it.z);
    drawIdea(ctx, it, clamp(arrive * 1.5) * (0.55 + it.z * .45)); ctx.restore();
  });
  // the light point (the thought)
  const lx = 540 + Math.sin(t * 1.7) * 220, ly = 900 + Math.cos(t * 1.1) * 260;
  glow(ctx, lx, ly, 160, .7);
}

// ---------- compositing ----------
let mask, s2c;
function s2Layer(t, arrive, sx) {
  if (!s2c) s2c = document.createElement('canvas');
  s2c.width = Math.round(W * sx); s2c.height = Math.round(H * sx);
  const m = s2c.getContext('2d'); m.setTransform(sx, 0, 0, sx, 0, 0); scene2(m, t, arrive); return s2c;
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
  } else {
    scene2(ctx, t, P(t, 3.5, 4.9));
  }
  ctx.globalAlpha = .045; ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(grain[Math.floor(t * 24) % 4], 0, 0, W, H);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

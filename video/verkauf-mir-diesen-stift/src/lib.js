// Gemeinsame Helfer: Easing, Gold, Text, Stift, Grain. Alles rein zeitabhängig und geseedet.
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const easeOut = k => 1 - Math.pow(1 - k, 3);
export const easeIn = k => k * k * k;
export const easeInOut = k => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const easeOutExpo = k => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));
export const easeOutBack = (k, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const GOLD = { hi: '#fff1b8', a: '#f3d27a', b: '#d4a640', c: '#9c7424', d: '#5e4313' };
export const RED = '#e0262b';
export const CREAM = '#f4f1ea';

export function goldGrad(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, '#c99a3c'); g.addColorStop(.3, GOLD.a); g.addColorStop(.48, GOLD.hi);
  g.addColorStop(.68, '#e6bb58'); g.addColorStop(1, '#b0822f');
  return g;
}

export const SERIF = '"PF", serif';
export const COND = '"OSW", sans-serif';

let fontsLoaded = false;
export async function loadFonts() {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const list = [
    ['PF', 'playfair-900.woff2', '900', 'normal'],
    ['PF', 'playfair-700.woff2', '700', 'normal'],
    ['PF', 'playfair-400i.woff2', '400', 'italic'],
    ['OSW', 'oswald-600.woff2', '600', 'normal'],
    ['OSW', 'oswald-400.woff2', '400', 'normal'],
  ];
  for (const [fam, file, weight, style] of list) {
    const f = new FontFace(fam, `url(/assets/fonts/${file})`, { weight, style });
    await f.load(); document.fonts.add(f);
  }
}

export function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

// Text mit Gold-Füllung (Gradient über die Glyphenhöhe), optional Glow.
export function goldText(ctx, str, x, y, size, { font = SERIF, weight = 900, align = 'center', glow = 0, spacing = 0 } = {}) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = spacing + 'px';
  if (glow) { ctx.shadowColor = 'rgba(243,190,80,' + (.55 * glow) + ')'; ctx.shadowBlur = 40 * glow; }
  ctx.fillStyle = goldGrad(ctx, x, y - size * .85, x + size * .25, y + size * .1);
  ctx.fillText(str, x, y);
  ctx.restore();
}

export function fitSize(ctx, str, maxW, size, font = SERIF, weight = 900, spacing = 0) {
  ctx.save(); ctx.font = `${weight} ${size}px ${font}`; ctx.letterSpacing = spacing + 'px';
  const w = ctx.measureText(str).width; ctx.restore();
  return w > maxW ? size * maxW / w : size;
}

// Goldener Kugelschreiber, Mitte bei (0,0), Länge L, zeigt nach rechts (Spitze rechts).
export function drawPen(ctx, L, sheen = -1) {
  const r = L * 0.042;
  const x0 = -L / 2, x1 = L / 2;
  const tipStart = x1 - L * 0.16;
  ctx.save();
  // Schatten
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = L * .05; ctx.shadowOffsetY = L * .03;
  ctx.fillStyle = '#000'; roundRect(ctx, x0, -r, tipStart - x0, 2 * r, r); ctx.fill(); ctx.restore();
  // Spitze (Kegel)
  const tg = ctx.createLinearGradient(0, -r, 0, r);
  tg.addColorStop(0, '#6d5a3a'); tg.addColorStop(.4, '#f6e7b8'); tg.addColorStop(1, '#3a2c14');
  ctx.fillStyle = tg;
  ctx.beginPath(); ctx.moveTo(tipStart, -r * .92); ctx.lineTo(x1 - L * .012, -r * .12); ctx.lineTo(x1, 0);
  ctx.lineTo(x1 - L * .012, r * .12); ctx.lineTo(tipStart, r * .92); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1a1208'; ctx.beginPath(); ctx.arc(x1 - L * .004, 0, r * .12, 0, Math.PI * 2); ctx.fill();
  // Körper
  const bg = ctx.createLinearGradient(0, -r, 0, r);
  bg.addColorStop(0, GOLD.d); bg.addColorStop(.18, GOLD.a); bg.addColorStop(.32, GOLD.hi);
  bg.addColorStop(.55, GOLD.b); bg.addColorStop(.85, GOLD.c); bg.addColorStop(1, '#3d2a0a');
  ctx.fillStyle = bg; roundRect(ctx, x0, -r, tipStart - x0, 2 * r, r * .9); ctx.fill();
  // Ringe
  ctx.fillStyle = 'rgba(40,25,5,.55)';
  for (const p of [0.18, 0.62, 0.64]) ctx.fillRect(x0 + L * p, -r, L * .006, 2 * r);
  // Griffzone dunkel
  const gz = ctx.createLinearGradient(0, -r, 0, r);
  gz.addColorStop(0, '#0d0a06'); gz.addColorStop(.3, '#3a3328'); gz.addColorStop(1, '#050403');
  ctx.fillStyle = gz; ctx.fillRect(x0 + L * .645, -r * .97, tipStart - (x0 + L * .645), r * 1.94);
  // Druckknopf
  ctx.fillStyle = bg; roundRect(ctx, x0 - L * .045, -r * .7, L * .05, r * 1.4, r * .35); ctx.fill();
  // Clip
  ctx.fillStyle = goldGrad(ctx, 0, -r * 1.6, 0, -r * .6);
  roundRect(ctx, x0 + L * .02, -r * 1.55, L * .3, r * .5, r * .25); ctx.fill();
  ctx.fillRect(x0 + L * .02, -r * 1.3, L * .05, r * .5);
  // Lichtreflex
  if (sheen > -0.5 && sheen < 1.5) {
    ctx.save(); roundRect(ctx, x0, -r, tipStart - x0, 2 * r, r * .9); ctx.clip();
    const sx = lerp(x0 - L * .3, x1 + L * .3, sheen);
    const sg = ctx.createLinearGradient(sx - L * .12, 0, sx + L * .12, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,252,235,.85)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg; ctx.fillRect(x0, -r, L, 2 * r); ctx.restore();
  }
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}

// Vorberechnete Grain-Kacheln.
const grains = [];
export function makeGrain() {
  if (grains.length) return;
  const R = rng(77);
  for (let k = 0; k < 6; k++) {
    const c = document.createElement('canvas'); c.width = 540; c.height = 960;
    const g = c.getContext('2d'); const img = g.createImageData(540, 960);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = R() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0); grains.push(c);
  }
}
export function drawGrain(ctx, t, W, H, amt = .06) {
  ctx.save(); ctx.globalAlpha = amt; ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(grains[Math.floor(t * 24) % grains.length], 0, 0, W, H); ctx.restore();
}

// Globale Kamera-Erschütterung bei Einschlägen.
const SHAKES = [[8.32, 18, .28], [4.52, 8, .15], [5.77, 8, .15], [6.81, 10, .18], [18.68, 14, .3], [33.22, 16, .35], [39.80, 8, .2]];
export function shake(t) {
  let x = 0, y = 0;
  for (const [s, amp, d] of SHAKES) {
    const k = (t - s) / d; if (k < 0 || k > 1) continue;
    const a = amp * Math.pow(1 - k, 2);
    x += a * Math.sin(t * 91.7 + s); y += a * Math.cos(t * 73.3 + s * 2);
  }
  return [x, y];
}

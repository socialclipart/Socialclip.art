// Hook 1 "Glas-Crash": Feed scrollt -> Display zersplittert -> STOPP. NICHT WEITERWISCHEN.
import { rng, prog, easeOut, easeOutBack, easeIn, lerp, clamp, goldText, fitSize, COND } from '../lib.js';

const HIT = .6, IX = 540, IY = 820;
let feed;
const R = rng(42);

// Feed-Inhalt als Bild (Zustand im Moment des Einschlags)
function drawFeed(g, W, H, scroll) {
  g.fillStyle = '#121212'; g.fillRect(0, 0, W, H);
  const r = rng(7);
  for (let i = 0; i < 8; i++) {
    const y = 120 + i * 640 - scroll;
    if (y > H || y < -640) continue;
    g.fillStyle = '#1e1e1e'; g.beginPath(); g.roundRect(40, y, W - 80, 600, 30); g.fill();
    g.fillStyle = `hsl(${r() * 360},25%,${30 + r() * 20}%)`; g.beginPath(); g.arc(110, y + 70, 36, 0, 6.283); g.fill();
    g.fillStyle = '#3a3a3a'; g.fillRect(170, y + 50, 260, 22); g.fillRect(170, y + 84, 160, 16);
    const gr = g.createLinearGradient(0, y + 130, W, y + 520);
    gr.addColorStop(0, `hsl(${r() * 360},30%,35%)`); gr.addColorStop(1, `hsl(${r() * 360},30%,20%)`);
    g.fillStyle = gr; g.fillRect(70, y + 130, W - 140, 380);
    g.fillStyle = '#3a3a3a'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(100 + k * 70, y + 555, 18, 0, 6.283); g.fill(); }
  }
}

// Splitter: Sektoren zwischen Radial-Linien und Ringen
const ANG = (() => { const a = []; let x = R() * .4; while (x < 6.283) { a.push(x); x += .3 + R() * .45; } return a; })();
const RINGS = [0, 70, 170, 320, 520, 800, 1200, 1700];
const SHARDS = [];
for (let j = 0; j < RINGS.length - 1; j++) for (let i = 0; i < ANG.length; i++) {
  const a0 = ANG[i], a1 = i + 1 < ANG.length ? ANG[i + 1] : ANG[0] + 6.283;
  const jit = () => (R() - .5) * .08;
  const r0 = RINGS[j] * (1 + jit()), r1 = RINGS[j + 1] * (1 + jit());
  const pts = [[a0, r0], [a1, r0], [a1, r1], [(a0 + a1) / 2 + jit(), r1 * 1.02], [a0, r1]].map(([a, r]) => [IX + Math.cos(a) * r, IY + Math.sin(a) * r]);
  const am = (a0 + a1) / 2, rm = (r0 + r1) / 2;
  SHARDS.push({ pts, cx: IX + Math.cos(am) * rm, cy: IY + Math.sin(am) * rm, dir: am, ring: j,
    v: 260 + R() * 520, spin: (R() - .5) * 3, delay: j * .05 + R() * .08, fall: 900 + R() * 900 });
}
const SPARK = Array.from({ length: 90 }, () => ({ a: R() * 6.283, v: 600 + R() * 1800, s: 2 + R() * 6, l: .4 + R() * .6 }));

export function init({ W, H }) {
  feed = document.createElement('canvas'); feed.width = W; feed.height = H;
  drawFeed(feed.getContext('2d'), W, H, HIT * 1500);
}

export function draw(ctx, t, { W, H }) {
  // Dahinter: Gold-Bühne
  const bg = ctx.createRadialGradient(IX, IY, 20, IX, IY, 1300);
  bg.addColorStop(0, '#3a2a10'); bg.addColorStop(.4, '#120d06'); bg.addColorStop(1, '#030201');
  ctx.fillStyle = bg; ctx.fillRect(-60, -60, W + 120, H + 120);

  if (t < HIT) {
    // normales Scrollen, beschleunigt
    drawFeed(ctx, W, H, t * t * 1500 / HIT);
    // Finger-Hinweis
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.beginPath(); ctx.arc(780, 1400 - t * 900, 60, 0, 6.283); ctx.fill();
    return;
  }
  const k = t - HIT;
  // Licht durch das Loch
  const gl = ctx.createRadialGradient(IX, IY, 10, IX, IY, lerp(100, 1100, easeOut(prog(k, 0, 1.2))));
  gl.addColorStop(0, 'rgba(255,220,140,.55)'); gl.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);

  // Splitter
  for (const s of SHARDS) {
    const d = Math.max(0, k - s.delay * .6);
    const fly = s.ring === 0 ? 1 : clamp(d * 3);
    const slow = d < .5 ? d * .45 : .225 + (d - .5) * 1.2;   // Zeitlupe, dann Fall
    const dx = Math.cos(s.dir) * s.v * slow * fly, dy = Math.sin(s.dir) * s.v * slow * fly + s.fall * slow * slow * fly;
    const rot = s.spin * slow * fly;
    if (s.cy + dy > H + 400) continue;
    ctx.save();
    ctx.translate(s.cx + dx, s.cy + dy); ctx.rotate(rot); ctx.translate(-s.cx, -s.cy);
    ctx.beginPath(); s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
    ctx.save(); ctx.clip(); ctx.drawImage(feed, 0, 0);
    ctx.fillStyle = `rgba(255,255,255,${.08 + .1 * Math.sin(s.dir * 3)})`; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }
  // Funken
  for (const p of SPARK) {
    const e = prog(k, 0, p.l); if (e >= 1) continue;
    const r = easeOut(e) * p.v * .5;
    ctx.fillStyle = `rgba(255,230,170,${1 - e})`;
    ctx.beginPath(); ctx.arc(IX + Math.cos(p.a) * r, IY + Math.sin(p.a) * r + e * e * 200, p.s * (1 - e), 0, 6.283); ctx.fill();
  }

  // STOPP.
  const s1 = prog(t, 1.0, 1.22);
  if (s1 > 0) {
    const sc = lerp(2.4, 1, easeOutBack(s1, 1.6)) * (1 + (t - 1) * .03);
    ctx.save(); ctx.globalAlpha = clamp(s1 * 3); ctx.translate(W / 2, 860); ctx.scale(sc, sc);
    goldText(ctx, 'STOPP.', 0, 80, fitSize(ctx, 'STOPP.', 940, 300, '"PF", serif', 900, 6), { glow: 1.6, spacing: 6 }); ctx.restore();
  }
  const s2 = prog(t, 1.45, 1.65);
  if (s2 > 0) {
    const fs = fitSize(ctx, 'NICHT WEITERWISCHEN.', 960, 92, COND, 600, 6);
    ctx.save(); ctx.globalAlpha = clamp(s2 * 2); ctx.translate(W / 2, 1110); const sc = lerp(1.4, 1, easeOutBack(s2, 2)); ctx.scale(sc, sc);
    ctx.font = `600 ${fs}px ${COND}`; ctx.letterSpacing = '6px'; ctx.textAlign = 'center';
    ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText('NICHT WEITERWISCHEN.', 0, 0);
    ctx.fillStyle = '#f6f1e6'; ctx.fillText('NICHT WEITERWISCHEN.', 0, 0); ctx.restore();
  }
  // Punch-in zum Ende
  const pin = easeIn(prog(t, 2.75, 3.2));
  if (pin > 0) { ctx.fillStyle = `rgba(0,0,0,${pin * .3})`; ctx.fillRect(0, 0, W, H); }
}

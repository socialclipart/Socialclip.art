// Hook 2 "Countdown-Bombe": 3-2-1 -> Explosion mit Geldregen -> DEIN MARKETING IST LANGWEILIG?
import { rng, prog, easeOut, easeOutBack, easeInOut, lerp, clamp, goldGrad, goldText, fitSize, COND, SERIF, GOLD } from '../lib.js';

export const TICKS = [.2, .9, 1.6], BOOM = 2.3;
const BX = 540, BY = 900, R = rng(3);
const DEBRIS = Array.from({ length: 70 }, () => ({ a: R() * 6.283, v: 700 + R() * 2200, s: 6 + R() * 18, r: R() * 6, gold: R() < .5 }));
const BILLS = Array.from({ length: 34 }, () => ({ a: -Math.PI / 2 + (R() - .5) * 2.6, v: 900 + R() * 1400, rot: R() * 6, rs: (R() - .5) * 8, fl: 4 + R() * 6, s: .8 + R() * .5 }));
const SPARKS = Array.from({ length: 40 }, () => ({ a: R() * 6.283, v: 60 + R() * 160, ph: R() }));

function bill(ctx, s) {
  const w = 170 * s, h = 84 * s;
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  g.addColorStop(0, '#36603a'); g.addColorStop(.5, '#5f8b4e'); g.addColorStop(1, '#2b4d2f');
  ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = 'rgba(232,206,130,.85)'; ctx.lineWidth = 3 * s; ctx.strokeRect(-w / 2 + 6 * s, -h / 2 + 6 * s, w - 12 * s, h - 12 * s);
  ctx.fillStyle = 'rgba(232,206,130,.9)'; ctx.beginPath(); ctx.arc(0, 0, h * .3, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#2b4d2f'; ctx.font = `600 ${h * .42}px ${COND}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('€', 0, h * .02);
}

function bomb(ctx, t, digit, alarm) {
  // Zündschnur + Funken
  ctx.save();
  ctx.strokeStyle = '#6b5636'; ctx.lineWidth = 16; ctx.lineCap = 'round';
  const burn = clamp(t / BOOM);
  const fx = lerp(160, 60, burn), fy = lerp(-430, -330, burn);
  ctx.beginPath(); ctx.moveTo(40, -290); ctx.quadraticCurveTo(140, -420, fx, fy); ctx.stroke();
  for (const p of SPARKS) {
    const e = (t * 3 + p.ph) % 1, r = e * p.v;
    ctx.fillStyle = `rgba(255,${200 - e * 120},80,${1 - e})`;
    ctx.beginPath(); ctx.arc(fx + Math.cos(p.a) * r, fy + Math.sin(p.a) * r, 5 * (1 - e) + 1, 0, 6.283); ctx.fill();
  }
  const fg = ctx.createRadialGradient(fx, fy, 2, fx, fy, 60); fg.addColorStop(0, 'rgba(255,240,180,1)'); fg.addColorStop(1, 'rgba(255,160,40,0)');
  ctx.fillStyle = fg; ctx.fillRect(fx - 60, fy - 60, 120, 120);
  // Kappe
  ctx.fillStyle = goldGrad(ctx, -70, -320, 70, -260); ctx.beginPath(); ctx.roundRect(-70, -320, 140, 70, 14); ctx.fill();
  // Kugel
  const g = ctx.createRadialGradient(-110, -120, 20, 0, 0, 330);
  g.addColorStop(0, '#5a5650'); g.addColorStop(.35, '#1d1b19'); g.addColorStop(1, '#050404');
  ctx.shadowColor = alarm ? 'rgba(255,40,40,.6)' : 'rgba(243,190,80,.35)'; ctx.shadowBlur = 80;
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 300, 0, 6.283); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = goldGrad(ctx, -300, -300, 300, 300); ctx.lineWidth = 6; ctx.stroke();
  // Display
  ctx.fillStyle = '#0a0303'; ctx.beginPath(); ctx.roundRect(-190, -40, 380, 170, 18); ctx.fill();
  ctx.strokeStyle = GOLD.c; ctx.lineWidth = 6; ctx.stroke();
  ctx.font = `600 140px ${COND}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '6px';
  ctx.fillStyle = 'rgba(255,40,40,.12)'; ctx.fillText('88:88', 0, 48);
  ctx.fillStyle = '#ff3030'; ctx.shadowColor = 'rgba(255,40,40,.9)'; ctx.shadowBlur = 30;
  ctx.fillText('00:0' + digit, 0, 48);
  ctx.restore();
}

export function draw(ctx, t, { W, H }) {
  const alarm = t > TICKS[0] && Math.floor((t - TICKS[0]) * 4) % 2 === 0;
  ctx.fillStyle = alarm && t < BOOM ? '#140404' : '#060403'; ctx.fillRect(-60, -60, W + 120, H + 120);
  if (t < BOOM) {
    const step = t < TICKS[1] ? 3 : t < TICKS[2] ? 2 : 1;
    const ti = TICKS[3 - step];
    const push = lerp(1.05, 1.4, easeInOut(prog(t, 0, BOOM)));
    const kick = 1 + (1 - easeOut(prog(t, ti, ti + .25))) * .06 * (t >= ti ? 1 : 0);
    ctx.save(); ctx.translate(BX, BY); ctx.scale(push * kick, push * kick);
    bomb(ctx, t, step, alarm); ctx.restore();
    // große Ziffer im Hintergrund
    if (t >= TICKS[0]) {
      const k = prog(t, ti, ti + .5);
      ctx.save(); ctx.globalAlpha = (1 - k) * .5; ctx.translate(BX, BY); ctx.scale(lerp(1, 2.4, easeOut(k)), lerp(1, 2.4, easeOut(k)));
      ctx.font = `900 520px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ff3030'; ctx.fillText(String(step), 0, 0);
      ctx.restore();
    }
    return;
  }
  const k = t - BOOM;
  // Feuerball
  const fb = easeOut(prog(k, 0, .5));
  const fr = lerp(80, 1100, fb), fa = 1 - prog(k, .15, .9);
  if (fa > 0) {
    const g = ctx.createRadialGradient(BX, BY, 0, BX, BY, fr);
    g.addColorStop(0, `rgba(255,250,220,${fa})`); g.addColorStop(.35, `rgba(255,190,70,${fa * .9})`);
    g.addColorStop(.7, `rgba(200,80,20,${fa * .6})`); g.addColorStop(1, 'rgba(60,20,5,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // Glut danach
  const ember = ctx.createRadialGradient(BX, BY, 50, BX, BY, 1100);
  ember.addColorStop(0, `rgba(240,170,70,${.35 * clamp(k * 3)})`); ember.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = ember; ctx.fillRect(0, 0, W, H);
  // Druckwelle
  const sw = prog(k, 0, .7);
  if (sw < 1) { ctx.strokeStyle = `rgba(255,236,190,${(1 - sw) * .8})`; ctx.lineWidth = 30 * (1 - sw) + 2; ctx.beginPath(); ctx.arc(BX, BY, lerp(100, 1500, easeOut(sw)), 0, 6.283); ctx.stroke(); }
  // Trümmer
  for (const d of DEBRIS) {
    const e = prog(k, 0, 1.1); if (e >= 1) continue;
    const r = easeOut(e) * d.v * .55;
    ctx.save(); ctx.globalAlpha = 1 - e; ctx.translate(BX + Math.cos(d.a) * r, BY + Math.sin(d.a) * r + e * e * 400); ctx.rotate(d.r + e * 10);
    ctx.fillStyle = d.gold ? GOLD.a : '#2a2622'; ctx.fillRect(-d.s / 2, -d.s / 3, d.s, d.s * .66); ctx.restore();
  }
  // Geld fliegt hoch und fällt
  for (const b of BILLS) {
    const tt = k * .9, x = BX + Math.cos(b.a) * b.v * tt * .7, y = BY + Math.sin(b.a) * b.v * tt + 900 * tt * tt;
    if (y > H + 200) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(b.rot + tt * b.rs); ctx.scale(Math.cos(tt * b.fl), 1); bill(ctx, b.s); ctx.restore();
  }
  // Text
  const t1 = prog(t, BOOM + .15, BOOM + .35), t2 = prog(t, BOOM + .45, BOOM + .65);
  if (t1 > 0) {
    const fs = fitSize(ctx, 'DEIN MARKETING', 960, 140, SERIF, 900, 3);
    ctx.save(); ctx.globalAlpha = clamp(t1 * 3); ctx.translate(W / 2, 820); const s = lerp(2, 1, easeOutBack(t1, 1.8)); ctx.scale(s, s);
    ctx.font = `900 ${fs}px ${SERIF}`; ctx.letterSpacing = '3px'; ctx.textAlign = 'center';
    ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText('DEIN MARKETING', 0, 0);
    ctx.fillStyle = '#f6f1e6'; ctx.fillText('DEIN MARKETING', 0, 0); ctx.restore();
  }
  if (t2 > 0) {
    const fs = fitSize(ctx, 'IST LANGWEILIG?', 980, 150, SERIF, 900, 3);
    ctx.save(); ctx.globalAlpha = clamp(t2 * 3); ctx.translate(W / 2, 1010); const s = lerp(2, 1, easeOutBack(t2, 1.8)); ctx.scale(s, s);
    ctx.font = `900 ${fs}px ${SERIF}`; ctx.letterSpacing = '3px'; ctx.textAlign = 'center';
    ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText('IST LANGWEILIG?', 0, 0);
    goldText(ctx, 'IST LANGWEILIG?', 0, 0, fs, { glow: 1.4, spacing: 3 }); ctx.restore();
  }
}

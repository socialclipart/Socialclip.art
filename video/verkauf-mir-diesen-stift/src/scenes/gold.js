import { EV } from '../beats.js';
import { rng, prog, easeOut, easeOutBack, easeInOut, lerp, clamp, goldText, fitSize, goldGrad, SERIF, COND, GOLD } from '../lib.js';

const R = rng(23);
const BILLS = Array.from({ length: 46 }, (_, i) => ({
  t0: EV.moneyStart + i * .045 + R() * .25, x: R() * 1080, sp: 520 + R() * 420,
  rot: R() * 6.28, rs: (R() - .5) * 4, fl: 3 + R() * 5, ph: R() * 6.28, drift: (R() - .5) * 160, s: .8 + R() * .45,
}));
// Kursverlauf: zufällig, aber am Ende steil nach oben
const PTS = (() => {
  const r = rng(4), p = []; let v = .18;
  for (let i = 0; i <= 40; i++) { const k = i / 40; v = clamp(v + (r() - .48) * .07 + Math.pow(k, 3) * .06, .05, .97); p.push(k < .55 ? v * .6 + .1 : v); }
  p[40] = .96; return p;
})();

function bill(ctx, s) {
  const w = 170 * s, h = 84 * s;
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  g.addColorStop(0, '#36603a'); g.addColorStop(.5, '#5f8b4e'); g.addColorStop(1, '#2b4d2f');
  ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = 'rgba(232,206,130,.85)'; ctx.lineWidth = 3 * s; ctx.strokeRect(-w / 2 + 6 * s, -h / 2 + 6 * s, w - 12 * s, h - 12 * s);
  ctx.fillStyle = 'rgba(232,206,130,.9)'; ctx.beginPath(); ctx.arc(0, 0, h * .3, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#2b4d2f'; ctx.font = `600 ${h * .42}px ${COND}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('€', 0, h * .02);
}

function word(ctx, str, x, y, size, t0, t, gold) {
  const k = prog(t, t0, t0 + .22); if (k <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(k * 2.5);
  const s = lerp(1.35, 1, easeOutBack(k, 1.8));
  ctx.translate(x, y); ctx.scale(s, s);
  if (gold) goldText(ctx, str, 0, 0, size, { glow: .9, spacing: 3, align: 'left' });
  else { ctx.font = `900 ${size}px ${SERIF}`; ctx.letterSpacing = '3px'; ctx.fillStyle = '#f6f1e6'; ctx.fillText(str, 0, 0); }
  ctx.restore();
}

export function draw(ctx, _, { W, H, t }) {
  const vis = prog(t, 19.3, 19.6) * (1 - prog(t, 25.75, 26.1));
  ctx.save(); ctx.globalAlpha = vis;

  // Chart (hinter dem Text)
  const ck = easeInOut(prog(t, EV.chartStart, EV.chartPeak));
  if (ck > 0) {
    const x0 = 90, x1 = 990, y0 = 1640, y1 = 1000;
    ctx.save(); ctx.globalAlpha = vis * clamp(ck * 3);
    ctx.strokeStyle = 'rgba(212,166,64,.13)'; ctx.lineWidth = 2;
    for (let i = 0; i <= 5; i++) { const y = lerp(y0, y1, i / 5); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
    const n = PTS.length - 1, upto = ck * n;
    const P = i => [lerp(x0, x1, i / n), lerp(y0, y1, PTS[Math.min(n, Math.floor(i))] + (PTS[Math.min(n, Math.ceil(i))] - PTS[Math.min(n, Math.floor(i))]) * (i % 1))];
    // Kerzen
    for (let i = 1; i <= Math.floor(upto); i++) {
      const [xa, ya] = P(i - 1), [xb, yb] = P(i), up = yb < ya;
      ctx.fillStyle = up ? 'rgba(212,166,64,.35)' : 'rgba(170,60,40,.35)';
      ctx.fillRect(xb - 7, Math.min(ya, yb), 14, Math.max(6, Math.abs(yb - ya)));
    }
    // Fläche + Linie
    ctx.beginPath(); ctx.moveTo(x0, y0);
    for (let i = 0; i <= upto; i += .25) ctx.lineTo(...P(i));
    const [hx, hy] = P(upto); ctx.lineTo(hx, hy); ctx.lineTo(hx, y0); ctx.closePath();
    const ag = ctx.createLinearGradient(0, y1, 0, y0); ag.addColorStop(0, 'rgba(243,210,122,.32)'); ag.addColorStop(1, 'rgba(243,210,122,0)');
    ctx.fillStyle = ag; ctx.fill();
    ctx.beginPath(); for (let i = 0; i <= upto; i += .25) ctx.lineTo(...P(i)); ctx.lineTo(hx, hy);
    ctx.strokeStyle = GOLD.a; ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(243,200,90,.8)'; ctx.shadowBlur = 24; ctx.stroke();
    ctx.fillStyle = GOLD.hi; ctx.beginPath(); ctx.arc(hx, hy, 14 + Math.sin(t * 12) * 3, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  // Text: rutscht nach oben, sobald der Chart startet
  const up = easeInOut(prog(t, EV.chartStart, EV.chartStart + .5));
  ctx.save(); ctx.translate(W / 2, 0); ctx.translate(0, lerp(0, -420, up)); ctx.scale(lerp(1, .8, up), lerp(1, .8, up)); ctx.translate(-W / 2, 0);
  const sB = fitSize(ctx, 'BEDÜRFNIS.', 920, 175, SERIF, 900, 3);
  const sP = fitSize(ctx, 'PRODUKT.', 920, 175, SERIF, 900, 3);
  ctx.font = `900 120px ${SERIF}`; ctx.letterSpacing = '3px';
  const wE = ctx.measureText('ERST ').width, wD = ctx.measureText('DANN ').width;
  const left = 80;
  word(ctx, 'ERST', left, 820, 120, EV.words[0], t, false);
  word(ctx, 'DAS', left + wE, 820, 120, EV.words[1], t, false);
  word(ctx, 'BEDÜRFNIS.', left, 820 + sB * 1.02, sB, EV.words[2], t, true);
  ctx.globalAlpha = vis * (t > EV.words[3] ? 1 : 0);
  word(ctx, 'DANN', left, 1270, 120, EV.words[3], t, false);
  word(ctx, 'DAS', left + wD, 1270, 120, EV.words[4], t, false);
  word(ctx, 'PRODUKT.', left, 1270 + sP * 1.02, sP, EV.words[5], t, true);
  ctx.restore();
  // Goldene Linie zwischen den Blöcken
  const lk = easeOut(prog(t, EV.words[3] - .2, EV.words[3] + .2)) * (1 - up);
  if (lk > 0) { ctx.fillStyle = goldGrad(ctx, 80, 0, 1000, 0); ctx.fillRect(80, 1120, 920 * lk, 4); }

  // Geldregen
  for (const b of BILLS) {
    const dt = t - b.t0; if (dt < 0) continue;
    const y = -120 + dt * b.sp; if (y > H + 150) continue;
    ctx.save(); ctx.globalAlpha = vis * .95;
    ctx.translate(b.x + Math.sin(dt * 2 + b.ph) * 60 + b.drift * dt, y);
    ctx.rotate(b.rot + dt * b.rs); ctx.scale(Math.cos(dt * b.fl + b.ph), 1);
    bill(ctx, b.s); ctx.restore();
  }
  ctx.restore();
}

import { EV } from '../beats.js';
import { prog, easeOut, easeOutBack, lerp, clamp, fitSize, goldText, SERIF, COND, RED } from '../lib.js';

// Billige Werbe-Sticker – absichtlich "falsch" im Look.
const ST = [
  { txt: 'SUPER TINTE!', y: 760,  rot: -.06, bg: '#ffd400', fg: '#111', burst: false },
  { txt: 'TOLLER CLIP!', y: 975,  rot: .05,  bg: '#ff3d3d', fg: '#fff', burst: false },
  { txt: 'NUR 2 €!',     y: 1205, rot: -.04, bg: '#ffd400', fg: '#c40000', burst: true },
];

function burst(ctx, R, n = 18) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = i / (n * 2) * Math.PI * 2, r = i % 2 ? R * .82 : R;
    ctx.lineTo(Math.cos(a) * r * 1.35, Math.sin(a) * r * .78);
  }
  ctx.closePath();
}

export function draw(ctx, _, { W, t }) {
  ST.forEach((s, i) => {
    const t0 = EV.stamp[i];
    if (t < t0) return;
    const k = prog(t, t0, t0 + .2);
    const sc = lerp(1.7, 1, easeOutBack(k, 2.2));
    // Herunterfallen nach "Falsch."
    const fk = clamp((t - EV.stickersFall - i * .07) / .7);
    const dy = fk * fk * 1400, dr = fk * (i % 2 ? .9 : -.8);
    ctx.save();
    ctx.globalAlpha = clamp(k * 3) * (1 - clamp(fk * 1.4 - .4));
    ctx.translate(W / 2 + (i - 1) * 30 * fk, s.y + dy); ctx.rotate(s.rot + dr); ctx.scale(sc, sc);
    ctx.font = `600 120px ${COND}`; ctx.letterSpacing = '2px';
    const w = ctx.measureText(s.txt).width;
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
    ctx.fillStyle = s.bg;
    if (s.burst) { burst(ctx, w * .5); ctx.fill(); }
    else { ctx.beginPath(); ctx.roundRect(-w / 2 - 44, -88, w + 88, 168, 14); ctx.fill(); }
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = s.fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s.txt, 0, 6);
    // Roter Strich
    const sk = easeOut(prog(t, EV.strike[i], EV.strike[i] + .12));
    if (sk > 0) {
      const x0 = -w / 2 - 70, x1 = w / 2 + 70;
      ctx.strokeStyle = RED; ctx.lineWidth = 22; ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(x0, 26); ctx.lineTo(lerp(x0, x1, sk), lerp(26, -22, sk)); ctx.stroke();
    }
    ctx.restore();
  });

  // "NIEMAND KAUFT EIGENSCHAFTEN."
  const n = prog(t, EV.niemand, EV.niemand + .35);
  const nOut = 1 - prog(t, 10.55, 10.9);
  if (n > 0 && nOut > 0) {
    const s1 = fitSize(ctx, 'NIEMAND KAUFT', 900, 130, SERIF, 900, 2);
    const s2 = fitSize(ctx, 'EIGENSCHAFTEN.', 940, 130, SERIF, 900, 2);
    const e = easeOut(n);
    ctx.save(); ctx.globalAlpha = e * nOut;
    ctx.translate(W / 2, 980); ctx.scale(lerp(1.15, 1, e), lerp(1.15, 1, e));
    ctx.font = `900 ${s1}px ${SERIF}`; ctx.letterSpacing = '2px'; ctx.textAlign = 'center'; ctx.fillStyle = '#f6f1e6';
    ctx.fillText('NIEMAND KAUFT', 0, -20);
    ctx.restore();
    const e2 = easeOut(prog(t, EV.niemand + .55, EV.niemand + .9));
    ctx.save(); ctx.globalAlpha = e2 * nOut;
    goldText(ctx, 'EIGENSCHAFTEN.', W / 2, 980 + s2 * 1.1 + (1 - e2) * 30, s2, { glow: 1, spacing: 2 });
    ctx.restore();
  }
}

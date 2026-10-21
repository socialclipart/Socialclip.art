// 2C — Bühne: five spotlights on the intro, lasers on the bass
import * as F from './fx.js';
const {ctx, seg, lerp, eo3, eo5, pulse, text, rr, symbol, BRAND} = F;
const A = await F.loadAudio('s2'), g = F.G.s2;
const SX = [140, 340, 540, 740, 940];
function spot(x, a, col = '255,240,215') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createLinearGradient(0, 0, 0, 1500); gr.addColorStop(0, `rgba(${col},${.32 * a})`); gr.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - 30, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(540 + (x - 540) * .25 + 260, 1450); ctx.lineTo(540 + (x - 540) * .25 - 260, 1450); ctx.closePath(); ctx.fill();
  const pool = ctx.createRadialGradient(540 + (x - 540) * .25, 1450, 10, 540 + (x - 540) * .25, 1450, 300); pool.addColorStop(0, `rgba(${col},${.3 * a})`); pool.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = pool; ctx.fillRect(0, 1200, 1080, 500); ctx.restore(); }
function laser(x0, ang, a, col) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x0, 1700); ctx.rotate(ang); ctx.strokeStyle = `rgba(${col},${a})`; ctx.shadowColor = `rgb(${col})`; ctx.shadowBlur = 25; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -2600); ctx.stroke(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.stroke(); ctx.restore(); }
export function frame(t) {
  const lo = F.env(A, 'low', t), bp = F.hitP(t, g.bass, .2), pre = t < g.drop;
  F.begin('#040404');
  // smoke
  ctx.save(); ctx.globalAlpha = .5; F.blobs(t * .4, ['#1c1a22', '#14121a', '#201c18'], 0, .9); ctx.restore();
  ctx.save(); F.cam(pre ? 1.0 : 1 + .04 * bp + .04 * seg(t, g.drop, 9.5));
  SX.forEach((x, i) => { const on = t >= g.intro[i] ? (t < g.intro[i] + .06 ? .5 : 1) : 0; spot(x, on * (pre ? 1 : .55 + .45 * lo)); });
  // stage + product
  ctx.fillStyle = '#0d0c0b'; ctx.fillRect(0, 1450, 1080, 470); ctx.fillStyle = '#1b1916'; ctx.beginPath(); ctx.ellipse(540, 1450, 330, 60, 0, 0, 7); ctx.fill();
  const rev = eo5(seg(t, g.drop, g.drop + .35)), rise = lerp(400, 0, rev);
  ctx.save(); ctx.translate(0, rise); ctx.globalAlpha = rev;
  rr(ctx, 360, 860, 360, 560, 40); const bx = ctx.createLinearGradient(360, 860, 720, 1420); bx.addColorStop(0, '#2a2520'); bx.addColorStop(.5, '#121110'); bx.addColorStop(1, '#2a2520'); ctx.fillStyle = bx; ctx.fill(); ctx.strokeStyle = '#e6d0ad'; ctx.lineWidth = 3; ctx.stroke();
  symbol(ctx, 540, 1080, 190 * (1 + .05 * bp), '#e6d0ad'); text(ctx, 'DEIN PRODUKT', 540, 1330, {size: 30, weight: 800, ls: 8, color: '#e6d0ad'});
  ctx.restore(); ctx.restore();
  if (!pre) {
    const cols = ['255,45,85', '61,245,255', '230,208,173'];
    for (let i = 0; i < 6; i++) { const ang = Math.sin(t * (1.2 + i * .3) + i) * .7 + (i - 2.5) * .12; laser(i < 3 ? 120 : 960, ang, .25 + .6 * bp, cols[i % 3]); }
    F.glint(650, 900 + lerp(400, 0, eo5(seg(t, g.drop, g.drop + .35))), 1.2, F.hitP(t, [3.988, 5.432, 7.966], .5));
    F.burst(540, 1150, g.drop, t, {n: 140, v: 1800, size: 6, cols: ['#e6d0ad', '#fff'], life: 1.2, grav: 500});
  }
  { const tg = ctx.createLinearGradient(0, 0, 0, 520); tg.addColorStop(0, 'rgba(0,0,0,.85)'); tg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = tg; ctx.fillRect(0, 0, 1080, 520); }
  const lines = pre ? [['Licht aus.', 0, 1.9]] : [['Dein Produkt', g.drop, 9.6], ['verdient eine Bühne.', g.drop + .2, 9.6]];
  lines.forEach(([s, a, b], i) => text(ctx, s, 540, 260 + i * 100, {size: i ? 80 : 66, weight: i ? 900 : 800, color: i ? '#e6d0ad' : '#fff', alpha: seg(t, a, a + .15) * (1 - seg(t, b - .1, b))}));
  if (t > 7.966) text(ctx, 'PRODUKT-CONTENT · SOCIALCLIP.ART', 540, 1560, {size: 28, weight: 700, ls: 6, color: '#e6d0ad', alpha: seg(t, 7.966, 8.2)});
  F.bloom(F.out, .5 + .4 * lo, 9); F.rgbSplit(4 * bp);
  F.flash(t, g.drop, .25, '255,250,240', .9); F.finish(t, .06, .55); F.handle(false);
}

// 3E — Checkliste: "Deine Marke braucht:" items ticking on the groove
import * as F from './fx.js';
const {ctx, seg, lerp, eo3, eo5, eio, back, pulse, text, rr, BRAND} = F;
const A = await F.loadAudio('s3'), g = F.G.s3;
const ITEMS = ['Logo', 'Farben', 'Schrift', 'Visitenkarten', 'Flyer', 'Website', 'Instagram', 'Reels', 'KI-Assistent', 'Strategie'];
export function frame(t) {
  const lo = F.env(A, 'low', t);
  if (t < g.swell) { F.begin('#121212'); const i = F.idx(t, g.hits), w = ['DEINE', 'MARKE', 'BRAUCHT:'];
    ctx.save(); F.shake(t, F.hitP(t, g.hits, .2) * .6); for (let k = 0; k <= i; k++) F.slam(w[k], 540, 620 + k * 340, g.hits[k], t, {color: k === 2 ? '#e6d0ad' : '#f4f1ea', w: 950, max: 300}); ctx.restore();
    F.rgbSplit(10 * F.hitP(t, g.hits, .15)); F.finish(t, .05, .4); F.handle(false); return; }
  if (t < g.g0) { const sp = F.hitP(t, g.sub, .2); F.begin('#0f0f10'); F.bgFill(`rgba(230,208,173,${.12 + .1 * sp})`, '#060606', 540, 960, 1000); F.rings(540, 960, t, sp * .6, '230,208,173', 4);
    text(ctx, 'mehr als', 540, 900, {size: 80, weight: 800, color: '#f4f1ea', alpha: seg(t, 1.7, 2.0) * (1 - seg(t, 5.6, 5.9))}); text(ctx, 'ein Logo.', 540, 1050, {size: 150, weight: 900, color: '#e6d0ad', alpha: seg(t, 2.6, 2.9) * (1 - seg(t, 5.6, 5.9)), scale: lerp(1.1, 1, eo5(seg(t, 2.6, 3.2)))});
    F.bloom(F.out, .25 + .3 * sp, 8); F.finish(t, .05, .45); F.handle(false); return; }
  if (t > 15.71) { F.begin('#e6d0ad'); F.burst(540, 900, 15.71, t, {n: 200, v: 2500, size: 10, rect: true, cols: ['#121212', '#f4f1ea', '#b4532a'], add: false, life: 1.2, grav: 1200});
    text(ctx, 'Alles aus', 540, 820, {size: 120, weight: 900, color: '#121212'}); text(ctx, 'einer Hand.', 540, 960, {size: 120, weight: 900, color: '#121212'}); F.endTag(t, 15.8, false, 1380); F.finish(t, .04, .1); return; }
  const k = F.idx(t, g.beats), bp = pulse(t, g.beats[k], .3), n = Math.floor(k / 2); // one item per 2 beats
  F.begin('#f4f1ea'); F.grid(.05, 90, '0,0,0', 0);
  const listY = 330, step = 118, scroll = Math.max(0, n - 8) * step;
  ctx.save(); ctx.translate(0, -scroll * eo5(seg(t, g.beats[k], g.beats[k] + .2)));
  text(ctx, 'Checkliste Marke', 120, 250, {size: 54, weight: 900, color: '#121212', align: 'left'});
  ITEMS.forEach((it, i) => { const t0 = g.beats[i * 2] ?? 99, chk = g.beats[i * 2 + 1] ?? 99, u = eo5(seg(t, t0, t0 + .15)), c = seg(t, chk, chk + .12); if (u <= 0) return; const y = listY + i * step;
    ctx.save(); ctx.globalAlpha = u; ctx.translate(lerp(-200, 0, u), 0);
    rr(ctx, 120, y, 84, 84, 18); ctx.lineWidth = 6; ctx.strokeStyle = '#121212'; ctx.stroke(); if (c > 0) { ctx.fillStyle = '#121212'; rr(ctx, 120, y, 84, 84, 18); ctx.fill(); ctx.strokeStyle = '#e6d0ad'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(140, y + 44); ctx.lineTo(lerp(140, 158, Math.min(1, c * 2)), lerp(y + 44, y + 64, Math.min(1, c * 2))); if (c > .5) ctx.lineTo(lerp(158, 186, (c - .5) * 2), lerp(y + 64, y + 22, (c - .5) * 2)); ctx.stroke(); }
    text(ctx, it, 240, y + 64, {size: 64, weight: 800, color: '#121212', align: 'left'});
    if (c > 0) { ctx.fillStyle = '#121212'; ctx.fillRect(240, y + 42, (measureW(it)) * eo3(c), 6); }
    ctx.restore();
    F.burst(162, y + 42 - scroll, chk, t, {n: 26, v: 700, size: 7, rect: true, cols: ['#e6d0ad', '#b4532a', '#121212'], add: false, life: .6, seed: i + 3, grav: 600});
  });
  ctx.restore();
  rr(ctx, 120, 1620, 840, 110, 55); ctx.fillStyle = '#121212'; ctx.fill(); text(ctx, `${Math.min(10, Math.max(0, Math.floor((k + 1) / 2)))} / 10 erledigt`, 540, 1693, {size: 44, weight: 800, color: '#e6d0ad'});
  F.rgbSplit(4 * bp); F.finish(t, .035, .12); F.handle(true, 1800);
}
function measureW(s) { return F.measure(ctx, s, {size: 64, weight: 800}); }

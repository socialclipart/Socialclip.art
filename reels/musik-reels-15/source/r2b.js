// 2B — Glitch-Brand: "Stop scrolling"
import * as F from './fx.js';
const {ctx, seg, lerp, eo5, pulse, text, symbol, BRAND} = F;
const A = await F.loadAudio('s2'), g = F.G.s2;
const WORDS = [['STOP', '#ff2d55'], ['SCROLLING.', '#f4f1ea'], ['SCHAU', '#3df5ff'], ['HIN.', '#f4f1ea'], ['DAS', '#e6d0ad'], ['IST', '#f4f1ea'], ['DEINE', '#ff2d55'], ['MARKE.', '#3df5ff'], ['LAUT.', '#f4f1ea'], ['KLAR.', '#e6d0ad'], ['ANDERS.', '#ff2d55'], ['SOCIALCLIP', '#f4f1ea'], ['SOCIALCLIP', '#f4f1ea'], ['SOCIALCLIP', '#f4f1ea'], ['SOCIALCLIP', '#f4f1ea'], ['SOCIALCLIP', '#f4f1ea']];
export function frame(t) {
  const lo = F.env(A, 'low', t), bp = F.hitP(t, g.bass, .18), ip = F.hitP(t, g.intro, .16), pre = t < g.drop;
  F.begin('#060608');
  if (pre) {
    const i = F.idx(t, g.intro); const on = ip > .2;
    if (on) { ctx.save(); F.cam(1 + .2 * ip); text(ctx, ['SO', 'CIAL', 'CLIP', 'DE', 'SIGN'][i] || '', 540 + (i % 2 ? 140 : -140), 900 + (i - 2) * 160, {font: 'Anton', size: 320, color: i % 2 ? '#ff2d55' : '#3df5ff'}); ctx.restore(); }
    F.scanlines(.18); F.glitch(t, ip * 1.2, 7); F.rgbSplit(30 * ip);
    text(ctx, 'NO SIGNAL', 540, 1750, {size: 30, weight: 700, ls: 12, color: '#555', alpha: on ? 0 : .8});
    F.finish(t, .08, .6); F.handle(false); return;
  }
  // VHS world
  F.grid(.07 + .1 * bp, 120, '61,245,255', (t * 300) % 120);
  F.leaks(t, .2 + .2 * lo, ['255,45,85', '61,245,255', '138,92,255']);
  const k = Math.max(0, F.idx(t, g.beats)), [w, c] = WORDS[Math.min(k, WORDS.length - 1)];
  ctx.save(); F.cam(1 + .08 * bp, (k % 2 ? .02 : -.02) * bp);
  if (k < 11) { F.slam(w, 540, 1000, g.beats[k], t, {color: c, w: 980, from: 1.8, shadow: c, blur: 30}); }
  else { symbol(ctx, 540, 860, 360 * (1 + .1 * bp), '#f4f1ea'); F.slam('SOCIALCLIP', 540, 1240, g.beats[11], t, {color: '#f4f1ea', w: 860, from: 2}); text(ctx, 'Content, der stoppt.', 540, 1420, {size: 54, weight: 800, color: '#3df5ff', alpha: seg(t, g.beats[11] + .2, g.beats[11] + .4)}); }
  ctx.restore();
  // REC / timecode overlay
  text(ctx, '● REC', 90, 150, {size: 40, weight: 800, color: '#ff2d55', align: 'left', alpha: Math.floor(t * 2) % 2 ? 1 : .3});
  text(ctx, `00:00:0${Math.floor(t)}:${String(Math.floor((t % 1) * 30)).padStart(2, '0')}`, 990, 150, {size: 40, weight: 700, color: '#fff', align: 'right'});
  F.scanlines(.14); F.glitch(t, bp * .8 + (F.since(t, g.beats) < .06 ? .6 : 0), 11); F.rgbSplit(6 + 22 * bp);
  F.flash(t, g.drop, .2, '255,255,255', 1); F.finish(t, .08, .55); F.handle(false);
}

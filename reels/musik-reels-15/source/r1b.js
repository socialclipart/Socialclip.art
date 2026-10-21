// 1B — Countdown on the build, word slams on the kicks
import * as F from './fx.js';
const {ctx, seg, lerp, eo5, pulse, text, BRAND} = F;
const A = await F.loadAudio('s1'), g = F.G.s1;
const COLS = ['#ff3b30', '#ffcc00', '#34c759', '#0a84ff', '#bf5af2', '#ff9f0a', '#f4f1ea'];
const KW = [['MEHR', '#f4f1ea', '#121212'], ['KLICKS.', '#121212', '#e6d0ad'], ['MEHR', '#e6d0ad', '#121212'], ['KUNDEN.', '#121212', '#f4f1ea'], ['MEHR', '#ff3b30', '#121212'], ['MARKE.', '#121212', '#ff3b30'], ['WENIGER', '#f4f1ea', '#121212'], ['WORDART.', '#121212', '#f4f1ea']];
export function frame(t) {
  if (t < g.drop) {
    const i = F.idx(t, g.build), hp = F.hitP(t, g.build, .2), tens = seg(t, 0, g.gap), n = g.build.length - Math.max(0, i);
    const bg = i % 2 ? '#0b0b0d' : '#141418'; F.begin(bg);
    ctx.save(); F.cam(1 + .25 * tens + .06 * hp, i * .07);
    F.rays(540, 960, t * (1 + 4 * tens), '255,255,255', .05 + .1 * tens, 24, .6);
    F.tunnel(t, .4 + tens * 2.5, '255,255,255', .25 + .3 * tens, 14, 540, 960, .6);
    ctx.restore();
    if (t < g.gap && i >= 0) { const c = COLS[i % COLS.length]; ctx.save(); F.cam(1 + .3 * hp); F.shake(t, hp * tens);
      text(ctx, String(n), 540, 1180, {font: 'Anton', size: 640, color: c, shadow: c, blur: 60 * hp, scale: lerp(1.5, 1, eo5(seg(t, g.build[i], g.build[i] + .1)))}); ctx.restore(); }
    text(ctx, 'NOCH', 540, 420, {size: 50, weight: 800, ls: 18, color: '#fff', alpha: t < g.gap ? .8 : 0});
    F.speedLines(540, 960, t, tens * .9);
    F.rgbSplit(2 + 18 * hp * tens * tens);
    if (t > 5.0) F.glitch(t, hp * .8, 2);
    if (t >= g.gap) F.begin('#000');
    F.finish(t, .05, .55); F.handle(false); return;
  }
  const k = F.idx(t, g.kicks), kp = pulse(t, g.kicks[k], .3), lt = t - g.kicks[k];
  if (k === 0) { // JETZT.
    F.begin('#f4f1ea'); ctx.save(); F.cam(1 + .1 * kp); F.slam('JETZT.', 540, 960, g.drop, t, {color: '#121212', w: 1000, from: 2.4}); ctx.restore();
    F.burst(540, 960, g.drop, t, {n: 220, v: 2600, size: 10, rect: true, cols: COLS, life: 1.4, grav: 900, add: false});
    F.flash(t, g.drop, .22, '255,255,255', 1); F.finish(t, .04, .2); F.handle(true); return;
  }
  if (k >= 9) { F.begin('#121212'); F.bgFill('#2a241c', '#080706'); F.rays(540, 900, t, '230,208,173', .1 + .1 * kp, 20, .3); F.slam('socialclip.art', 540, 1500, g.kicks[9], t, {font: 'Inter', weight: 900, color: '#e6d0ad', w: 760}); F.endTag(t, g.kicks[9], true, 1100); F.flash(t, g.kicks[k], .1, '255,255,255', .3); F.finish(t, .05, .4); return; }
  const [w, bg, ink] = KW[k - 1]; F.begin(bg);
  ctx.save(); F.cam(1 + .12 * kp + .04 * lt, (k % 2 ? .04 : -.04) * kp);
  F.grid(.08, 90, ink === '#121212' ? '0,0,0' : '255,255,255', lt * 200);
  F.slam(w, 540, 960, g.kicks[k], t, {color: ink, w: 1010, from: 2.0});
  // stacked echo copies above/below
  for (const dy of [-1, 1]) F.slam(w, 540, 960 + dy * 420, g.kicks[k], t, {color: ink, w: 1010, from: 2.0, alpha: .12});
  ctx.restore();
  F.burst(540, 960, g.kicks[k], t, {n: 50, v: 1500, size: 8, rect: true, cols: COLS, life: .5, seed: k, add: false});
  F.rgbSplit(14 * kp); F.zoomBlur(kp);
  F.finish(t, .04, .25); F.handle(ink === '#121212');
}

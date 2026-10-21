// 2A — Bass visualizer around the SocialClip symbol
import * as F from './fx.js';
const {ctx, seg, lerp, eo5, pulse, text, symbol, BRAND} = F;
const A = await F.loadAudio('s2'), g = F.G.s2;
const WORDS = ['SOUND.', 'BILD.', 'MOTION.', 'LICHT.', 'STORY.', 'MARKE.', 'REICHWEITE.', 'WIRKUNG.', 'SOCIALCLIP.'];
export function frame(t) {
  const lo = F.env(A, 'low', t), mi = F.env(A, 'mid', t), hi = F.env(A, 'high', t), pre = t < g.drop;
  F.begin('#070708'); F.bgFill(`rgba(80,62,40,${.25 + .5 * lo})`, '#030303', 540, 960, 1100);
  const bp = F.hitP(t, g.bass, .2), ip = F.hitP(t, g.intro, .25);
  ctx.save(); F.cam(1 + .05 * bp + (pre ? .03 * ip : 0)); F.shake(t, bp * .25);
  if (!pre) { F.rays(540, 960, t, '230,208,173', .06 + .12 * lo, 24, .3); F.rings(540, 960, t, lo, '230,208,173', 4); }
  // radial bars from the real spectrum envelope
  const N = 96; ctx.save(); ctx.translate(540, 960); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < N; i++) {
    const a = i / N * 6.283 - Math.PI / 2, band = i % 3 === 0 ? lo : i % 3 === 1 ? mi : hi;
    const v = pre ? (ip * (Math.sin(i * 1.7 + t * 9) * .5 + .5)) : band * (.6 + .4 * Math.sin(i * .9 + t * 7));
    const r0 = 215, len = 20 + 250 * Math.pow(v, 1.6); ctx.strokeStyle = i % 2 ? `rgba(230,208,173,${.5 + .5 * v})` : `rgba(244,241,234,${.4 + .6 * v})`; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * (r0 + len), Math.sin(a) * (r0 + len)); ctx.stroke();
  }
  ctx.restore();
  symbol(ctx, 540, 960, (pre ? lerp(.0, 220, eo5(seg(t, g.intro[0], g.intro[4] + .3))) : 240) * (1 + .1 * bp + .06 * lo), BRAND.cream);
  ctx.restore();
  F.burst(540, 960, g.drop, t, {n: 180, v: 2400, size: 6, cols: ['#e6d0ad', '#fff'], life: 1.3});
  F.shock(540, 960, g.drop, t, '230,208,173', 1300, .6, 20);
  for (const b of g.beats) F.shock(540, 960, b, t, '244,241,234', 700, .35, 6);
  if (pre) text(ctx, ['', 'Hör', 'Hör mal', 'Hör mal hin', 'Hör mal hin …', 'Hör mal hin …'][F.idx(t, g.intro) + 1] || '', 540, 330, {size: 72, weight: 800, color: '#fff'});
  else {
    text(ctx, 'Content, der', 540, 260, {size: 60, weight: 800, color: '#fff', alpha: seg(t, g.drop, g.drop + .2)});
    text(ctx, 'hängen bleibt.', 540, 350, {size: 84, weight: 900, color: '#e6d0ad', alpha: seg(t, g.drop + .1, g.drop + .3)});
    const k = F.idx(t, g.beats); if (k >= 0) F.slam(WORDS[k % WORDS.length], 540, 1490, g.beats[k], t, {color: '#f4f1ea', w: 900, max: 170});
  }
  F.bloom(F.out, .4 + .5 * lo, 8); F.rgbSplit(2 + 10 * bp * hi);
  F.flash(t, g.drop, .25, '255,248,236', 1); F.finish(t, .05, .5); F.handle(false);
}

// 2E — Liquid gradient + mask-wipe slogans on the beats
import * as F from './fx.js';
const {ctx, seg, lerp, eo5, pulse, text, BRAND} = F;
const A = await F.loadAudio('s2'), g = F.G.s2;
const PALS = [['#ff6a3d', '#ffd23f', '#ee4266'], ['#3a86ff', '#8338ec', '#ff006e'], ['#06d6a0', '#118ab2', '#ffd166'], ['#e6d0ad', '#8a6a3f', '#f4f1ea'], ['#ff4d6d', '#c9184a', '#ffb3c1']];
const SLO = ['Mutig.', 'Klar.', 'Anders.', 'Schön.', 'Laut.', 'Echt.', 'Smart.', 'Unvergesslich.', 'Deine Marke.', 'Deine Marke.', 'Deine Marke.', 'Deine Marke.', 'Deine Marke.', 'Deine Marke.', 'Deine Marke.', 'Deine Marke.'];
export function frame(t) {
  const lo = F.env(A, 'low', t), bp = F.hitP(t, g.bass, .2), pre = t < g.drop;
  const k = pre ? -1 : F.idx(t, g.beats), pal = PALS[pre ? 0 : Math.floor(Math.max(0, k) / 2) % PALS.length];
  F.begin('#0b0b0f');
  const nb = pre ? Math.max(0, F.idx(t, g.intro) + 1) : 3;
  ctx.save(); F.cam(1 + .08 * bp); F.blobs(t * (pre ? .6 : 1.4), pal.slice(0, Math.min(3, nb)), pre ? F.hitP(t, g.intro, .3) : lo * 1.2, .95); ctx.restore();
  // grain texture over the gradient
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(0, 0, 1080, 1920);
  if (pre) { const i = F.idx(t, g.intro); if (i >= 0) F.wipeText(['Dein', 'Logo', 'braucht', 'mehr', 'als …'][i], 540, 1010, g.intro[i], t, {size: 170, color: '#fff'}); }
  else {
    const w = SLO[Math.min(k, SLO.length - 1)], big = k >= 8;
    ctx.save(); F.cam(1 + .05 * bp); F.wipeText(w, 540, 1010, g.beats[Math.min(k, 8)], t, {size: big ? 150 : 210, color: '#fff', dur: .2}); ctx.restore();
    if (big) { text(ctx, 'Branding mit Gefühl.', 540, 1180, {size: 56, weight: 700, color: '#fff', alpha: seg(t, g.beats[8] + .2, g.beats[8] + .4)}); F.endTag(t, g.beats[9] + .1, true, 1560); }
    for (let i = 0; i < 12; i++) { const y = ((i * 167 + t * 600) % 2100) - 100; ctx.fillStyle = `rgba(255,255,255,${.06 + .1 * bp})`; ctx.fillRect(0, y, 1080, 3); }
  }
  F.bloom(F.out, .3 + .3 * lo, 10); F.rgbSplit(3 + 8 * bp);
  F.flash(t, g.drop, .22, '255,255,255', .9); F.finish(t, .06, .3); if (!(k >= 9)) F.handle(false);
}

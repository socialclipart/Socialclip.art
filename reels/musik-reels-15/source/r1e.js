// 1E — Typo-Tunnel: words fly at you through a tunnel, then break through into light
import * as F from './fx.js';
const {ctx, seg, lerp, eo3, eo5, ei3, pulse, text, BRAND} = F;
const A = await F.loadAudio('s1'), g = F.G.s1;
const WORDS = ['Idee', 'Skizze', 'Farbe', 'Form', 'Schrift', 'Raster', 'Logo', 'Layout', 'Feed', 'Reel', 'Text', 'Licht', 'Motion', 'Schnitt', 'Story', 'Web', 'Ads', 'Fokus', 'Mut', 'Gleich', 'Jetzt'];
const KW = [['SICHTBAR.', '#f4f1ea', '#121212'], ['ANDERS.', '#121212', '#e6d0ad'], ['LAUT.', '#e6d0ad', '#121212'], ['ECHT.', '#121212', '#f4f1ea'], ['DEINS.', '#f4f1ea', '#121212'], ['MARKE.', '#121212', '#e6d0ad'], ['MOTION.', '#e6d0ad', '#121212'], ['DESIGN.', '#121212', '#f4f1ea']];
export function frame(t) {
  if (t < g.drop) {
    const tens = seg(t, 0, g.gap), hp = F.hitP(t, g.build, .2); F.begin('#050507');
    F.tunnel(t, .25 + 1.6 * tens * tens, '230,208,173', .35 + .4 * hp, 22, 540, 960, .4 * tens);
    F.speedLines(540, 960, t, .3 + .7 * tens, '255,255,255', 90);
    g.build.forEach((b, i) => { const u = seg(t, b, b + .55); if (u <= 0 || u >= 1) return; const z = Math.pow(u, 2.2);
      text(ctx, WORDS[i], 540 + Math.sin(i * 2.3) * 300 * z, 960 + Math.cos(i * 1.7) * 500 * z, {size: 40 + 900 * z, weight: 900, ls: -2, color: '#fff', alpha: Math.min(1, (1 - u) * 3) * Math.min(1, u * 6)}); });
    const core = seg(t, 4.5, g.drop); if (core > 0) { const gr = ctx.createRadialGradient(540, 960, 0, 540, 960, 50 + 900 * ei3(core)); gr.addColorStop(0, `rgba(255,255,255,${core})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, 1080, 1920); }
    F.rgbSplit(3 + 14 * hp * tens); F.zoomBlur(tens * 1.5 + hp); if (t >= g.gap) F.begin('#fff');
    F.finish(t, .05, .5); F.handle(false); return;
  }
  const k = F.idx(t, g.kicks), kp = pulse(t, g.kicks[k], .3), lt = t - g.kicks[k];
  if (k === 0) { F.begin('#ffffff'); F.leaks(t, .5); F.slam('BOOM.', 540, 960, g.drop, t, {color: '#121212', w: 960, from: .3}); F.burst(540, 960, g.drop, t, {n: 200, v: 2600, size: 6, cols: ['#e6d0ad', '#121212'], add: false, life: 1}); F.finish(t, .03, .1); F.handle(true); return; }
  if (k >= 9) { F.begin('#121212'); F.tunnel(t, .3, '230,208,173', .2, 14); F.endTag(t, g.kicks[9], true, 1100); text(ctx, 'Motion & Design aus Erlangen', 540, 1350, {size: 40, weight: 700, color: '#e6d0ad', alpha: seg(t, g.kicks[9] + .1, g.kicks[9] + .3)}); F.flash(t, g.kicks[k], .1, '255,255,255', .4); F.finish(t, .05, .4); return; }
  const [w, bg, ink] = KW[k - 1]; F.begin(bg);
  const tc = ink === '#121212' ? '18,18,18' : '244,241,234';
  F.tunnel(t, .5, tc, .25, 12, 540, 960, k % 2 ? .3 : -.3);
  ctx.save(); F.cam(1 + .15 * kp + .06 * lt, 0); F.echo(tt => F.slam(w, 540, 960, g.kicks[k], tt, {color: ink, w: 1000, from: 3}), t, 4, .025); ctx.restore();
  F.speedLines(540, 960, t, kp, tc, 60, k);
  F.rgbSplit(12 * kp); F.zoomBlur(kp * 1.4); F.finish(t, .04, .3); F.handle(ink === '#121212');
}

// 3B — Manifest: kinetic statements on the groove
import * as F from './fx.js';
const {ctx, seg, lerp, eo5, eio, pulse, text, BRAND} = F;
const A = await F.loadAudio('s3'), g = F.G.s3;
const LINES = [['KEINE', 'VORLAGEN.'], ['KEIN', '08/15.'], ['KEIN', 'BLABLA.'], ['NUR', 'IDEEN.'], ['NUR', 'MUT.'], ['NUR', 'WIRKUNG.'], ['DESIGN,', 'DAS'], ['HÄNGEN', 'BLEIBT.'], ['SOCIAL', 'CLIP.'], ['SOCIAL', 'CLIP.'], ['SOCIAL', 'CLIP.']];
const BGS = ['#121212', '#f4f1ea', '#e8573a', '#121212', '#e6d0ad', '#f4f1ea', '#121212', '#e6d0ad', '#121212', '#121212', '#121212'];
export function frame(t) {
  const lo = F.env(A, 'low', t);
  if (t < g.swell) { F.begin('#121212'); const i = F.idx(t, g.hits), w = ['KEIN', 'BLA', 'BLA.'];
    ctx.save(); F.shake(t, F.hitP(t, g.hits, .2)); for (let k = 0; k <= i; k++) F.slam(w[k], 540, 620 + k * 340, g.hits[k], t, {color: k === 2 ? '#e8573a' : '#f4f1ea', w: 900, max: 330}); ctx.restore();
    F.rgbSplit(12 * F.hitP(t, g.hits, .15)); F.finish(t, .05, .4); F.handle(false); return; }
  if (t < g.g0) { const sp = F.hitP(t, g.sub, .25); F.begin('#0c0c0c'); F.bokeh(t, 40, .25 + .2 * sp); F.leaks(t * .5, .12);
    const s1 = 'Wir glauben an', s2 = 'Design, das wirkt.';
    ctx.save(); F.cam(lerp(1.0, 1.08, seg(t, g.swell, g.g0))); F.letters(s1, 540, 880, 1.6, t, {size: 76, weight: 700, step: .06, dur: .5, dy: 60, color: '#f4f1ea'}); F.letters(s2, 540, 1010, 2.5, t, {size: 96, weight: 900, step: .06, dur: .5, dy: 60, color: '#e6d0ad'}); ctx.restore();
    const out = seg(t, 5.6, g.g0); if (out > 0) { ctx.fillStyle = `rgba(244,241,234,${out})`; ctx.fillRect(0, 0, 1080, 1920); }
    F.finish(t, .05, .45); F.handle(false); return; }
  const n = Math.floor((t - g.g0) / (2 * g.q)), s0 = g.g0 + n * 2 * g.q, [a, b] = LINES[Math.min(n, LINES.length - 1)], bg = BGS[Math.min(n, BGS.length - 1)], ink = bg === '#121212' || bg === '#e8573a' ? '#f4f1ea' : '#121212';
  const bp = F.hitP(t, g.beats, .25);
  if (t > 15.71) { F.begin('#121212'); F.endTag(t, 15.71, true, 1050); text(ctx, 'Nur Design, das wirkt.', 540, 1330, {size: 62, weight: 900, color: '#e6d0ad', alpha: seg(t, 15.85, 16.05)}); F.flash(t, 15.71, .15, '255,255,255', .4); F.finish(t, .05, .4); return; }
  F.begin(bg);
  // diagonal wipe from previous colour
  const wu = eo5(seg(t, s0, s0 + .18)); if (wu < 1 && n > 0) { ctx.save(); ctx.fillStyle = BGS[n - 1]; ctx.beginPath(); ctx.moveTo(1080 * wu * 1.6 - 400, 0); ctx.lineTo(1080, 0); ctx.lineTo(1080, 1920); ctx.lineTo(1080 * wu * 1.6 - 1000, 1920); ctx.closePath(); ctx.fill(); ctx.restore(); }
  F.grid(.06, 120, ink === '#121212' ? '0,0,0' : '255,255,255', t * 120);
  ctx.save(); F.cam(1 + .05 * bp + .02 * (t - s0));
  F.wipeText(a, 540, 900, s0, t, {font: 'Anton', weight: 400, size: 250, color: ink, ls: 0});
  F.wipeText(b, 540, 1180, s0 + g.q, t, {font: 'Anton', weight: 400, size: 250, color: ink === '#121212' ? '#121212' : (bg === '#e8573a' ? '#121212' : '#e6d0ad'), ls: 0});
  ctx.restore();
  // ticker bar on the 16ths
  const tk = Math.floor((t - g.g0) / (g.q / 4)); ctx.fillStyle = ink; for (let i = 0; i < 16; i++) if (i <= tk % 16) ctx.fillRect(140 + i * 52, 1500, 36, 8);
  F.rgbSplit(6 * bp); F.finish(t, .04, .2); F.handle(ink === '#121212');
}

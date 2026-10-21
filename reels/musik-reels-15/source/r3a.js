// 3A — Brand-Pattern: op-art from the SocialClip symbol
import * as F from './fx.js';
const {ctx, seg, lerp, eo5, eio, pulse, text, symbol, BRAND} = F;
const A = await F.loadAudio('s3'), g = F.G.s3;
const PAL = [['#121212', '#f4f1ea'], ['#f4f1ea', '#121212'], ['#e6d0ad', '#121212'], ['#121212', '#e6d0ad'], ['#1b2340', '#f4f1ea'], ['#b4532a', '#f4f1ea']];
const WORDS = ['MUSTER.', 'RHYTHMUS.', 'SYSTEM.', 'WIEDER-', 'ERKENNUNG.', 'DEINE', 'MARKE.'];
function pattern(t, mode, ink, e, rot) {
  ctx.save(); ctx.translate(540, 960); ctx.rotate(rot);
  const s = 180; for (let y = -7; y <= 7; y++) for (let x = -5; x <= 5; x++) {
    const px = x * s + (mode === 2 && y % 2 ? s / 2 : 0), py = y * s, d = Math.hypot(px, py) / 900, k = .5 + .5 * Math.sin(d * 8 - t * 6);
    if (mode === 0) symbol(ctx, px, py, s * .7 * (.4 + .6 * k) * (1 + e * .3), ink);
    else if (mode === 1) { if ((x + y) % 2 === 0) { ctx.fillStyle = ink; ctx.fillRect(px - s / 2, py - s / 2, s, s); } }
    else if (mode === 2) { ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(px, py, s * .42 * k, 0, 7); ctx.fill(); }
    else if (mode === 3) { ctx.strokeStyle = ink; ctx.lineWidth = 10 * k + 2; ctx.beginPath(); ctx.arc(px, py, s * .38, t * 3 + x, t * 3 + x + Math.PI); ctx.stroke(); }
    else { ctx.save(); ctx.translate(px, py); ctx.rotate(t * 2 + d * 4); ctx.fillStyle = ink; ctx.fillRect(-s * .45, -8 - 10 * k, s * .9, 16 + 20 * k); ctx.restore(); }
  }
  ctx.restore();
}
export function frame(t) {
  const lo = F.env(A, 'low', t), hi = F.env(A, 'high', t);
  if (t < g.swell) { F.begin('#121212'); const i = F.idx(t, g.hits), hp = F.hitP(t, g.hits, .2);
    for (let k = 0; k <= i; k++) { ctx.save(); ctx.translate(540, 960); ctx.rotate(k * .5); ctx.translate(-540, -960); symbol(ctx, 540, 960, [700, 450, 260][k] * (k === i ? lerp(1.4, 1, eo5(seg(t, g.hits[k], g.hits[k] + .12))) : 1), k % 2 ? '#e6d0ad' : '#f4f1ea'); ctx.restore(); }
    F.rgbSplit(14 * hp); F.flash(t, g.hits[Math.max(0, i)], .1, '255,255,255', .4); F.finish(t, .05, .4); F.handle(false); return; }
  if (t < g.g0) { const u = seg(t, g.swell, g.g0), sp = F.hitP(t, g.sub, .2); F.begin('#0d0d0d');
    ctx.save(); F.cam(lerp(1.6, 1, eio(u)) + .03 * sp, u * .8); pattern(t * .5, 0, `rgba(230,208,173,${.35 + .5 * (1 - seg(t, 4.3, 5.6))})`, sp, t * .1); ctx.restore();
    F.bgFill('rgba(0,0,0,0)', 'rgba(0,0,0,.85)', 540, 960, 900);
    text(ctx, 'Wie erkennt man', 540, 860, {size: 70, weight: 800, color: '#fff', alpha: seg(t, 2.2, 2.5) * (1 - seg(t, 5.5, 5.9))}); text(ctx, 'eine Marke?', 540, 980, {size: 110, weight: 900, color: '#e6d0ad', alpha: seg(t, 2.9, 3.2) * (1 - seg(t, 5.5, 5.9))});
    F.bloom(F.out, .3, 8); F.finish(t, .05, .4); F.handle(false); return; }
  const k = F.idx(t, g.beats), bar = Math.floor(k / 2), [bg, ink] = PAL[bar % PAL.length], bp = pulse(t, g.beats[k], .3), ep = F.hitP(t, g.eighths, .12);
  if (t > 15.71) { F.begin('#121212'); pattern(t, 0, 'rgba(230,208,173,.12)', 0, t * .1); F.endTag(t, 15.71, true, 1050); text(ctx, 'Branding mit System.', 540, 1320, {size: 56, weight: 800, color: '#e6d0ad', alpha: seg(t, 15.9, 16.1)}); F.flash(t, 15.71, .2, '255,255,255', .5); F.finish(t, .05, .4); return; }
  F.begin(bg); ctx.save(); F.cam(1 + .06 * bp, 0); pattern(t, k % 5, ink, ep, (k % 2 ? 1 : -1) * t * .15); ctx.restore();
  // word panel
  ctx.fillStyle = bg; ctx.fillRect(0, 820, 1080, 280); ctx.fillStyle = ink; ctx.fillRect(0, 820, 1080, 6); ctx.fillRect(0, 1094, 1080, 6);
  F.slam(WORDS[bar % WORDS.length], 540, 960, g.beats[bar * 2], t, {color: ink, w: 960, max: 210, from: 1.5});
  F.rgbSplit(8 * bp * hi); F.sweep(t, g.beats[k], .35, '255,255,255', .2);
  F.finish(t, .04, .25); F.handle(ink === '#121212');
}

// 1A — "Deine Marke lädt …" loader -> logo explosion
import * as F from './fx.js';
const {ctx, out, seg, lerp, eo3, eo5, eio, back, pulse, text, symbol, wordmark, BRAND} = F;
const A = await F.loadAudio('s1'), g = F.G.s1;
const PAL = [['#121212', '#f4f1ea'], ['#f4f1ea', '#121212'], ['#e6d0ad', '#121212'], ['#1b2340', '#f4f1ea'], ['#b4532a', '#f4f1ea'], ['#121212', '#e6d0ad']];
const WORDS = ['LOGO', 'FARBEN', 'SCHRIFT', 'FEED', 'WEBSITE', 'REELS', 'REICHWEITE', 'MARKE.', 'MARKE.'];
export function frame(t) {
  const lo = F.env(A, 'low', t), hi = F.env(A, 'high', t);
  if (t < g.drop) {
    F.begin('#0b0b0d'); F.bgFill('#1a1a22', '#050506');
    const i = F.idx(t, g.build), p = (i + 1) / g.build.length, hp = F.hitP(t, g.build, .18), tens = seg(t, 0, g.gap);
    ctx.save(); F.cam(1 + .08 * tens + .03 * hp, Math.sin(t * 40) * .004 * tens); F.shake(t, hp * .5 * tens);
    F.rings(540, 900, t * (1 + tens * 3), hp, '230,208,173', 5);
    // loader ring
    ctx.lineCap = 'round'; ctx.lineWidth = 34; ctx.strokeStyle = 'rgba(244,241,234,.08)'; ctx.beginPath(); ctx.arc(540, 900, 250, 0, 7); ctx.stroke();
    const pe = i >= 0 ? lerp(i / 21, p, eo5(seg(t, g.build[i], g.build[i] + .12))) : 0;
    ctx.strokeStyle = '#e6d0ad'; ctx.shadowColor = '#e6d0ad'; ctx.shadowBlur = 30 + 40 * hp; ctx.beginPath(); ctx.arc(540, 900, 250, -Math.PI / 2, -Math.PI / 2 + pe * 6.283); ctx.stroke(); ctx.shadowBlur = 0;
    const pct = t >= g.gap ? 99 : Math.min(99, Math.round(pe * 100));
    text(ctx, pct + '%', 540, 960, {size: 170, weight: 900, ls: -4, color: '#fff', scale: 1 + .12 * hp});
    // suction particles
    const r = F.mulberry32(4); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 120; k++) { const a = r() * 6.283, ph = (r() + t * (.3 + tens)) % 1, rad = 1100 * (1 - ph); ctx.fillStyle = `rgba(230,208,173,${.6 * ph})`; ctx.beginPath(); ctx.arc(540 + Math.cos(a) * rad, 900 + Math.sin(a) * rad, 2 + 3 * ph, 0, 7); ctx.fill(); }
    ctx.restore(); ctx.globalCompositeOperation = 'source-over';
    text(ctx, 'Deine Marke lädt …', 540, 300, {size: 64, weight: 800, color: '#fff', alpha: seg(t, 0, .2)});
    text(ctx, t > 4.5 ? 'gleich …' : 'bitte nicht wegwischen', 540, 1450, {size: 34, weight: 600, ls: 3, color: '#86827b'});
    if (t > 4.55) { F.rgbSplit(4 + 16 * hp * tens); F.glitch(t, (t > 5.2 ? .9 : .35) * hp, 3); }
    if (t >= g.gap) { ctx.fillStyle = `rgba(0,0,0,${.7 + .3 * Math.sin(t * 90)})`; ctx.fillRect(0, 0, 1080, 1920); }
    F.finish(t, .05, .5); F.handle(false); return;
  }
  const k = F.idx(t, g.kicks), lt = t - g.kicks[k], [bg, ink] = PAL[k % PAL.length], kp = pulse(t, g.kicks[k], .3);
  F.begin(bg); if (bg === '#121212' || bg === '#1b2340') F.rays(540, 860, t, '230,208,173', .12 + .12 * kp, 22, .3);
  ctx.save(); F.cam(1 + .1 * kp - .02 * lt, (k % 2 ? 1 : -1) * .03 * kp);
  F.shock(540, 860, g.kicks[k], t, ink === '#121212' ? '18,18,18' : '244,241,234', 1100, .5, 18);
  symbol(ctx, 540, 860, 420 * (1 + .12 * kp) * (k === 0 ? lerp(.3, 1, eo5(seg(t, g.drop, g.drop + .25))) : 1), ink);
  const w = WORDS[Math.min(k, WORDS.length - 1)];
  if (k < 9) F.slam(w, 540, 1260, g.kicks[k], t, {color: ink, w: 900, max: 230, from: 1.8});
  if (k === 0) F.slam('GELADEN.', 540, 320, g.drop, t, {color: ink, w: 800, max: 150});
  ctx.restore();
  F.burst(540, 860, g.drop, t, {n: 160, v: 2200, size: 7, cols: ['#f4f1ea', '#e6d0ad', '#ffffff'], life: 1.4, grav: 300});
  F.burst(540, 860, g.kicks[k], t, {n: 40, v: 1300, size: 5, cols: [ink], life: .45, seed: k + 9, add: false});
  if (k >= 9) { F.endTag(t, g.kicks[9], bg !== '#f4f1ea' && bg !== '#e6d0ad', 1450); }
  F.rgbSplit(10 * kp + 3 * hi); F.zoomBlur(kp * 1.2, 540, 860);
  F.flash(t, g.drop, .25, '255,255,255', 1); F.flash(t, g.kicks[k], .08, '255,255,255', .25);
  F.finish(t, .045, .35); F.handle(ink === '#121212');
}

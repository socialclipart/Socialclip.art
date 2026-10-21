// 2D — Reichweite: 12 Likes -> 12.480
import * as F from './fx.js';
const {ctx, seg, lerp, eo3, eo5, pulse, text, rr, symbol, BRAND} = F;
const A = await F.loadAudio('s2'), g = F.G.s2;
const NOTE = ['❤  anna_m gefällt dein Beitrag', '➕  248 neue Follower', '💬  „Wo kann man das kaufen?“', '🔁  Dein Reel wurde 1.204× geteilt', '❤  +3.900 Likes', '📈  Reichweite +940 %', '💬  „Mega Design!“', '➕  Neue Anfrage über Website'];
export function frame(t) {
  const lo = F.env(A, 'low', t), bp = F.hitP(t, g.bass, .2), pre = t < g.drop, ip = F.hitP(t, g.intro, .2);
  F.begin(pre ? '#101012' : '#121212'); if (!pre) { F.rays(540, 900, t, '255,77,109', .05 + .1 * lo, 20, .4); F.leaks(t, .18 + .15 * lo, ['255,77,109', '230,208,173', '255,160,60']); }
  const likes = pre ? 7 + Math.max(0, F.idx(t, g.intro) + 1) : Math.round(lerp(12, 12480, eo3(seg(t, g.drop, 7.0))));
  ctx.save(); F.cam(1 + (pre ? .04 * ip : .06 * bp), 0); F.shake(t, pre ? 0 : bp * .3);
  // phone post card
  rr(ctx, 170, 420, 740, 1000, 50); ctx.fillStyle = '#1d1d20'; ctx.fill();
  rr(ctx, 210, 520, 660, 660, 26); const im = ctx.createLinearGradient(210, 520, 870, 1180); im.addColorStop(0, '#e6d0ad'); im.addColorStop(1, '#8a6a3f'); ctx.fillStyle = im; ctx.fill(); symbol(ctx, 540, 850, 300, '#121212');
  ctx.fillStyle = '#e6d0ad'; ctx.beginPath(); ctx.arc(250, 470, 26, 0, 7); ctx.fill(); text(ctx, 'deine.marke', 295, 482, {size: 32, weight: 700, color: '#fff', align: 'left'});
  text(ctx, '❤', 240, 1265, {size: 64, color: '#ff4d6d', scale: 1 + .4 * (pre ? ip : bp)});
  text(ctx, likes.toLocaleString('de-DE') + ' Likes', 300, 1262, {size: 52, weight: 900, color: '#fff', align: 'left', scale: 1 + .06 * bp});
  text(ctx, pre ? 'Gepostet vor 3 Tagen' : 'Gepostet vor 3 Minuten', 240, 1340, {size: 28, weight: 500, color: '#86827b', align: 'left'});
  ctx.restore();
  if (!pre) {
    // heart storm
    const r = F.mulberry32(2); ctx.save(); for (let i = 0; i < 90; i++) { const t0 = g.drop + r() * 7, u = seg(t, t0, t0 + 1.6); if (u <= 0 || u >= 1) continue; text(ctx, '❤', 540 + (r() - .5) * 900 + Math.sin(u * 6 + i) * 40, 1500 - 1500 * u, {size: 40 + r() * 60, color: r() < .7 ? '#ff4d6d' : '#e6d0ad', alpha: 1 - u}); } ctx.restore();
    // notifications on beats
    g.beats.forEach((b, i) => { if (i >= NOTE.length) return; const u = F.back(seg(t, b, b + .15)), out = seg(t, b + 1.2, b + 1.4); if (u <= 0 || out >= 1) return;
      ctx.save(); ctx.translate(540, 1500 + (i % 3) * 0 - 110 * Math.min(2, (F.idx(t, g.beats) - i)) ); ctx.scale(u, u); ctx.globalAlpha = 1 - out; ctx.font = '700 36px Inter'; const w = ctx.measureText(NOTE[i]).width + 80; rr(ctx, -w / 2, -45, w, 84, 42); ctx.fillStyle = 'rgba(244,241,234,.96)'; ctx.fill(); text(ctx, NOTE[i], 0, 12, {size: 36, weight: 700, color: '#121212'}); ctx.restore(); });
    F.burst(540, 1260, g.drop, t, {n: 160, v: 2200, size: 7, cols: ['#ff4d6d', '#e6d0ad', '#fff'], life: 1.3});
  }
  text(ctx, pre ? 'Dein Post. 12 Likes.' : 'Mit uns:', 540, 270, {size: 70, weight: 900, color: pre ? '#86827b' : '#fff'});
  if (!pre) text(ctx, '12 → 12.480', 540, 360, {size: 76, weight: 900, color: '#ff4d6d', alpha: seg(t, 3.0, 3.2), shadow: 'rgba(255,77,109,.7)', blur: 30});
  if (t > 7.966) { F.endTag(t, 7.966, true, 1720); }
  F.rgbSplit(5 * bp); F.flash(t, g.drop, .25, '255,230,235', 1); F.finish(t, .05, .4); if (t < 7.966) F.handle(false);
}

// 1D — Feed Glow-up: chaotic grid -> cohesive branded feed, flipping row by row on the kicks
import * as F from './fx.js';
const {ctx, seg, lerp, eo3, eo5, eio, pulse, text, rr, symbol, BRAND} = F;
const A = await F.loadAudio('s1'), g = F.G.s1;
const UG = ['SALE!!!', 'Montag :(', 'NEU', '❤❤❤', 'Gewinnspiel', 'WOW', 'Angebot', '!!!', 'Story?', '20%', 'Hallo', 'LOL', 'Frohes Fest', 'Info', 'Neu da'];
const UC = ['#ff00aa', '#00ff44', '#ffee00', '#ff5500', '#00ccff', '#aa00ff', '#ff0033', '#66ff00'];
const NC = ['#121212', '#f4f1ea', '#e6d0ad', '#2a2520', '#86827b'];
const GX = 3, GY = 5, TW = 330, TH = 330, X0 = 540 - (GX * TW + 2 * 12) / 2, Y0 = 380;
function tileUgly(x, y, i) { ctx.fillStyle = UC[i % UC.length]; ctx.fillRect(x, y, TW, TH); text(ctx, UG[i % UG.length], x + TW / 2, y + TH / 2 + 20, {font: 'Comic', size: 56, color: i % 2 ? '#0000ff' : '#ffffff', rot: (i % 3 - 1) * .15, stroke: '#000', strokeW: 4}); }
function tileNew(x, y, i) { const c = NC[i % 5], ink = c === '#121212' || c === '#2a2520' ? '#f4f1ea' : '#121212'; ctx.fillStyle = c; ctx.fillRect(x, y, TW, TH);
  const m = i % 4; if (m === 0) symbol(ctx, x + TW / 2, y + TH / 2, 160, ink); else if (m === 1) text(ctx, ['MARKE', 'IDEE', 'FOKUS', 'STIL'][i % 4], x + TW / 2, y + TH / 2 + 26, {font: 'Anton', size: 90, color: ink}); else if (m === 2) { ctx.strokeStyle = ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x + TW / 2, y + TH / 2, 90, 0, 7); ctx.stroke(); } else text(ctx, '„Design, das wirkt.“', x + TW / 2, y + TH / 2 + 12, {font: 'Bodoni', style: 'italic', size: 40, weight: 500, color: ink}); }
export function frame(t) {
  const pre = t < g.drop, k = F.idx(t, g.kicks), kp = k >= 0 ? pulse(t, g.kicks[k], .3) : 0, hp = pre ? F.hitP(t, g.build, .18) : 0, tens = seg(t, 0, g.gap);
  F.begin(pre ? '#e9e9e9' : '#f4f1ea');
  const zoomOut = eio(seg(t, 9.154, 9.8));
  ctx.save(); F.cam((pre ? 1 + .1 * tens + .03 * hp : 1 + .05 * kp) * lerp(1, .78, zoomOut), 0, 0, lerp(0, 120, zoomOut)); F.shake(t, hp * tens * .6);
  // profile header
  ctx.fillStyle = pre ? '#cccccc' : '#121212'; ctx.beginPath(); ctx.arc(X0 + 90, 250, 70, 0, 7); ctx.fill(); if (!pre) symbol(ctx, X0 + 90, 250, 80, '#f4f1ea');
  text(ctx, pre ? 'mein_shop_1987' : 'deine.marke', X0 + 190, 235, {size: 44, weight: 800, color: '#121212', align: 'left'});
  const fol = pre ? 312 : Math.round(lerp(312, 24800, eo3(seg(t, g.drop, 10.0))));
  text(ctx, `${fol.toLocaleString('de-DE')} Follower`, X0 + 190, 290, {size: 32, weight: 600, color: pre ? '#888' : '#9b7a45', align: 'left'});
  for (let r = 0; r < GY; r++) for (let c = 0; c < GX; c++) {
    const i = r * GX + c, x = X0 + c * (TW + 12), y = Y0 + r * (TH + 12);
    const fk = g.kicks[1 + r] ?? 99, f = seg(t, fk + c * .05 - .12, fk + c * .05 + .08), sc = Math.abs(Math.cos(f * Math.PI));
    ctx.save(); ctx.translate(x + TW / 2, y + TH / 2); ctx.scale(sc * .98 + .02, 1); ctx.translate(-x - TW / 2, -y - TH / 2);
    (f < .5 ? tileUgly : tileNew)(x, y, i); ctx.restore();
    if (pre) { const mk = g.build[i + 3]; const u = mk ? seg(t, mk, mk + .1) : 0; if (u > 0) text(ctx, '✕', x + TW - 50, y + 80, {size: 90, weight: 900, color: '#ff3b30', scale: F.back(u), alpha: u}); }
  }
  ctx.restore();
  if (pre) { rr(ctx, 120, 1660, 840, 120, 60); ctx.fillStyle = '#121212'; ctx.fill(); text(ctx, t < 3 ? 'Dein Feed heute:' : 'Chaos. Null Wiedererkennung.', 540, 1738, {size: 46, weight: 800, color: '#fff'}); F.glitch(t, t > 5 ? hp : 0, 4); if (t >= g.gap) F.begin('#000'); }
  else { rr(ctx, 120, 1660, 840, 120, 60); ctx.fillStyle = '#121212'; ctx.fill(); text(ctx, k >= 8 ? 'Feed-Design: socialclip.art' : 'Dein Feed mit uns.', 540, 1738, {size: 46, weight: 800, color: '#e6d0ad'}); }
  F.flash(t, g.drop, .25, '255,255,255', 1); if (k >= 1) F.sweep(t, g.kicks[k], .4, '255,255,255', .35);
  F.rgbSplit(pre ? 6 * hp * tens : 6 * kp); F.finish(t, .035, .15); if (!pre) F.handle(true);
}

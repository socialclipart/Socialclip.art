// 3D — Synthwave runner: Erlangen -> Instagram -> Dein Feed
import * as F from './fx.js';
const {ctx, seg, lerp, eo5, eio, pulse, text, symbol, BRAND} = F;
const A = await F.loadAudio('s3'), g = F.G.s3;
const WORDS = ['ERLANGEN', '→', 'INSTAGRAM', '→', 'TIKTOK', '→', 'WEBSITE', '→', 'DEIN FEED.', 'DEIN FEED.', 'DEIN FEED.'];
const HZ = 1120;
function road(t, speed, e, col = '255,61,190') {
  const sky = ctx.createLinearGradient(0, 0, 0, HZ); sky.addColorStop(0, '#0a0420'); sky.addColorStop(1, '#3a0d4a'); ctx.fillStyle = sky; ctx.fillRect(0, 0, 1080, HZ);
  const fl = ctx.createLinearGradient(0, HZ, 0, 1920); fl.addColorStop(0, '#20063a'); fl.addColorStop(1, '#05010d'); ctx.fillStyle = fl; ctx.fillRect(0, HZ, 1080, 800);
  ctx.save(); ctx.strokeStyle = `rgba(${col},${.6 + .4 * e})`; ctx.shadowColor = `rgb(${col})`; ctx.shadowBlur = 18; ctx.lineWidth = 3;
  for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(540 + i * 30, HZ); ctx.lineTo(540 + i * 420, 1920); ctx.stroke(); }
  for (let k = 0; k < 18; k++) { const ph = ((k / 18) + t * speed) % 1, y = HZ + Math.pow(ph, 2.6) * 800; ctx.globalAlpha = ph; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke(); }
  ctx.restore();
}
function sun(y, r, e) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1080, HZ); ctx.clip(); const sg = ctx.createLinearGradient(0, y - r, 0, y + r); sg.addColorStop(0, '#ffd23f'); sg.addColorStop(1, '#ff3dbe'); ctx.fillStyle = sg; ctx.shadowColor = '#ff3dbe'; ctx.shadowBlur = 80 + 60 * e; ctx.beginPath(); ctx.arc(540, y, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#2a0a40'; for (let i = 0; i < 7; i++) { const yy = y + r * .1 + i * r * .13; ctx.fillRect(540 - r, yy, 2 * r, 4 + i * 3.5); } ctx.restore();
  ctx.save(); ctx.fillStyle = '#12052a'; ctx.beginPath(); ctx.moveTo(0, HZ); for (let x = 0; x <= 1080; x += 60) ctx.lineTo(x, HZ - 60 - 90 * Math.abs(Math.sin(x * .011)) - 50 * Math.abs(Math.sin(x * .031))); ctx.lineTo(1080, HZ); ctx.fill(); ctx.restore(); }
export function frame(t) {
  const lo = F.env(A, 'low', t), hi = F.env(A, 'high', t);
  if (t < g.swell) { F.begin('#05010d'); const i = F.idx(t, g.hits); road(t, .3, 0); sun(HZ + 200, 300, 0);
    F.slam(['LOS.', 'LOS.', 'LOS!'][i] || '', 540, 700, g.hits[Math.max(0, i)], t, {color: '#fff', w: 700, max: 340, shadow: '#ff3dbe', blur: 40}); F.flash(t, g.hits[Math.max(0, i)], .12, '255,61,190', .5); F.scanlines(.12); F.finish(t, .06, .5); F.handle(false); return; }
  if (t < g.g0) { const u = eio(seg(t, g.swell, g.g0)), sp = F.hitP(t, g.sub, .2); F.begin('#05010d'); road(t, .4 + .3 * u, sp); sun(lerp(HZ + 250, HZ - 120, u), 300 + 40 * sp, sp);
    text(ctx, 'Von hier …', 540, 420, {size: 90, weight: 900, color: '#fff', shadow: '#ff3dbe', blur: 30, alpha: seg(t, 2.2, 2.5) * (1 - seg(t, 5.6, 5.9))}); text(ctx, '… in jeden Feed.', 540, 540, {size: 90, weight: 900, color: '#ffd23f', shadow: '#ff3dbe', blur: 30, alpha: seg(t, 3.4, 3.7) * (1 - seg(t, 5.6, 5.9))});
    F.bloom(F.out, .4 + .4 * sp, 9); F.scanlines(.1); F.finish(t, .06, .5); F.handle(false); return; }
  const k = F.idx(t, g.beats), bp = pulse(t, g.beats[k], .3), n = Math.floor(k / 2);
  F.begin('#05010d'); ctx.save(); F.cam(1 + .05 * bp); road(t, 1.4 + .6 * lo, bp, k % 4 < 2 ? '255,61,190' : '61,245,255'); sun(HZ - 120, 340 + 30 * bp, bp); ctx.restore();
  F.speedLines(540, HZ, t, .5 + .5 * lo, '255,210,240', 60);
  if (t > 15.71) { ctx.fillStyle = 'rgba(5,1,13,.7)'; ctx.fillRect(0, 0, 1080, 1920); F.endTag(t, 15.71, true, 960); text(ctx, 'Social Media aus Erlangen', 540, 1220, {size: 52, weight: 800, color: '#ffd23f', alpha: seg(t, 15.85, 16.05)}); F.bloom(F.out, .3, 8); F.finish(t, .06, .5); return; }
  const w = WORDS[Math.min(n, WORDS.length - 1)];
  F.echo(tt => F.slam(w, 540, 560, g.beats[n * 2], tt, {color: '#fff', w: 960, max: 220, from: 2.2, shadow: '#ff3dbe', blur: 40}), t, 3, .03);
  F.bloom(F.out, .35 + .35 * bp, 9); F.rgbSplit(4 + 10 * bp * hi); F.scanlines(.1); F.finish(t, .06, .45); F.handle(false);
}

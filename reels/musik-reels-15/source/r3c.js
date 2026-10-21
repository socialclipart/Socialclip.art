// 3C — Portfolio flipbook: generative posters on every eighth
import * as F from './fx.js';
const {ctx, seg, lerp, eo5, eio, pulse, text, rr, symbol, BRAND} = F;
const A = await F.loadAudio('s3'), g = F.G.s3;
const PC = [['#e8573a', '#121212', '#f4f1ea'], ['#121212', '#e6d0ad', '#f4f1ea'], ['#1b2340', '#3df5ff', '#f4f1ea'], ['#f4f1ea', '#121212', '#e8573a'], ['#e6d0ad', '#121212', '#b4532a'], ['#2f3e2c', '#a3b18a', '#f1ece0'], ['#ff4d6d', '#121212', '#fff'], ['#121212', '#f4f1ea', '#ffcc00']];
const TITLES = ['JAZZ NIGHT', 'OPENING', 'SUMMER', 'MENÜ', 'POP-UP', 'BIO MARKT', 'FASHION', 'TECH TALK', 'FESTIVAL', 'NEU', 'SALE', 'WORKSHOP'];
function poster(i, x, y, w, h, t) {
  const [a, b, c] = PC[i % PC.length], r = F.mulberry32(i * 31 + 7); ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); ctx.fillStyle = a; ctx.fillRect(0, 0, w, h);
  const m = i % 5; ctx.fillStyle = b;
  if (m === 0) { ctx.beginPath(); ctx.arc(w * .5, h * .42, w * .38, 0, 7); ctx.fill(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(w * (.4 + .2 * r()), h * .42, w * .18, 0, 7); ctx.fill(); }
  else if (m === 1) { for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? b : c; ctx.fillRect(0, h * .1 + k * h * .07, w * (.3 + .7 * r()), h * .05); } }
  else if (m === 2) { ctx.save(); ctx.translate(w / 2, h * .42); ctx.rotate(t + i); for (let k = 0; k < 6; k++) { ctx.rotate(Math.PI / 3); ctx.fillRect(-w * .04, 0, w * .08, w * .36); } ctx.restore(); }
  else if (m === 3) { symbol(ctx, w / 2, h * .42, h * .45, b); }
  else { ctx.beginPath(); ctx.moveTo(0, h * .7); ctx.lineTo(w * .5, h * .12); ctx.lineTo(w, h * .7); ctx.fill(); ctx.fillStyle = c; ctx.fillRect(w * .1, h * .62, w * .8, h * .04); }
  text(ctx, TITLES[i % TITLES.length], w * .08, h * .86, {font: 'Anton', size: w * .17, color: m === 3 ? c : (a === '#f4f1ea' || a === '#e6d0ad' ? '#121212' : '#f4f1ea'), align: 'left'});
  text(ctx, '24.10. · ERLANGEN', w * .08, h * .93, {size: w * .045, weight: 700, ls: 3, color: a === '#f4f1ea' || a === '#e6d0ad' ? '#121212' : '#f4f1ea', align: 'left'});
  ctx.restore();
}
export function frame(t) {
  if (t < g.swell) { F.begin('#121212'); const i = F.idx(t, g.hits);
    for (let k = 0; k <= i; k++) { const u = eo5(seg(t, g.hits[k], g.hits[k] + .15)); ctx.save(); ctx.translate(540 + (k - 1) * 70, 960 + (k - 1) * 40); ctx.rotate((k - 1) * .12 * u); ctx.scale(lerp(1.6, 1, u), lerp(1.6, 1, u)); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 50; poster(k, -330, -470, 660, 940, t); ctx.restore(); }
    F.flash(t, g.hits[Math.max(0, i)], .1, '255,255,255', .4); F.finish(t, .05, .4); F.handle(false); return; }
  if (t < g.g0) { // camera drifts across a poster wall
    F.begin('#0d0d0d'); const u = eio(seg(t, g.swell, g.g0)), sp = F.hitP(t, g.sub, .2);
    ctx.save(); F.cam(lerp(1.3, .55, u), lerp(-.12, .05, u), lerp(200, -100, u), lerp(-300, 200, u));
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; poster((y + 3) * 7 + x + 3, 540 + x * 520 - 230, 960 + y * 720 - 320, 460, 650, t); ctx.restore(); }
    ctx.restore(); F.sweep(t, 2.2, 2.4, '255,240,215', .35, -.6); F.bloom(F.out, .2 + .3 * sp, 8);
    text(ctx, 'Unsere Arbeit.', 540, 300, {size: 84, weight: 900, color: '#fff', shadow: 'rgba(0,0,0,.8)', blur: 30, alpha: seg(t, 2.0, 2.3) * (1 - seg(t, 5.6, 5.9))});
    F.finish(t, .05, .5); F.handle(false); return; }
  if (t > 15.71) { F.begin('#121212'); F.endTag(t, 15.71, true, 1050); text(ctx, 'Plakate · Flyer · Social', 540, 1320, {size: 52, weight: 800, color: '#e6d0ad', alpha: seg(t, 15.85, 16.05)}); F.finish(t, .05, .4); return; }
  const n = F.idx(t, g.eighths), lt = t - g.eighths[n], bp = F.hitP(t, g.beats, .2);
  F.begin('#121212'); F.grid(.05, 60, '255,255,255', t * 80);
  ctx.save(); F.cam(1 + .04 * bp - .03 * lt, (n % 2 ? .015 : -.015)); ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 60;
  poster(n + 3, 120, 260, 840, 1190, t); ctx.restore();
  text(ctx, String(n + 1).padStart(3, '0'), 140, 1560, {font: 'Anton', size: 90, color: '#e6d0ad', align: 'left'}); text(ctx, 'PROJEKTE', 330, 1555, {size: 34, weight: 800, ls: 8, color: '#f4f1ea', align: 'left'});
  F.flash(t, g.eighths[n], .05, '255,255,255', .25); F.rgbSplit(5 * bp); F.finish(t, .04, .35); F.handle(false);
}

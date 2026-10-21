// 1C — Farbpalette: stripes on the build, kaleidoscope palettes on the drop
import * as F from './fx.js';
const {ctx, seg, lerp, eo3, eo5, pulse, text, rr, BRAND} = F;
const A = await F.loadAudio('s1'), g = F.G.s1;
const STR = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1', '#9b5de5', '#f15bb5', '#fee440', '#00bbf9', '#00f5d4', '#e63946', '#a8dadc', '#457b9d', '#1d3557', '#ffb4a2', '#6d6875', '#e6d0ad'];
const PALS = [['CAFÉ', ['#3b2a20', '#c8a27a', '#f2e6d8', '#7a4b32', '#1f1611']], ['TECH', ['#0b0f1a', '#3df5ff', '#8a5cff', '#f4f1ea', '#1c2340']], ['LUXUS', ['#0b0b0b', '#d6c29f', '#f5efe4', '#8b6f47', '#2a2520']], ['BIO', ['#2f3e2c', '#a3b18a', '#f1ece0', '#588157', '#dad7cd']], ['FITNESS', ['#111111', '#ff4d2e', '#f4f1ea', '#ffb703', '#2b2b2b']], ['BEAUTY', ['#f8e1e7', '#d99aa5', '#7a3e48', '#fff7f2', '#c06c84']], ['SOCIALCLIP', ['#121212', '#f4f1ea', '#e6d0ad', '#86827b', '#1e1e1e']]];
function stripes(t, n, col) { const h = 1920 / 21; for (let i = 0; i < n; i++) { const t0 = g.build[i], u = eo5(seg(t, t0, t0 + .16)), y = 1920 - (i + 1) * h; ctx.fillStyle = col ? col(i) : STR[i]; const x = i % 2 ? lerp(1080, 0, u) : lerp(-1080, 0, u); ctx.fillRect(x, y, 1080, h + 1); } }
export function frame(t) {
  if (t < g.drop) {
    F.begin('#f4f1ea'); const i = F.idx(t, g.build), hp = F.hitP(t, g.build, .18), tens = seg(t, 0, g.gap);
    ctx.save(); F.cam(1 + .06 * tens + .02 * hp); stripes(t, i + 1); ctx.restore();
    const col = seg(t, g.gap - .1, g.drop); if (col > 0) { ctx.fillStyle = `rgba(0,0,0,${eo3(col)})`; ctx.fillRect(0, 0, 1080, 1920); }
    ctx.save(); rr(ctx, 90, 200, 900, 220, 30); ctx.fillStyle = '#121212'; ctx.fill(); ctx.restore();
    text(ctx, 'Welche Farbe', 540, 290, {size: 74, weight: 900, color: '#f4f1ea'}); text(ctx, 'hat deine Marke?', 540, 380, {size: 74, weight: 900, color: STR[Math.max(0, i) % 21]});
    if (i >= 0) text(ctx, STR[i].toUpperCase(), 540, 1700, {size: 40, weight: 800, ls: 8, color: '#121212', alpha: .7});
    F.rgbSplit(6 * hp * tens); F.finish(t, .04, .15); F.handle(true); return;
  }
  const k = F.idx(t, g.kicks), kp = pulse(t, g.kicks[k], .3), lt = t - g.kicks[k], [name, pal] = PALS[Math.min(k, PALS.length - 1)];
  F.begin(pal[0]);
  // kaleidoscope source: rotating palette bands
  ctx.save(); ctx.translate(540, 960); ctx.rotate(t * .8); for (let i = 0; i < 14; i++) { ctx.fillStyle = pal[i % 5]; ctx.fillRect(-1400 + i * 200 + ((t * 300) % 200), -1400, 200, 2800); } ctx.restore();
  F.kaleido(10, t * .5 + k * .3, 1 + .1 * kp);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, 1080, 1920);
  // palette card
  ctx.save(); F.cam(lerp(1.2, 1, eo5(seg(t, g.kicks[k], g.kicks[k] + .15))) + .05 * kp);
  rr(ctx, 140, 640, 800, 640, 40); ctx.fillStyle = '#f4f1ea'; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 60; ctx.fill(); ctx.shadowBlur = 0;
  pal.forEach((c, i) => { const u = eo5(seg(lt, i * .04, i * .04 + .15)); ctx.fillStyle = c; ctx.fillRect(180 + i * 144, 700 + 300 * (1 - u), 136, 300 * u); text(ctx, c.toUpperCase(), 248 + i * 144, 1050, {size: 20, weight: 700, color: '#121212', alpha: u}); });
  text(ctx, name, 540, 1200, {font: 'Anton', size: 120, color: '#121212'});
  ctx.restore();
  text(ctx, k >= 6 ? 'Wir finden deine.' : 'Palette Nº ' + (k + 1), 540, 360, {size: 76, weight: 900, color: '#fff', shadow: 'rgba(0,0,0,.6)', blur: 30});
  if (k >= 8) F.endTag(t, g.kicks[8], true, 1560);
  F.shock(540, 960, g.kicks[k], t, '255,255,255', 1000, .45, 16); F.rgbSplit(12 * kp); F.flash(t, g.drop, .25, '255,255,255', 1);
  F.finish(t, .04, .35); F.handle(false);
}

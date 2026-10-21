// T1 — "Dieses Auto fliegt nicht. Trotzdem reden alle darüber." (sound 1: build -> drop -> kicks)
import * as F from './fx.js';
import {car, ramp, road, flashes} from './car.js';
const {ctx, seg, lerp, eo3, eo5, eio, ei3, back, pulse, text, rr, BRAND} = F;
const A = await F.loadAudio('s1'), g = F.G.s1;
const BUILD_TXT = [[0.035, 'Ein Stunt.'], [1.103, 'Wenige Sekunden.'], [2.241, 'Ohne Fahrer.'], [3.39, 'Rampe. Absprung.'], [4.551, '…']];
const KICK = [
  {t: 6.379, big: 'LANDUNG.', sub: 'Auf allen vier Rädern.'},
  {t: 6.85, big: 'WELTWEIT', sub: 'in den Schlagzeilen.', head: true},
  {t: 7.311, big: 'MILLIONEN', sub: 'Aufrufe in Tagen.', head: true},
  {t: 7.772, big: 'FLIEGT ER?', sub: 'Nicht dauerhaft.'},
  {t: 8.224, big: 'ZULASSUNG?', sub: 'Gibt es nicht.'},
  {t: 8.695, big: 'EGAL.', sub: 'Alle reden drüber.'},
  {t: 9.154, big: 'MARKETING.', sub: 'Kein Auto-Trick.'},
  {t: 9.615, big: 'DEIN STUNT?', sub: 'Was macht dich unvergesslich?'},
];
const HEADS = ['„Das Auto, das fliegt“', '„Salto mit dem Roadster“', '„Flying cars are real“', '„Der Stunt des Jahres?“', '„Hype oder Zukunft?“'];
export function frame(t) {
  const lo = F.env(A, 'low', t), hp = F.hitP(t, g.build, .18);
  if (t < g.drop) {
    F.begin('#0a0b0e'); F.bgFill('#1c2230', '#050608', 540, 900, 1300);
    const tens = seg(t, 0, g.gap);
    ctx.save(); F.cam(1 + .12 * tens + .02 * hp, 0, 0, 0, 540, 1300); F.shake(t, hp * tens * .5);
    F.speedLines(540, 1300, t, tens * .8, '255,255,255', 60);
    road(t, 400 + 2400 * tens * tens); ramp(560, 1420, 520, 240);
    // car accelerates toward the ramp (moves right with the build)
    const cx = lerp(-300, 470, ei3(seg(t, 0, g.gap))), sp = t * (8 + 60 * tens);
    car(cx, 1420, 1.0, 0, {spin: sp, glow: tens});
    ctx.restore();
    // hook + build captions
    const hk = 1 - seg(t, 1.0, 1.2);
    if (hk > 0) { text(ctx, 'Dieses Auto', 540, 360, {size: 110, weight: 900, ls: -3, color: '#fff', alpha: hk, scale: lerp(1.1, 1, eo5(seg(t, 0, .3)))}); text(ctx, 'fliegt nicht.', 540, 480, {size: 110, weight: 900, ls: -3, color: '#ff3b30', alpha: hk}); text(ctx, '… und trotzdem reden alle darüber.', 540, 570, {size: 44, weight: 700, color: '#cfd6df', alpha: hk * seg(t, .3, .5)}); }
    BUILD_TXT.forEach(([t0, s], i) => { const t1 = BUILD_TXT[i + 1]?.[0] ?? g.gap; if (t < Math.max(t0, 1.1) || t >= t1) return; F.slam(s, 540, 470, Math.max(t0, 1.1), t, {font: 'Inter', weight: 900, color: '#fff', w: 900, max: 120, from: 1.4}); });
    if (t > 1.1) text(ctx, `00:0${Math.floor(t)}`, 540, 250, {font: 'Anton', size: 60, color: '#ffcc00', alpha: .9});
    F.rgbSplit(2 + 10 * hp * tens); if (t >= g.gap) F.begin('#000');
    F.finish(t, .05, .5); F.handle(false); return;
  }
  // drop: jump + flip, then headlines/lesson on the kicks
  F.begin('#0a0b0e'); F.bgFill('#22304a', '#050608', 540, 900, 1300);
  const jt = seg(t, g.drop, 6.85), air = t < 6.85;
  ctx.save(); F.cam(1 + .08 * F.hitP(t, g.kicks, .25), 0, 0, 0, 540, 1100);
  road(t, air ? 900 : 300); 
  if (air) { const x = lerp(560, 620, jt), y = 1420 - 240 - Math.sin(jt * Math.PI) * 700 + 240 * jt, rot = -Math.PI * 2 * eio(jt) - .4 * (1 - jt); car(x, y, 1.0, rot, {thrust: Math.sin(jt * Math.PI), glow: 1, spin: t * 30}); ramp(300 - 900 * jt, 1420, 520, 240); }
  else { const lt = t - 6.85; car(620 - 80 * eo3(seg(lt, 0, .5)), 1420 + 14 * Math.exp(-lt * 12) * Math.sin(lt * 60), 1.0, 0, {glow: .6, spin: t * 8}); }
  ctx.restore();
  flashes(t, g.drop, 26);
  F.shock(700, 1300, 6.85, t, '255,255,255', 900, .45, 14);
  const k = F.idx(t, KICK.map(x => x.t));
  if (t < KICK[0].t) F.slam('ABSPRUNG.', 540, 420, g.drop, t, {color: '#fff', w: 900, max: 170, from: 2});
  else if (k >= 0 && t < 10.072) { const K = KICK[k];
    if (K.head) HEADS.forEach((h, i) => { const u = back(seg(t, K.t + i * .05, K.t + i * .05 + .15)); if (u <= 0) return; ctx.save(); ctx.translate(540 + (i % 2 ? 140 : -140), 700 + i * 92); ctx.rotate((i % 2 ? .03 : -.03)); ctx.scale(u, u); ctx.font = '800 38px Inter'; const w = ctx.measureText(h).width + 60; rr(ctx, -w / 2, -40, w, 70, 12); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fill(); text(ctx, h, 0, 10, {size: 38, weight: 800, color: '#111'}); ctx.restore(); });
    F.slam(K.big, 540, 360, K.t, t, {color: k >= 6 ? '#e6d0ad' : '#fff', w: 960, max: 190, from: 1.8}); text(ctx, K.sub, 540, 520, {size: 50, weight: 700, color: '#cfd6df', alpha: seg(t, K.t + .06, K.t + .18)}); }
  if (t >= 10.072) { ctx.fillStyle = 'rgba(5,6,8,.75)'; ctx.fillRect(0, 0, 1080, 1920); text(ctx, 'Wir finden', 540, 640, {size: 110, weight: 900, color: '#fff'}); text(ctx, 'deinen Stunt.', 540, 760, {size: 110, weight: 900, color: '#e6d0ad'}); F.endTag(t, 10.1, true, 1150); }
  text(ctx, 'Basierend auf Medienberichten zur Tesla-Roadster-Präsentation (15.10.2026)', 540, 1880, {size: 20, weight: 500, color: 'rgba(255,255,255,.45)'});
  F.flash(t, g.drop, .25, '255,255,255', 1); F.flash(t, 6.85, .12, '255,255,255', .4);
  F.rgbSplit(3 + 10 * F.hitP(t, g.kicks, .25)); F.bloom(F.out, .25 + .3 * lo, 8); F.finish(t, .05, .45); F.handle(false);
}

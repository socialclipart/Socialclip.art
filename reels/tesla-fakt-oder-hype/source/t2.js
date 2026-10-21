// T2 — "Fliegt der neue Tesla wirklich? Fakt oder Hype" (sound 4: beats -> break -> re-drop verdict)
import * as F from './fx.js';
import {car, ramp, road} from './car.js';
const {ctx, seg, lerp, eo3, eo5, eio, back, pulse, text, rr, BRAND} = F;
const A = await F.loadAudio('s4'), g = F.G.s4, b = g.beats;
const CL = [
  ['Springt über eine Rampe', 'BESTÄTIGT', '#22c55e', '✔'], ['Macht einen Salto in der Luft', 'BESTÄTIGT', '#22c55e', '✔'], ['Fuhr ohne Fahrer', 'BESTÄTIGT', '#22c55e', '✔'],
  ['0–60 mph in 0,81 Sekunden', 'LAUT TESLA', '#f59e0b', '!'], ['Fliegt dauerhaft', 'NICHT GEZEIGT', '#ef4444', '✖'], ['Darf auf der Straße fliegen', 'NEIN', '#ef4444', '✖'],
  ['Kann man kaufen', 'NOCH NICHT', '#ef4444', '✖'], ['Produktion', 'ZIEL: 2028', '#f59e0b', '⏳'],
];
function stamp(s, col, icon, u, rot) { if (u <= 0) return; ctx.save(); ctx.translate(540, 1210); ctx.rotate(rot); const sc = lerp(2.2, 1, eo5(u)); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, u * 3);
  ctx.font = '900 72px Inter'; const w = ctx.measureText(icon + '  ' + s).width + 90; ctx.strokeStyle = col; ctx.lineWidth = 10; rr(ctx, -w / 2, -70, w, 130, 22); ctx.stroke(); ctx.fillStyle = col + '22'; ctx.fill(); text(ctx, icon + '  ' + s, 0, 24, {size: 72, weight: 900, color: col}); ctx.restore(); }
export function frame(t) {
  const lo = F.env(A, 'low', t), kp = F.hitP(t, b, .2);
  F.begin('#0b0c10'); F.bgFill('#1d2533', '#050608', 540, 900, 1300); F.grid(.04, 90, '255,255,255', t * 40);
  text(ctx, 'FAKT ODER HYPE?', 540, 210, {font: 'Anton', size: 96, color: '#fff', ls: 2}); text(ctx, 'Der „fliegende“ Tesla Roadster', 540, 290, {size: 42, weight: 700, color: '#9fb0c6'});
  if (t < b[1]) { // hook
    ctx.save(); F.cam(1 + .03 * kp); car(540, 1050, .9, -.05 * Math.sin(t * 6), {glow: .8, thrust: .5 + .3 * Math.sin(t * 9), spin: t * 10}); ctx.restore();
    text(ctx, 'Fliegt er wirklich?', 540, 600, {size: 96, weight: 900, color: '#fff', scale: lerp(1.15, 1, eo5(seg(t, 0, .3)))}); text(ctx, '8 Behauptungen. Ein Urteil.', 540, 1350, {size: 50, weight: 700, color: '#ffcc00', alpha: seg(t, .2, .4)});
    F.finish(t, .045, .45); F.handle(false); return; }
  if (t < g.brk) { const i = Math.min(7, Math.floor((F.idx(t, b) - 1) / 2)), s0 = b[1 + i * 2], st = b[2 + i * 2], [claim, verdict, col, icon] = CL[i];
    text(ctx, `${i + 1} / 8`, 540, 470, {size: 40, weight: 800, ls: 8, color: '#9fb0c6'});
    ctx.save(); const u = eo5(seg(t, s0, s0 + .2)); ctx.translate(lerp(900, 0, u), 0); rr(ctx, 80, 560, 920, 420, 40); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 3; ctx.stroke();
    text(ctx, 'Behauptung:', 540, 650, {size: 40, weight: 700, color: '#9fb0c6'}); const lines = claim.length > 18 ? [claim.slice(0, claim.lastIndexOf(' ', 18) > 0 ? claim.lastIndexOf(' ', 18) : 18), claim.slice((claim.lastIndexOf(' ', 18) > 0 ? claim.lastIndexOf(' ', 18) : 18) + 1)] : [claim];
    lines.forEach((l, k) => text(ctx, l, 540, 780 + k * 100 - (lines.length - 1) * 30, {size: 86, weight: 900, color: '#fff'})); ctx.restore();
    stamp(verdict, col, icon, seg(t, st, st + .14), (i % 2 ? .06 : -.06));
    F.flash(t, st, .08, col === '#22c55e' ? '34,197,94' : col === '#ef4444' ? '239,68,68' : '245,158,11', .25);
    // tally
    const done = CL.slice(0, i + (t >= st ? 1 : 0)); ctx.save(); done.forEach(([, , c, ic], k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(540 - 7 * 45 + k * 90, 1460, 30, 0, 7); ctx.fill(); text(ctx, ic, 540 - 7 * 45 + k * 90, 1474, {size: 34, weight: 900, color: '#fff'}); }); ctx.restore();
    F.rgbSplit(2 + 6 * kp); F.finish(t, .045, .45); F.handle(false, 1780); return; }
  if (t < g.drop) { F.begin('#000'); text(ctx, 'Also …', 540, 820, {size: 110, weight: 900, color: '#fff', alpha: seg(t, g.brk, g.brk + .12)}); text(ctx, 'fliegt er?', 540, 960, {size: 130, weight: 900, color: '#ffcc00', alpha: seg(t, g.brk + .2, g.brk + .32)}); F.finish(t, .06, .6); return; }
  // verdict
  const k = F.idx(t, b), jt = seg(t, g.drop, g.drop + 1.0);
  ctx.save(); F.cam(1 + .05 * kp, 0, 0, 0, 540, 1300); road(t, 600, 1480); ramp(300 - 700 * jt, 1480, 360, 160);
  const air = jt < 1, x = lerp(420, 700, jt), y = 1480 - 160 - Math.sin(jt * Math.PI) * 560 + 160 * jt; car(air ? x : 700, air ? y : 1480, .62, air ? -Math.PI * 2 * eio(jt) : 0, {thrust: air ? Math.sin(jt * Math.PI) : 0, glow: 1, spin: t * 20}); ctx.restore();
  F.slam('JEIN.', 540, 640, g.drop, t, {color: '#ffcc00', w: 800, max: 300, from: 2.4});
  text(ctx, 'Er springt. Fliegen? Noch nicht.', 540, 860, {size: 54, weight: 800, color: '#fff', alpha: seg(t, b[19], b[19] + .15)});
  if (t >= b[20]) { rr(ctx, 90, 940, 900, 200, 30); ctx.fillStyle = 'rgba(230,208,173,.12)'; ctx.fill(); text(ctx, 'Marketing-Lektion:', 540, 1010, {size: 40, weight: 800, color: '#e6d0ad'}); text(ctx, 'Ein Stunt schlägt 100 Posts.', 540, 1090, {size: 58, weight: 900, color: '#fff', alpha: seg(t, b[20], b[20] + .15)}); }
  if (t >= b[22]) text(ctx, 'Mehr davon? Folge @socialclip.art', 540, 1740, {size: 44, weight: 800, color: '#e6d0ad', scale: back(seg(t, b[22], b[22] + .15))});
  text(ctx, 'Quellen: Tesla-Präsentation 15.10.2026, Medienberichte (Euronews, NBC, Dezeen u. a.)', 540, 1880, {size: 20, weight: 500, color: 'rgba(255,255,255,.45)'});
  F.burst(560, 900, g.drop, t, {n: 160, v: 2200, size: 6, cols: ['#ffcc00', '#fff'], life: 1.1}); F.flash(t, g.drop, .25, '255,255,255', 1);
  F.rgbSplit(3 + 9 * kp); F.bloom(F.out, .2 + .25 * lo, 8); F.finish(t, .045, .45);
}

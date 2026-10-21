// 4A — "Logo in 12 Sekunden": speed-design challenge, reveal on the re-drop (9.619 s)
import * as F from './fx.js';
const {ctx, seg, lerp, eo3, eo5, eio, back, pulse, text, rr, symbol, BRAND} = F;
const A = await F.loadAudio('s4'), g = F.G.s4, b = g.beats;
const C = {navy: '#14213d', gold: '#e9b44c', cream: '#f6f1e7', ink: '#14213d', blue: '#2d7ff9'};
function star(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.closePath(); }
function goldFill(c, x, y, r) { const gr = c.createLinearGradient(x - r, y - r, x + r, y + r); gr.addColorStop(0, '#f7d58b'); gr.addColorStop(.5, '#e9b44c'); gr.addColorStop(1, '#b9822a'); return gr; }
function logo(c, x, y, R, o = {}) { // o: circle 0..1, star 0..1, gold bool, word 0..1, tag 0..1, kern
  if (o.circle > 0) { c.save(); c.globalAlpha *= o.circle; c.fillStyle = o.dark ? C.cream : C.navy; c.beginPath(); c.arc(x, y, R * lerp(.6, 1, eo5(o.circle)), 0, 7); c.fill(); c.restore(); }
  if (o.star > 0) { c.save(); c.globalAlpha *= o.star; star(c, x, y, R * .66 * lerp(.4, 1, eo5(o.star))); c.fillStyle = o.gold ? goldFill(c, x, y, R * .66) : (o.dark ? C.navy : C.cream); c.fill(); c.restore(); }
  if (o.word > 0) { const L = 'NOVA', ks = o.kern ?? 0, size = R * .62, ls = lerp(R * .3, R * .14, ks); c.save(); c.font = `800 ${size}px Inter`; c.letterSpacing = `${ls}px`; const w = c.measureText(L).width - ls; c.restore();
    let cx = x - w / 2; [...L].forEach((ch, i) => { const u = seg(o.word, i * .15, i * .15 + .5); c.save(); c.font = `800 ${size}px Inter`; const cw = c.measureText(ch).width; c.restore(); if (u > 0) text(c, ch, cx + cw / 2, y + R * 1.62 - R * .5 * (1 - eo5(u)), {size, weight: 800, color: o.dark ? C.cream : C.ink, alpha: u}); cx += cw + ls; }); }
  if (o.tag > 0) text(c, 'COFFEE ROASTERS', x, y + R * 1.98, {size: R * .15, weight: 700, ls: R * .07, color: o.dark ? C.gold : '#7b6a4a', alpha: o.tag});
}
function timer(t, dark) { const s = Math.min(t, 12), str = `00:${String(Math.floor(s)).padStart(2, '0')},${Math.floor((s % 1) * 10)}`;
  rr(ctx, 330, 120, 420, 110, 55); ctx.fillStyle = dark ? 'rgba(246,241,231,.12)' : C.navy; ctx.fill(); ctx.fillStyle = '#ff3b30'; ctx.beginPath(); ctx.arc(390, 175, 14, 0, 7); ctx.globalAlpha = Math.floor(t * 4) % 2 ? 1 : .35; ctx.fill(); ctx.globalAlpha = 1;
  text(ctx, str, 565, 200, {font: 'Anton', size: 78, color: C.cream, ls: 2}); }
function label(s, t0, t, dark) { const u = seg(t, t0, t0 + .15); if (u <= 0) return; ctx.save(); ctx.translate(lerp(-300, 0, eo5(u)), 0); rr(ctx, 70, 1560, 520, 90, 45); ctx.fillStyle = dark ? C.gold : C.navy; ctx.fill(); text(ctx, s, 110, 1620, {size: 40, weight: 800, color: dark ? C.navy : C.cream, align: 'left'}); ctx.restore(); }
function sketch(t) { const strokes = [[540, 900, 300, 0], [548, 895, 290, .3], [532, 908, 310, .6]]; ctx.save(); ctx.strokeStyle = 'rgba(40,40,50,.55)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  strokes.forEach(([x, y, r, ph], i) => { const u = seg(t, b[0] + i * .25, b[0] + i * .25 + .6); if (u <= 0) return; ctx.beginPath(); for (let a = 0; a <= u * 6.4; a += .05) { const rr2 = r + Math.sin(a * 5 + ph * 9) * 8; const px = x + Math.cos(a - 1.6) * rr2, py = y + Math.sin(a - 1.6) * rr2; a ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); });
  const su = seg(t, b[1] + .2, b[3]); if (su > 0) { ctx.setLineDash([2000 * su, 3000]); star(ctx, 540, 900, 200); ctx.stroke(); star(ctx, 546, 905, 196); ctx.stroke(); ctx.setLineDash([]); } ctx.restore(); }
function construct(t, a) { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.blue; ctx.lineWidth = 2; const u = eo3(seg(t, b[4], b[6]));
  for (const r of [300, 198, 120]) { ctx.beginPath(); ctx.arc(540, 900, r, -Math.PI / 2, -Math.PI / 2 + 6.283 * u); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(540, 900 - 420 * u); ctx.lineTo(540, 900 + 420 * u); ctx.moveTo(540 - 420 * u, 900); ctx.lineTo(540 + 420 * u, 900); ctx.moveTo(540 - 300 * u, 900 - 300 * u); ctx.lineTo(540 + 300 * u, 900 + 300 * u); ctx.moveTo(540 + 300 * u, 900 - 300 * u); ctx.lineTo(540 - 300 * u, 900 + 300 * u); ctx.stroke(); ctx.restore(); }
function handles(t, a) { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; const r = 198, pts = [[540, 900 - r], [540 + r, 900], [540, 900 + r], [540 - r, 900]], w = Math.sin(t * 6) * 18;
  ctx.strokeStyle = C.blue; ctx.lineWidth = 2.5; pts.forEach(([x, y], i) => { const hx = (i % 2 ? 0 : 1) * (70 + w), hy = (i % 2 ? 1 : 0) * (70 + w); ctx.beginPath(); ctx.moveTo(x - hx, y - hy); ctx.lineTo(x + hx, y + hy); ctx.stroke(); for (const s of [-1, 1]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + s * hx, y + s * hy, 9, 0, 7); ctx.fill(); ctx.stroke(); } ctx.fillStyle = C.blue; ctx.fillRect(x - 10, y - 10, 20, 20); }); ctx.restore(); }
function mock(kind, t, t0) {
  const u = eo5(seg(t, t0, t0 + .2)); ctx.save(); F.cam(lerp(1.25, 1, u) + .03 * (t - t0), 0); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 30;
  if (kind === 0) { ctx.fillStyle = C.cream; ctx.beginPath(); ctx.moveTo(360, 620); ctx.lineTo(720, 620); ctx.lineTo(680, 1320); ctx.lineTo(400, 1320); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.fillStyle = C.navy; rr(ctx, 335, 570, 410, 70, 20); ctx.fill(); rr(ctx, 380, 540, 320, 40, 14); ctx.fill(); logo(ctx, 540, 880, 110, {circle: 1, star: 1, gold: true}); text(ctx, 'NOVA', 540, 1110, {size: 70, weight: 800, ls: 18, color: C.navy}); ctx.fillStyle = C.gold; ctx.fillRect(388, 1180, 304, 22); }
  else if (kind === 1) { ctx.fillStyle = C.navy; rr(ctx, 300, 560, 480, 760, 20); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = C.gold; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(540, 560, 110, Math.PI, 0); ctx.stroke(); logo(ctx, 540, 820, 120, {circle: 1, star: 1, gold: true, dark: true}); text(ctx, 'NOVA', 540, 1060, {size: 76, weight: 800, ls: 20, color: C.cream}); text(ctx, 'COFFEE ROASTERS', 540, 1120, {size: 24, weight: 700, ls: 8, color: C.gold}); }
  else { const gr = ctx.createLinearGradient(0, 400, 0, 1500); gr.addColorStop(0, '#2b3a67'); gr.addColorStop(1, '#14213d'); rr(ctx, 270, 380, 540, 1100, 70); ctx.fillStyle = '#0d0d10'; ctx.fill(); ctx.shadowColor = 'transparent'; rr(ctx, 290, 400, 500, 1060, 56); ctx.fillStyle = gr; ctx.fill();
    for (let i = 0; i < 12; i++) { const x = 340 + (i % 4) * 110, y = 520 + Math.floor(i / 4) * 140; rr(ctx, x, y, 80, 80, 20); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill(); }
    const p = F.back(seg(t, t0 + .1, t0 + .3)); ctx.save(); ctx.translate(540, 1040); ctx.scale(p, p); rr(ctx, -110, -110, 220, 220, 52); ctx.fillStyle = C.navy; ctx.shadowColor = 'rgba(233,180,76,.6)'; ctx.shadowBlur = 40; ctx.fill(); ctx.shadowBlur = 0; logo(ctx, 0, 0, 80, {star: 1, gold: true}); ctx.restore(); text(ctx, 'NOVA', 540, 1200, {size: 34, weight: 600, color: '#fff'}); }
  ctx.restore();
}
export function frame(t) {
  const lo = F.env(A, 'low', t), kp = F.hitP(t, b, .18), cp = F.hitP(t, g.claps, .2);
  if (t < g.brk) {
    F.begin(C.cream); F.grid(.05, 60, '20,33,61', 0);
    const zoom = 1 + .015 * kp + eio(seg(t, b[16], g.brk)) * .4; ctx.save(); F.cam(zoom, 0, 0, 0, 540, 900);
    if (t < b[6] + .2) sketch(t);
    construct(t, (1 - seg(t, b[11], b[12])) * seg(t, b[4], b[4] + .1));
    const gold = t >= b[10];
    logo(ctx, 540, 900, 300, {circle: seg(t, b[6], b[6] + .15), star: seg(t, b[7], b[7] + .2) * (t < b[9] ? .9 : 1), gold, word: seg(t, b[12], b[13] + .2), tag: seg(t, b[15], b[15] + .2), kern: eio(seg(t, b[13] + .2, b[14] + .3))});
    handles(t, seg(t, b[7], b[7] + .1) * (1 - seg(t, b[9], b[9] + .2)));
    if (t > b[13] && t < b[15]) { ctx.strokeStyle = C.blue; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { const x = 540 - 190 + i * 190; ctx.beginPath(); ctx.moveTo(x, 1340); ctx.lineTo(x, 1460); ctx.stroke(); } text(ctx, 'Kerning', 540, 1510, {size: 28, weight: 700, color: C.blue}); }
    ctx.restore();
    // swatches
    [[C.navy, b[10]], [C.gold, b[10] + .25], [C.cream, b[11]]].forEach(([c, t0], i) => { const u = back(seg(t, t0, t0 + .15)); if (u <= 0) return; ctx.save(); ctx.translate(420 + i * 120, 400); ctx.scale(u, u); ctx.fillStyle = c; ctx.strokeStyle = 'rgba(20,33,61,.3)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 44, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); });
    // hook
    const hk = 1 - seg(t, b[1], b[1] + .25); if (hk > 0) { ctx.save(); ctx.globalAlpha = hk; text(ctx, 'Logo in', 540, 470, {size: 120, weight: 900, ls: -3, color: C.navy, scale: lerp(1.15, 1, eo5(seg(t, 0, .35)))}); text(ctx, '12 Sekunden.', 540, 600, {size: 120, weight: 900, ls: -3, color: '#ff3b30', scale: lerp(1.15, 1, eo5(seg(t, .1, .45)))}); ctx.restore(); }
    [['1 · Skizze', b[1]], ['2 · Raster', b[4]], ['3 · Vektor', b[6]], ['4 · Farbe', b[10]], ['5 · Schrift', b[12]], ['6 · Feinschliff', b[16]]].forEach(([s, t0], i, arr) => { if (t >= t0 && (i === arr.length - 1 || t < arr[i + 1][1])) label(s, t0, t, false); });
    timer(t, false); F.rgbSplit(2 * kp); F.finish(t, .035, .12); F.handle(true, 1760); return;
  }
  if (t < g.drop) { F.begin('#050507'); const bl = Math.floor(t * 6) % 2; timer(t, true); text(ctx, 'Fertig?', 540, 1000, {font: 'Bodoni', style: 'italic', size: 150, weight: 500, color: C.cream, alpha: seg(t, g.brk, g.brk + .15)}); ctx.save(); ctx.globalAlpha = .25 + .2 * bl; logo(ctx, 540, 1250, 60, {circle: 1, star: 1, dark: true}); ctx.restore(); F.finish(t, .06, .6); return; }
  const k = F.idx(t, b); F.begin(C.navy); F.bgFill('#24365f', '#0a1124', 540, 900, 1300);
  if (k < 19) { F.rays(540, 880, t, '233,180,76', .14 + .1 * lo, 22, .25); ctx.save(); F.cam(lerp(1.4, 1, eo5(seg(t, g.drop, g.drop + .35)))); logo(ctx, 540, 860, 260, {circle: 1, star: 1, gold: true, dark: true, word: 1, tag: 1, kern: 1}); ctx.restore();
    F.burst(540, 860, g.drop, t, {n: 180, v: 2400, size: 6, cols: ['#f7d58b', '#e9b44c', '#fff'], life: 1.2, grav: 400}); F.shock(540, 860, g.drop, t, '233,180,76', 1300, .55, 18); F.glint(620, 700, 1.2, Math.sin(seg(t, 9.75, 10.1) * Math.PI));
    F.slam('FERTIG.', 540, 330, g.drop, t, {color: C.gold, w: 600, max: 160}); }
  else if (k < 22) { mock(k - 19, t, b[k]); text(ctx, ['BECHER', 'TÜTE', 'APP'][k - 19], 540, 1560, {size: 44, weight: 800, ls: 14, color: C.gold, alpha: seg(t, b[k], b[k] + .1)}); }
  else { F.rays(540, 860, t, '233,180,76', .1, 20, .25); text(ctx, 'Dein Logo?', 540, 760, {size: 120, weight: 900, ls: -3, color: C.cream, scale: lerp(1.2, 1, eo5(seg(t, b[22], b[22] + .2)))}); text(ctx, 'In echt dauert’s etwas länger 😉', 540, 860, {size: 40, weight: 600, color: C.gold, alpha: seg(t, b[22] + .1, b[22] + .3)}); F.endTag(t, b[22] + .1, true, 1220); }
  F.flash(t, g.drop, .25, '255,240,210', 1); if (k >= 19) F.flash(t, b[k], .1, '255,255,255', .3);
  timer(t, true); F.rgbSplit(3 + 9 * kp); F.bloom(F.out, .25 + .2 * lo, 8); F.finish(t, .04, .4); F.handle(false);
}

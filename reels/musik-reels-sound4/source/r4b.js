// 4B — "Du scrollst …": the feed jumps one post per beat, stops on ours in the break, explodes on the re-drop
import * as F from './fx.js';
const {ctx, seg, lerp, eo3, eo5, eio, back, pulse, text, rr, symbol, BRAND} = F;
const A = await F.loadAudio('s4'), g = F.G.s4, b = g.beats;
const PH = 1500, NB = 17; // post height, index of our post
const BOR = [['#c9c9c9', '#9e9e9e', 'Montag 😴'], ['#f4a261', '#e76f51', 'Sonnenuntergang #nofilter'], ['#dfe7fd', '#b8c0ff', '10 % auf alles*'], ['#d9d9d9', '#bfbfbf', 'Wir haben geöffnet.'], ['#ffd6a5', '#ffadad', 'Frohes Wochenende!'], ['#cfe1b9', '#97a97c', 'Neue Öffnungszeiten'], ['#e0e0e0', '#a0a0a0', 'Throwback 2019'], ['#bde0fe', '#a2d2ff', 'Gewinnspiel!!!'], ['#f1f1f1', '#cfcfcf', 'Stock-Foto Business'], ['#ffc8dd', '#cdb4db', 'Danke für 300 Follower'], ['#e9edc9', '#ccd5ae', 'Unser Team 😊'], ['#d4d4d4', '#a3a3a3', 'Montag … wieder'], ['#faedcd', '#d4a373', 'Kaffee?'], ['#caf0f8', '#90e0ef', 'Sommer-Sale'], ['#e5e5e5', '#b5b5b5', 'Link in Bio'], ['#ffe5ec', '#ffc2d1', 'Happy Friday'], ['#d8e2dc', '#9d8189', 'Tipp der Woche'], null];
function post(i, y, t) {
  const ours = i === NB; ctx.save(); ctx.translate(0, y);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1080, PH);
  ctx.fillStyle = ours ? '#e6d0ad' : BOR[i % NB][1]; ctx.beginPath(); ctx.arc(70, 60, 34, 0, 7); ctx.fill(); if (ours) symbol(ctx, 70, 60, 42, '#121212');
  text(ctx, ours ? 'socialclip.art' : `shop_${(i * 37) % 900}`, 122, 72, {size: 32, weight: 700, color: '#fff', align: 'left'}); if (ours) text(ctx, '✔', 362, 72, {size: 28, weight: 900, color: '#3897f0', align: 'left'});
  text(ctx, '•••', 1030, 72, {size: 32, weight: 900, color: '#fff', align: 'right'});
  if (!ours) { const [c1, c2, cap] = BOR[i % NB]; const gr = ctx.createLinearGradient(0, 120, 1080, 1200); gr.addColorStop(0, c1); gr.addColorStop(1, c2); ctx.fillStyle = gr; ctx.fillRect(0, 120, 1080, 1080);
    text(ctx, cap, 540, 680, {size: 64, weight: 500, color: 'rgba(0,0,0,.45)'}); text(ctx, '♡  💬  ➤', 40, 1290, {size: 56, color: '#fff', align: 'left'}); text(ctx, `${(i * 7) % 30 + 2} Likes`, 40, 1370, {size: 32, weight: 700, color: '#fff', align: 'left'}); text(ctx, cap, 40, 1420, {size: 30, weight: 400, color: '#aaa', align: 'left'}); }
  else { const gr = ctx.createRadialGradient(540, 600, 30, 540, 660, 800); gr.addColorStop(0, '#3a2d1c'); gr.addColorStop(1, '#0b0a08'); ctx.fillStyle = gr; ctx.fillRect(0, 120, 1080, 1080);
    F.rays(540, 640, t, '230,208,173', .12, 20, .3); symbol(ctx, 540, 560, 300, '#e6d0ad'); text(ctx, 'STOPP.', 540, 1010, {font: 'Anton', size: 220, color: '#f4f1ea'});
    text(ctx, '♥  💬  ➤', 40, 1290, {size: 56, color: '#ff3b5c', align: 'left'}); text(ctx, '24.817 Likes', 40, 1370, {size: 32, weight: 700, color: '#fff', align: 'left'}); text(ctx, 'Content, der Daumen stoppt.', 40, 1420, {size: 30, weight: 500, color: '#e6d0ad', align: 'left'}); }
  ctx.restore();
}
function scrollPos(t) { // in posts
  let p = .12 * Math.min(t, .465) / .465; // already moving on frame 1
  for (let k = 0; k < b.length; k++) { const bk = b[k]; if (bk > g.brk) break; p += eo5(seg(t, bk, bk + .28)) * (k === 16 ? 1 - .12 : 1); }
  p += .0 * seg(t, g.brk, g.drop);
  return Math.min(p, NB);
}
export function frame(t) {
  const lo = F.env(A, 'low', t), kp = F.hitP(t, b, .2), cp = F.hitP(t, g.claps, .2);
  if (t < g.drop) {
    F.begin('#000'); const p = scrollPos(t), v = (scrollPos(t) - scrollPos(t - 1 / 30)) * 30, y0 = 230 - p * PH;
    const draw = (off, a) => { ctx.save(); ctx.globalAlpha = a; const first = Math.max(0, Math.floor(p) - 1); for (let i = first; i <= Math.min(NB, first + 3); i++) post(i, y0 + i * PH + off, t); ctx.restore(); };
    const blur = Math.min(1, Math.abs(v) / 6); if (blur > .05) { for (let k = 2; k >= 1; k--) draw(-k * v * 4, .25 * blur); } draw(0, 1);
    // app chrome
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1080, 200); text(ctx, 'Instagram', 60, 150, {font: 'Sacramento', size: 90, color: '#fff', align: 'left'}); text(ctx, '♡   ✉', 1020, 140, {size: 52, color: '#fff', align: 'right'});
    ctx.fillStyle = '#000'; ctx.fillRect(0, 1780, 1080, 140); text(ctx, '⌂     ⌕     ⊕     ▶     ◯', 540, 1860, {size: 56, color: '#fff'});
    // hook overlay
    const caps = [['Du scrollst …', 0, 2.5], ['… und scrollst …', 2.5, 5.0], ['… und scrollst …', 5.0, 7.1], ['Nichts bleibt hängen.', 7.1, 8.9], ['Bis auf das hier.', 8.9, 9.62]];
    caps.forEach(([s, a, z]) => { if (t < a || t >= z) return; const u = seg(t, a, a + .15); rr(ctx, 90, 300, 900, 150, 75); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.globalAlpha = u; ctx.fill(); ctx.globalAlpha = 1; text(ctx, s, 540, 400, {size: 64, weight: 900, color: '#111', alpha: u, scale: lerp(1.1, 1, eo5(u))}); });
    if (t >= g.brk) { const d = seg(t, g.brk, g.brk + .3); ctx.fillStyle = `rgba(0,0,0,${.45 * d})`; ctx.fillRect(0, 0, 1080, 300); ctx.fillRect(0, 1430, 1080, 490); F.glint(620, 640, 1.1, Math.sin(seg(t, 9.0, 9.5) * Math.PI)); }
    // like pops on claps
    g.claps.forEach(c => { const u = seg(t, c, c + .45); if (u <= 0 || u >= 1 || c > g.brk) return; text(ctx, '♥', 540, 1100 - 120 * u, {size: 260 * F.back(Math.min(1, u * 3)), color: '#fff', alpha: 1 - u}); });
    F.rgbSplit(blur * 8 + 2 * kp); F.finish(t, .03, .25); return;
  }
  // re-drop: our post bursts to full screen ad
  const k = F.idx(t, b), lt = t - b[k]; F.begin('#0b0a08'); F.bgFill('#3a2d1c', '#050404', 540, 900, 1200);
  F.rays(540, 880, t, '230,208,173', .1 + .12 * lo, 24, .4);
  const W2 = ['HOOK.', 'DESIGN.', 'STORY.', 'WIRKUNG.'];
  if (k < 22) {
    ctx.save(); F.cam(1 + .08 * kp); const z = eo5(seg(t, g.drop, g.drop + .3));
    if (k === 18) { symbol(ctx, 540, lerp(790, 760, z), lerp(300, 520, z), '#e6d0ad'); F.slam('STOPP.', 540, 1350, g.drop, t, {color: '#f4f1ea', w: 900, max: 260, from: 2.2}); }
    else { symbol(ctx, 540, 640, 260, 'rgba(230,208,173,.25)'); F.echo(tt => F.slam(W2[k - 19], 540, 1000, b[k], tt, {color: '#f4f1ea', w: 1000, max: 300, from: 2.4}), t, 3, .03); text(ctx, ['der Daumen stoppt', 'das hängen bleibt', 'die man zu Ende schaut', 'die verkauft'][k - 19], 540, 1250, {size: 52, weight: 700, color: '#e6d0ad', alpha: seg(t, b[k] + .08, b[k] + .2)}); }
    ctx.restore();
    F.burst(540, 760, g.drop, t, {n: 200, v: 2600, size: 7, cols: ['#e6d0ad', '#fff', '#ff3b5c'], life: 1.3, grav: 400}); F.shock(540, 800, b[k], t, '230,208,173', 1100, .45, 14);
  } else { text(ctx, 'Wir machen Content,', 540, 760, {size: 70, weight: 900, color: '#f4f1ea', scale: lerp(1.15, 1, eo5(seg(t, b[22], b[22] + .2)))}); text(ctx, 'der Daumen stoppt.', 540, 860, {size: 70, weight: 900, color: '#e6d0ad', alpha: seg(t, b[22] + .05, b[22] + .2)}); F.endTag(t, b[22] + .1, true, 1250); }
  F.flash(t, g.drop, .25, '255,245,225', 1); F.flash(t, b[k], .08, '255,255,255', .25);
  F.rgbSplit(4 + 12 * kp); F.zoomBlur(F.pulse(t, g.drop, .4) * 2); F.bloom(F.out, .25 + .25 * lo, 8); F.finish(t, .045, .45); F.handle(false);
}

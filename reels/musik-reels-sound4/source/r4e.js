// 4E — Vorher/Nachher-Slider: 4 cases on the groove, the biggest (Nr. 5) lands on the re-drop
import * as F from './fx.js';
const {ctx, seg, lerp, eo3, eo5, eio, back, pulse, text, rr, symbol, BRAND} = F;
const A = await F.loadAudio('s4'), g = F.G.s4, b = g.beats;
const CX = 90, CY = 470, CW = 900, CH = 1150;
const BEF = [
  c => { c.fillStyle = '#fff'; c.fillRect(CX, CY, CW, CH); text(c, '🍕', 540, 900, {size: 300}); text(c, 'Pizza Toni', 540, 1150, {font: 'Comic', size: 120, color: '#ff0000', stroke: '#ffff00', strokeW: 6, rot: -.06}); text(c, 'Die beste Pizza der Stadt!!!', 540, 1260, {font: 'Comic', size: 46, color: '#0000ff'}); },
  c => { const gr = c.createLinearGradient(CX, CY, CX + CW, CY + CH); gr.addColorStop(0, '#3366ff'); gr.addColorStop(1, '#99ccff'); c.fillStyle = gr; c.fillRect(CX, CY, CW, CH); c.fillStyle = '#fff'; c.fillRect(CX + 80, CY + 330, CW - 160, 500);
    text(c, 'Max Mustermann', 540, CY + 470, {font: 'Comic', size: 64, color: '#003399'}); text(c, 'Geschäftsführer', 540, CY + 550, {size: 40, weight: 400, color: '#333'}); text(c, 'Tel: 0123/456789  Fax: 0123/456780', 540, CY + 660, {size: 32, weight: 400, color: '#333'}); text(c, 'max@mustermann-gmbh.de', 540, CY + 720, {size: 32, weight: 400, color: '#0000ee'}); text(c, '☎ ✉ 🏢', 540, CY + 230, {size: 90}); },
  c => { c.fillStyle = '#fffbe6'; c.fillRect(CX, CY, CW, CH); text(c, 'SPEISEKARTE', 540, CY + 110, {font: 'Comic', size: 80, color: '#cc0000'}); const it = ['Schnitzel Wiener Art ........ 12,50', 'Schnitzel Jäger Art ........ 13,50', 'Currywurst m. Pommes ..... 8,90', 'Salat bunt ..................... 6,50', 'Pommes ......................... 3,50', 'Cola 0,33 ........................ 2,80', 'Bier 0,5 .......................... 3,90', 'Tagesgericht ................... ?']; it.forEach((s, i) => text(c, s, CX + 60, CY + 240 + i * 100, {size: 40, weight: 400, color: i % 2 ? '#006600' : '#000', align: 'left'})); },
  c => { c.fillStyle = '#c0c0c0'; c.fillRect(CX, CY, CW, CH); c.fillStyle = '#000080'; c.fillRect(CX, CY, CW, 90); text(c, 'Willkommen auf unserer Homepage!!!', 540, CY + 62, {size: 38, weight: 700, color: '#ffff00'}); c.fillStyle = '#fff'; c.fillRect(CX + 30, CY + 130, 240, CH - 160); ['Home', 'Über uns', 'Gästebuch', 'Links', 'Kontakt'].forEach((s, i) => text(c, '► ' + s, CX + 50, CY + 200 + i * 70, {size: 34, weight: 400, color: '#0000ee', align: 'left'}));
    text(c, '🚧 Under Construction 🚧', 640, CY + 400, {size: 46, weight: 700, color: '#ff0000'}); text(c, 'Besucher: 000127', 640, CY + 520, {size: 40, weight: 400, color: '#000'}); text(c, 'Optimiert für 800×600', 640, CY + 600, {size: 32, weight: 400, color: '#333'}); },
  c => { // Nr. 5 — the whole look, chaos collage
    c.fillStyle = '#ffff66'; c.fillRect(CX, CY, CW, CH); const r = F.mulberry32(5); for (let i = 0; i < 9; i++) { c.save(); c.translate(CX + 120 + r() * 660, CY + 120 + r() * 900); c.rotate((r() - .5) * .6); c.fillStyle = ['#ff00aa', '#00ccff', '#33ff00', '#ff6600'][i % 4]; c.fillRect(-170, -110, 340, 220); text(c, ['SALE!!', 'NEU', 'Hallo', '???', 'TOP', '20%', 'WOW', 'Info', ':-)'][i], 0, 25, {font: 'Comic', size: 70, color: '#000'}); c.restore(); } text(c, 'Unser Auftritt', 540, CY + CH - 80, {font: 'Comic', size: 70, color: '#ff0000', stroke: '#000', strokeW: 4}); },
];
const AFT = [
  c => { c.fillStyle = '#1a1512'; c.fillRect(CX, CY, CW, CH); c.strokeStyle = '#e0b56b'; c.lineWidth = 6; c.beginPath(); c.arc(540, 880, 220, 0, 7); c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(540, 880, 195, 0, 7); c.stroke();
    c.fillStyle = '#e0b56b'; c.beginPath(); c.moveTo(540, 740); c.lineTo(660, 960); c.lineTo(420, 960); c.closePath(); c.fill(); c.fillStyle = '#1a1512'; for (const [x, y] of [[520, 880], [570, 910], [500, 930]]) { c.beginPath(); c.arc(x, y, 14, 0, 7); c.fill(); }
    text(c, 'TONI', 540, 1250, {size: 120, weight: 800, ls: 40, color: '#f4ece0'}); text(c, 'PIZZERIA · SEIT 1988', 540, 1320, {size: 30, weight: 600, ls: 10, color: '#e0b56b'}); },
  c => { c.fillStyle = '#121212'; c.fillRect(CX, CY, CW, CH); c.save(); c.translate(540, 1040); c.rotate(-.08); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 50; rr(c, -360, -210, 720, 420, 16); c.fillStyle = '#f4f1ea'; c.fill(); c.shadowBlur = 0;
    text(c, 'Max Mustermann', -300, -60, {font: 'Bodoni', style: 'italic', size: 70, weight: 500, color: '#121212', align: 'left'}); text(c, 'GESCHÄFTSFÜHRUNG', -296, 0, {size: 24, weight: 700, ls: 8, color: '#9b7a45', align: 'left'}); text(c, 'mustermann.de', -296, 140, {size: 30, weight: 600, color: '#121212', align: 'left'}); c.fillStyle = '#121212'; c.fillRect(220, -150, 80, 80); c.restore(); },
  c => { c.fillStyle = '#f2ebe0'; c.fillRect(CX, CY, CW, CH); text(c, 'Speisekarte', 540, CY + 160, {font: 'Bodoni', style: 'italic', size: 110, weight: 500, color: '#1b1714'}); c.fillStyle = '#1b1714'; c.fillRect(440, CY + 210, 200, 3);
    [['Wiener Schnitzel', 'Kalb, Preiselbeeren', '18'], ['Currywurst', 'Hausgemacht, Pommes', '9'], ['Gartensalat', 'Kräuter, Zitrone', '8']].forEach(([a, d, p], i) => { const y = CY + 380 + i * 220; text(c, a, CX + 90, y, {size: 50, weight: 700, color: '#1b1714', align: 'left'}); text(c, d, CX + 90, y + 54, {font: 'Bodoni', style: 'italic', size: 36, weight: 500, color: '#7a6a55', align: 'left'}); text(c, p, CX + CW - 90, y, {font: 'Bodoni', size: 56, weight: 600, color: '#1b1714', align: 'right'}); }); },
  c => { c.fillStyle = '#0e0e10'; c.fillRect(CX, CY, CW, CH); text(c, 'NORDWERK', CX + 60, CY + 90, {size: 34, weight: 800, ls: 6, color: '#fff', align: 'left'}); text(c, '☰', CX + CW - 60, CY + 92, {size: 40, color: '#fff', align: 'right'});
    const gr = c.createLinearGradient(CX, CY + 160, CX + CW, CY + 700); gr.addColorStop(0, '#3a2a6b'); gr.addColorStop(1, '#e8573a'); rr(c, CX + 50, CY + 160, CW - 100, 560, 30); c.fillStyle = gr; c.fill();
    text(c, 'Bauen,', CX + 100, CY + 470, {size: 110, weight: 900, color: '#fff', align: 'left'}); text(c, 'das bleibt.', CX + 100, CY + 590, {size: 110, weight: 900, color: '#fff', align: 'left'});
    rr(c, CX + 50, CY + 780, 380, 100, 50); c.fillStyle = '#fff'; c.fill(); text(c, 'Projekt starten', CX + 240, CY + 843, {size: 34, weight: 700, color: '#121212'}); },
  c => { // Nr. 5 after — full brand system grid
    c.fillStyle = '#121212'; c.fillRect(CX, CY, CW, CH); const tiles = [['#e6d0ad', 0], ['#f4f1ea', 1], ['#1f1f1f', 2], ['#9b7a45', 3], ['#f4f1ea', 4], ['#e6d0ad', 5]];
    tiles.forEach(([col, k], i) => { const x = CX + 40 + (i % 2) * 420, y = CY + 40 + Math.floor(i / 2) * 360; rr(c, x, y, 400, 340, 18); c.fillStyle = col; c.fill(); const ink = col === '#1f1f1f' || col === '#9b7a45' ? '#f4f1ea' : '#121212';
      if (k === 0) symbol(c, x + 200, y + 170, 200, ink); else if (k === 1) text(c, 'Aa', x + 200, y + 220, {font: 'Bodoni', size: 170, weight: 500, color: ink}); else if (k === 2) { ['#e6d0ad', '#f4f1ea', '#9b7a45', '#86827b'].forEach((cc, j) => { c.fillStyle = cc; c.beginPath(); c.arc(x + 80 + j * 80, y + 170, 34, 0, 7); c.fill(); }); }
      else if (k === 3) text(c, 'MARKE', x + 200, y + 200, {font: 'Anton', size: 110, color: ink}); else if (k === 4) { c.fillStyle = '#121212'; rr(c, x + 130, y + 40, 140, 260, 22); c.fill(); symbol(c, x + 200, y + 170, 70, '#e6d0ad'); } else text(c, '„Ein Auftritt.“', x + 200, y + 190, {font: 'Bodoni', style: 'italic', size: 52, weight: 500, color: ink}); }); },
];
function card(i, p, t, z = 1) { // p = slider x fraction (1 = all before)
  ctx.save(); ctx.translate(540, CY + CH / 2); ctx.scale(z, z); ctx.translate(-540, -(CY + CH / 2));
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 80; ctx.shadowOffsetY = 30; rr(ctx, CX, CY, CW, CH, 34); ctx.fillStyle = '#000'; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); rr(ctx, CX, CY, CW, CH, 34); ctx.clip(); BEF[i](ctx); const sx = CX + CW * p; ctx.beginPath(); ctx.rect(sx, CY, CX + CW - sx, CH); ctx.clip(); AFT[i](ctx); ctx.restore();
  // divider
  if (p > .001 && p < .999) { const sx2 = CX + CW * p; ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 30; ctx.fillStyle = '#fff'; ctx.fillRect(sx2 - 3, CY - 20, 6, CH + 40); ctx.beginPath(); ctx.arc(sx2, CY + CH / 2, 46, 0, 7); ctx.fill(); ctx.shadowBlur = 0; text(ctx, '‹ ›', sx2, CY + CH / 2 + 16, {size: 46, weight: 900, color: '#121212'}); ctx.restore(); }
  text(ctx, 'VORHER', CX + 30, CY - 30, {size: 32, weight: 800, ls: 6, color: '#ff5a5a', align: 'left', alpha: p > .05 ? 1 : .3}); text(ctx, 'NACHHER', CX + CW - 30, CY - 30, {size: 32, weight: 800, ls: 6, color: '#e6d0ad', align: 'right', alpha: p < .95 ? 1 : .3});
  ctx.restore();
}
const START = [b[1], b[5], b[9], b[13]];
function sliderPos(t, s0) { // beats: s0 enter (before) · +1 half · +2 tease back · +3 full after
  const q = g.bar / 4; let p = 1; p = lerp(p, .5, eio(seg(t, s0 + q, s0 + q + .25))); p = lerp(p, .78, eio(seg(t, s0 + 2 * q, s0 + 2 * q + .22))); p = lerp(p, 0, eo5(seg(t, s0 + 3 * q, s0 + 3 * q + .25))); return p; }
export function frame(t) {
  const lo = F.env(A, 'low', t), kp = F.hitP(t, b, .2);
  F.begin('#0d0d0f'); F.bgFill('#22201c', '#060606', 540, 1000, 1300); F.grid(.04, 90, '255,255,255', 0);
  const head = (s, c) => text(ctx, s, 540, 250, {size: 70, weight: 900, color: c || '#fff'});
  if (t < b[1]) { // hook
    head('Vorher → Nachher'); text(ctx, 'Nr. 5 ist krass. 👀', 540, 360, {size: 62, weight: 800, color: '#e6d0ad', scale: lerp(1.2, 1, eo5(seg(t, 0, .3)))});
    card(0, 1, t, lerp(.9, 1, eo5(seg(t, 0, .4)))); F.finish(t, .04, .45); F.handle(false, 1780); return; }
  if (t < g.brk) { const i = Math.max(0, F.idx(t, START)), s0 = START[i], p = sliderPos(t, s0), enter = eo5(seg(t, s0, s0 + .25));
    head('Vorher → Nachher'); text(ctx, `${i + 1} / 5`, 540, 350, {size: 44, weight: 800, ls: 6, color: '#e6d0ad'});
    ctx.save(); ctx.translate(lerp(1100, 0, enter), 0); ctx.rotate(lerp(.08, 0, enter)); card(i, p, t, 1 + .015 * kp); ctx.restore();
    const done = s0 + 3 * g.bar / 4; F.burst(540, CY + CH / 2, done, t, {n: 60, v: 1300, size: 6, cols: ['#e6d0ad', '#fff'], life: .6, seed: i}); F.flash(t, done, .1, '255,255,255', .25);
    text(ctx, ['Logo', 'Visitenkarte', 'Speisekarte', 'Website'][i], 540, 1730, {size: 56, weight: 900, color: '#fff'});
    F.rgbSplit(2 + 6 * kp); F.finish(t, .04, .45); return; }
  if (t < g.drop) { F.begin('#000'); ctx.save(); ctx.globalAlpha = .5; ctx.translate(0, 330); card(4, 1, t, .42 + .04 * Math.sin(t * 30)); ctx.restore();
    text(ctx, 'Nr. 5:', 540, 560, {size: 140, weight: 900, color: '#fff', alpha: seg(t, g.brk, g.brk + .12)}); text(ctx, 'Der ganze Auftritt.', 540, 690, {size: 70, weight: 800, color: '#e6d0ad', alpha: seg(t, g.brk + .2, g.brk + .35)}); F.finish(t, .06, .6); return; }
  // re-drop: Nr. 5 full reveal
  const k = F.idx(t, b);
  if (k < 22) { head('Nr. 5 · Der ganze Auftritt', '#e6d0ad'); F.rays(540, CY + CH / 2, t, '230,208,173', .1 + .1 * lo, 22, .3);
    const p = lerp(1, 0, eo5(seg(t, g.drop, g.drop + .3))); card(4, p, t, lerp(1.08, 1, eo5(seg(t, g.drop, g.drop + .4))) + .02 * kp);
    F.burst(540, CY + CH / 2, g.drop, t, {n: 200, v: 2500, size: 7, cols: ['#e6d0ad', '#fff', '#ff5a5a'], life: 1.3, grav: 400}); F.shock(540, CY + CH / 2, g.drop, t, '255,255,255', 1300, .5, 18);
    text(ctx, 'Logo · Farben · Schrift · Print · Web · Social', 540, 1730, {size: 36, weight: 700, color: '#fff', alpha: seg(t, b[19], b[19] + .2)}); }
  else { head('Dein Vorher?'); text(ctx, 'Schick es uns.', 540, 400, {size: 90, weight: 900, color: '#e6d0ad', scale: lerp(1.15, 1, eo5(seg(t, b[22], b[22] + .2)))}); F.endTag(t, b[22] + .1, true, 1100); text(ctx, 'socialclip.art', 540, 1400, {size: 50, weight: 800, color: '#fff', alpha: seg(t, b[22] + .2, b[22] + .35)}); }
  F.flash(t, g.drop, .25, '255,248,236', 1); F.rgbSplit(3 + 10 * kp); F.bloom(F.out, .2 + .2 * lo, 8); F.finish(t, .045, .45); F.handle(false, 1800);
}

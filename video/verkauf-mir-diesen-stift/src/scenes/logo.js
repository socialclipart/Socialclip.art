import { EV, at } from '../beats.js';
import { prog, easeOut, easeOutBack, lerp, clamp, goldGrad, goldText, fitSize, loadImage, SERIF, COND } from '../lib.js';

let sym, mark;
function tint(img, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = goldGrad(g, 0, 0, w * .6, h); g.fillRect(0, 0, w, h);
  return c;
}
export async function init() {
  sym = tint(await loadImage('/assets/logo/socialclip-symbol-cream.svg'), 244, 428);
  mark = tint(await loadImage('/assets/logo/socialclip-wordmark-cream.svg'), 1196, 114);
}

export function draw(ctx, _, { W, t }) {
  const end = 1 - prog(t, 41.7, 42);
  ctx.save(); ctx.globalAlpha = end;

  // Schockwelle
  const sw = prog(t, EV.logo, EV.logo + .9);
  if (sw > 0 && sw < 1) {
    ctx.save(); ctx.globalAlpha = end * (1 - sw) * .8;
    ctx.strokeStyle = '#f3d27a'; ctx.lineWidth = 14 * (1 - sw) + 2;
    ctx.beginPath(); ctx.arc(W / 2, 520, lerp(60, 900, easeOut(sw)), 0, 6.283); ctx.stroke(); ctx.restore();
  }
  // Licht hinter dem Symbol
  const lk = prog(t, EV.logo, EV.logo + .4);
  if (lk > 0) {
    const g = ctx.createRadialGradient(W / 2, 520, 20, W / 2, 520, 620);
    g.addColorStop(0, `rgba(240,190,90,${.35 * lk})`); g.addColorStop(1, 'rgba(240,190,90,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 1300);
  }
  // Symbol
  const sk = prog(t, EV.logo, EV.logo + .32);
  if (sk > 0) {
    const s = lerp(2.2, 1, easeOutBack(sk, 1.6)) * (1 + Math.sin(t * 2.2) * .008);
    ctx.save(); ctx.globalAlpha *= clamp(sk * 3);
    ctx.translate(W / 2, 520); ctx.scale(s, s); ctx.rotate((1 - easeOut(sk)) * -.5);
    ctx.shadowColor = 'rgba(243,190,80,.6)'; ctx.shadowBlur = 50;
    ctx.drawImage(sym, -122 * .9, -214 * .9, 244 * .9, 428 * .9); ctx.restore();
  }
  // Wortmarke, Wischblende
  const mk = easeOut(prog(t, EV.logo + .25, EV.logo + .75));
  if (mk > 0) {
    const mw = 700, mh = mw * 114 / 1196, mx = W / 2 - mw / 2, my = 800;
    ctx.save(); ctx.beginPath(); ctx.rect(mx - 10, my - 10, (mw + 20) * mk, mh + 20); ctx.clip();
    ctx.drawImage(mark, mx, my, mw, mh); ctx.restore();
    ctx.save(); ctx.globalAlpha *= mk; ctx.fillStyle = '#b9ad98'; ctx.font = `400 34px ${COND}`; ctx.letterSpacing = '10px'; ctx.textAlign = 'center';
    ctx.fillText('SOCIALCLIP.ART', W / 2, my + mh + 64); ctx.restore();
  }

  // Claim
  const a = at('verkaufen'), b = at('sorgen'), c = at('fragen');
  const ak = easeOut(prog(t, a.a, a.a + .3));
  if (ak > 0) {
    const s = fitSize(ctx, 'WIR VERKAUFEN DIR KEINEN STIFT.', 940, 62, COND, 600, 3);
    ctx.save(); ctx.globalAlpha *= ak; ctx.font = `600 ${s}px ${COND}`; ctx.letterSpacing = '3px'; ctx.textAlign = 'center'; ctx.fillStyle = '#f6f1e6';
    ctx.fillText('WIR VERKAUFEN DIR KEINEN STIFT.', W / 2, 1040 + (1 - ak) * 24); ctx.restore();
  }
  const lines = [['Wir sorgen dafür,', b.a, 84], ['dass deine Kunden', c.a, 84], ['danach fragen.', c.a + .62, 122]];
  let y = 1180;
  for (const [str, t0, size] of lines) {
    const k = easeOut(prog(t, t0, t0 + .32));
    const sz = fitSize(ctx, str, 940, size, SERIF, 900, 1);
    if (k > 0) { ctx.save(); ctx.globalAlpha *= k; goldText(ctx, str, W / 2, y + (1 - k) * 26, sz, { glow: .8, spacing: 1 }); ctx.restore(); }
    y += sz * 1.18;
  }

  // CTA
  const ck = prog(t, EV.cta, EV.cta + .3);
  if (ck > 0) {
    const s = lerp(1.4, 1, easeOutBack(ck, 2)), bw = 800, bh = 118, by = 1560;
    ctx.save(); ctx.globalAlpha *= clamp(ck * 3); ctx.translate(W / 2, by); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(243,190,80,.55)'; ctx.shadowBlur = 40;
    ctx.fillStyle = goldGrad(ctx, -bw / 2, -bh / 2, bw / 2, bh / 2);
    ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill();
    ctx.shadowColor = 'transparent';
    // Glanz
    const gx = lerp(-bw, bw, ((t - EV.cta) % 1.6) / 1.1);
    ctx.save(); ctx.clip();
    const gg = ctx.createLinearGradient(gx - 90, 0, gx + 90, 0);
    gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, 'rgba(255,255,240,.6)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gg; ctx.fillRect(-bw / 2, -bh / 2, bw, bh); ctx.restore();
    const fs = fitSize(ctx, 'JETZT ANFRAGEN  →', bw - 120, 58, COND, 600, 4);
    ctx.fillStyle = '#1d1407'; ctx.font = `600 ${fs}px ${COND}`; ctx.letterSpacing = '4px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('JETZT ANFRAGEN  →', 0, 4);
    ctx.restore();
  }
  ctx.restore();
}

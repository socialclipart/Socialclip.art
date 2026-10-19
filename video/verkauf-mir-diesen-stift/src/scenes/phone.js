import { EV } from '../beats.js';
import { rng, prog, easeOut, easeOutBack, easeInOut, easeIn, lerp, clamp, goldGrad, COND, SERIF, GOLD, RED } from '../lib.js';

const PW = 560, PH = 1100, CX = 540, CY = 860;
const R = rng(31);
const TILES = Array.from({ length: 30 }, () => ({ h: 18 + R() * 22, l: 16 + R() * 30, s: 25 + R() * 35, play: R() < .35, d: R() }));
const HEARTS = Array.from({ length: 44 }, (_, i) => ({ t0: 26.5 + i * .14 + R() * .1, x: R() * 80, sp: 260 + R() * 200, ph: R() * 6.28, s: .6 + R() * .6 }));
const NOTES = ['„Was kostet das?“', '„Habt ihr noch Termine frei?“', '„Wann könnt ihr starten?“'];

function heart(ctx, s) {
  ctx.beginPath(); ctx.moveTo(0, 12 * s);
  ctx.bezierCurveTo(-26 * s, -6 * s, -14 * s, -26 * s, 0, -12 * s);
  ctx.bezierCurveTo(14 * s, -26 * s, 26 * s, -6 * s, 0, 12 * s); ctx.fill();
}

function envelope(ctx, x, y, s) {
  ctx.fillStyle = goldGrad(ctx, x - 30 * s, y - 20 * s, x + 30 * s, y + 20 * s);
  ctx.beginPath(); ctx.roundRect(x - 30 * s, y - 21 * s, 60 * s, 42 * s, 6 * s); ctx.fill();
  ctx.strokeStyle = '#2a1e0a'; ctx.lineWidth = 3 * s; ctx.beginPath();
  ctx.moveTo(x - 27 * s, y - 17 * s); ctx.lineTo(x, y + 4 * s); ctx.lineTo(x + 27 * s, y - 17 * s); ctx.stroke();
}

export function draw(ctx, _, { t }) {
  const inK = easeOut(prog(t, EV.phoneIn, EV.phoneIn + .55));
  const outK = easeIn(prog(t, EV.phoneOut, EV.phoneOut + .35));
  if (outK >= 1) return;
  ctx.save();
  ctx.globalAlpha = clamp(inK * 2) * (1 - outK);
  ctx.translate(CX, CY + lerp(1300, 0, inK) - outK * 220);
  ctx.rotate(lerp(.12, 0, inK) + Math.sin(t * .8) * .006);
  const sc = lerp(1, .7, outK); ctx.scale(sc, sc);

  // Glow
  const gl = ctx.createRadialGradient(0, 0, 100, 0, 0, 900);
  gl.addColorStop(0, 'rgba(230,180,80,.22)'); gl.addColorStop(1, 'rgba(230,180,80,0)');
  ctx.fillStyle = gl; ctx.fillRect(-1000, -1100, 2000, 2200);

  // Gehäuse
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30;
  ctx.fillStyle = '#0b0a08'; ctx.beginPath(); ctx.roundRect(-PW / 2, -PH / 2, PW, PH, 84); ctx.fill(); ctx.restore();
  ctx.strokeStyle = goldGrad(ctx, -PW / 2, -PH / 2, PW / 2, PH / 2); ctx.lineWidth = 10;
  ctx.beginPath(); ctx.roundRect(-PW / 2, -PH / 2, PW, PH, 84); ctx.stroke();

  // Screen
  const sx = -PW / 2 + 22, sy = -PH / 2 + 22, sw = PW - 44, sh = PH - 44;
  ctx.save(); ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 64); ctx.clip();
  ctx.fillStyle = '#100e0b'; ctx.fillRect(sx, sy, sw, sh);

  // Profilkopf
  const hy = sy + 120;
  ctx.fillStyle = goldGrad(ctx, sx + 40, hy - 50, sx + 140, hy + 50);
  ctx.beginPath(); ctx.arc(sx + 90, hy + 10, 52, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#1a140a'; ctx.font = `600 44px ${COND}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('DU', sx + 90, hy + 12);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f6f1e6'; ctx.font = `600 36px ${COND}`; ctx.fillText('Dein Unternehmen', sx + 165, hy);
  ctx.fillStyle = '#9a8f80'; ctx.font = `400 26px ${COND}`; ctx.fillText('@deinunternehmen', sx + 165, hy + 38);

  // Zahlen
  const gk = easeInOut(prog(t, 26.4, 32.4));
  const fol = Math.round(lerp(1240, 48700, gk)), anf = Math.round(lerp(0, 37, easeInOut(prog(t, 30.3, 32.4))));
  const stats = [['128', 'Beiträge'], [fol.toLocaleString('de-DE'), 'Follower'], [String(anf), 'Anfragen']];
  stats.forEach(([v, l], i) => {
    const x = sx + 75 + i * 170;
    ctx.textAlign = 'center';
    ctx.fillStyle = i === 0 ? '#f6f1e6' : GOLD.a; ctx.font = `600 40px ${COND}`; ctx.fillText(v, x, hy + 135);
    ctx.fillStyle = '#9a8f80'; ctx.font = `400 22px ${COND}`; ctx.fillText(l, x, hy + 168);
  });
  ctx.fillStyle = 'rgba(212,166,64,.25)'; ctx.fillRect(sx + 30, hy + 200, sw - 60, 2);

  // Raster, scrollt
  const gy0 = hy + 220 - (t - 26) * 38, tw = (sw - 8) / 3;
  TILES.forEach((tl, i) => {
    const x = sx + (i % 3) * (tw + 4), y = gy0 + Math.floor(i / 3) * (tw + 4);
    if (y > sy + sh || y + tw < hy + 205) return;
    const g = ctx.createLinearGradient(x, y, x + tw, y + tw);
    g.addColorStop(0, `hsl(${tl.h},${tl.s}%,${tl.l + 10}%)`); g.addColorStop(1, `hsl(${tl.h + 15},${tl.s}%,${tl.l - 8}%)`);
    ctx.fillStyle = g; ctx.fillRect(x, y, tw, tw);
    if (tl.play) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.moveTo(x + tw - 46, y + 18); ctx.lineTo(x + tw - 22, y + 32); ctx.lineTo(x + tw - 46, y + 46); ctx.fill(); }
  });

  // Nervige Werbung
  const ak = easeOutBack(prog(t, EV.adIn, EV.adIn + .25), 2.4);
  const away = easeIn(prog(t, EV.adX + .15, EV.adX + .5));
  if (t >= EV.adIn && away < 1) {
    ctx.save(); ctx.translate(lerp(0, -760, away), 120); ctx.rotate(-.04); ctx.scale(ak, ak);
    const blink = Math.floor((t - EV.adIn) * 8) % 2;
    ctx.fillStyle = '#ffe600'; ctx.beginPath(); ctx.roundRect(-235, -170, 470, 340, 20); ctx.fill();
    ctx.strokeStyle = blink ? '#ff2a2a' : '#1a1aff'; ctx.lineWidth = 12; ctx.setLineDash([22, 14]); ctx.stroke(); ctx.setLineDash([]);
    ctx.textAlign = 'center'; ctx.fillStyle = '#e00000'; ctx.font = `600 66px ${COND}`; ctx.fillText('!!! KAUF JETZT !!!', 0, -50);
    ctx.fillStyle = '#111'; ctx.font = `600 104px ${COND}`; ctx.fillText('-50%', 0, 70);
    ctx.font = `400 34px ${COND}`; ctx.fillText('NUR HEUTE · KLICK HIER', 0, 128);
    const xk = easeOut(prog(t, EV.adX, EV.adX + .12));
    if (xk > 0) {
      ctx.strokeStyle = RED; ctx.lineWidth = 30; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-200, -140); ctx.lineTo(lerp(-200, 200, xk), lerp(-140, 140, xk)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(200, -140); ctx.lineTo(lerp(200, -200, xk), lerp(-140, 140, xk)); ctx.stroke();
    }
    ctx.restore();
  }

  // Anfragen-Benachrichtigungen
  EV.notif.forEach((t0, i) => {
    const k = easeOutBack(prog(t, t0, t0 + .3), 1.4); if (k <= 0) return;
    const push = EV.notif.slice(i + 1).reduce((acc, x) => acc + easeOut(prog(t, x, x + .3)) * 140, 0);
    const y = sy + 70 + lerp(-200, 0, k) + push;
    ctx.save(); ctx.globalAlpha *= clamp(k * 2);
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 24;
    ctx.fillStyle = 'rgba(34,29,22,.97)'; ctx.beginPath(); ctx.roundRect(sx + 18, y, sw - 36, 120, 28); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(212,166,64,.5)'; ctx.lineWidth = 2; ctx.stroke();
    envelope(ctx, sx + 78, y + 60, 1);
    ctx.textAlign = 'left'; ctx.fillStyle = GOLD.a; ctx.font = `600 32px ${COND}`; ctx.fillText('Neue Anfrage', sx + 130, y + 50);
    ctx.fillStyle = '#e9e2d4'; ctx.font = `400 italic 28px ${SERIF}`; ctx.fillText(NOTES[i], sx + 130, y + 92);
    ctx.restore();
  });
  ctx.restore(); // Screen-Clip

  // Herzen steigen am Rand auf
  for (const h of HEARTS) {
    const dt = t - h.t0; if (dt < 0 || dt > 1.6 || t > EV.phoneOut) continue;
    ctx.save(); ctx.globalAlpha *= clamp(1.6 - dt) * clamp(dt * 5);
    ctx.translate(PW / 2 - 10 + h.x + Math.sin(dt * 5 + h.ph) * 26, PH / 2 - 160 - dt * h.sp);
    ctx.fillStyle = h.s > .9 ? GOLD.a : '#ff4d6d'; heart(ctx, h.s * 1.6); ctx.restore();
  }
  ctx.restore();
}

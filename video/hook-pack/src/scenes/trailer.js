// Hook 3 "Kino-Trailer": BRAAAM -> IN EINER WELT, / IN DER JEDER POSTET, / GEWINNT NUR EINER. -> Logo
import { prog, easeOut, easeOutBack, easeInOut, lerp, clamp, goldGrad, goldText, fitSize, loadImage, SERIF } from '../lib.js';

export const HITS = [.12, 1.12, 2.12, 3.02];
const LINES = [['IN EINER|WELT,', false, 150], ['IN DER JEDER|POSTET,', false, 140], ['GEWINNT|NUR EINER.', true, 190]];
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

function flare(ctx, W, y, k, a) {
  // horizontale Lichtstreife, die beim Schlag aufblitzt und ausläuft
  const w = lerp(200, W * 1.6, easeOut(k)), al = a * (1 - k);
  const g = ctx.createLinearGradient(W / 2 - w / 2, 0, W / 2 + w / 2, 0);
  g.addColorStop(0, 'rgba(255,200,120,0)'); g.addColorStop(.5, `rgba(255,235,190,${al})`); g.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = g; ctx.fillRect(W / 2 - w / 2, y - 4, w, 8);
  const r = ctx.createRadialGradient(W / 2, y, 0, W / 2, y, 260);
  r.addColorStop(0, `rgba(255,220,150,${al * .6})`); r.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = r; ctx.fillRect(W / 2 - 260, y - 260, 520, 520);
}

export function draw(ctx, t, { W, H }) {
  ctx.fillStyle = '#030202'; ctx.fillRect(-60, -60, W + 120, H + 120);
  // Staub/Licht von oben
  const beam = ctx.createLinearGradient(0, 0, 0, H);
  beam.addColorStop(0, 'rgba(120,90,40,.18)'); beam.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = beam; ctx.fillRect(0, 0, W, H);

  LINES.forEach(([txt, gold, size], i) => {
    const a = HITS[i], b = HITS[i + 1] - .08;
    if (t < a || t > b + .05) return;
    const k = prog(t, a, b), inK = easeOut(prog(t, a, a + .18)), out = 1 - prog(t, b - .2, b);
    const rows = txt.split('|');
    const fs = Math.min(...rows.map(r => fitSize(ctx, r, 940, size, SERIF, 900, gold ? 8 : 12)));
    ctx.save(); ctx.globalAlpha = inK * out;
    ctx.translate(W / 2, 960); const s = lerp(1.12, 1.0, easeOut(k)) * (gold ? lerp(1.3, 1, easeOutBack(prog(t, a, a + .3), 1.6)) : 1); ctx.scale(s, s);
    rows.forEach((r, j) => {
      const y = (j - (rows.length - 1) / 2) * fs * 1.12 + fs * .35;
      if (gold) goldText(ctx, r, 0, y, fs, { glow: 1.4, spacing: 8 });
      else { ctx.font = `900 ${fs}px ${SERIF}`; ctx.letterSpacing = '12px'; ctx.textAlign = 'center'; ctx.fillStyle = '#e9e2d4'; ctx.fillText(r, 0, y); }
    });
    ctx.restore();
    flare(ctx, W, 1010, prog(t, a, a + .9), gold ? 1 : .7);
  });

  // Logo wie ein Studio-Intro
  const lk = prog(t, HITS[3], HITS[3] + .35);
  if (lk > 0) {
    const s = lerp(1.6, 1, easeOutBack(lk, 1.4)) * (1 + (t - HITS[3]) * .04);
    ctx.save(); ctx.globalAlpha = clamp(lk * 3);
    const g = ctx.createRadialGradient(W / 2, 860, 20, W / 2, 860, 700); g.addColorStop(0, 'rgba(240,190,90,.35)'); g.addColorStop(1, 'rgba(240,190,90,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.translate(W / 2, 880); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(243,190,80,.6)'; ctx.shadowBlur = 60;
    ctx.drawImage(sym, -110, -330, 220, 386);
    ctx.shadowBlur = 30; ctx.drawImage(mark, -330, 110, 660, 63);
    ctx.restore();
    flare(ctx, W, 1010, prog(t, HITS[3], HITS[3] + .8), 1);
  }
  // Cinema-Balken
  const bar = lerp(0, 240, easeInOut(prog(t, 0, .4)));
  ctx.fillStyle = '#000'; ctx.fillRect(-60, -60, W + 120, bar + 60); ctx.fillRect(-60, H - bar, W + 120, bar + 60);
}

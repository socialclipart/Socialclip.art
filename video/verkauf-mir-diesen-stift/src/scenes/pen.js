import { drawPen, goldText, fitSize, prog, easeOut, easeInOut, lerp, SERIF } from '../lib.js';

export function draw(ctx, _, { W, H, t }) {
  const fadeIn = prog(t, 0, .45);
  const move = easeInOut(prog(t, 2.45, 3.05));
  const out = 1 - prog(t, 10.5, 10.9);

  // Lichtkegel hinter dem Stift
  ctx.save(); ctx.globalAlpha = fadeIn * out * (1 - move * .55);
  const cy = lerp(860, 380, move);
  const glow = ctx.createRadialGradient(W / 2, cy, 10, W / 2, cy, lerp(620, 380, move));
  glow.addColorStop(0, 'rgba(230,180,80,.32)'); glow.addColorStop(1, 'rgba(230,180,80,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H); ctx.restore();

  // Stift: langsame Drehung, danach klein oben
  const spin = lerp(-0.62, -0.22, easeOut(prog(t, 0, 2.6)));
  const ang = lerp(spin, -0.12 + Math.sin(t * 1.3) * .03, move);
  const L = lerp(lerp(700, 780, prog(t, 0, 2.6)), 400, move);
  const bob = Math.sin(t * 1.7) * 6 * move;
  ctx.save(); ctx.globalAlpha = fadeIn * out;
  ctx.translate(W / 2, cy + bob); ctx.rotate(ang);
  const sheen = t < 2.6 ? lerp(-.3, 1.3, prog(t, .25, 1.9)) : lerp(-.3, 1.3, ((t - 3) % 3.2) / 1.6);
  drawPen(ctx, L, sheen);
  ctx.restore();

  // Hook-Text
  const tOut = 1 - prog(t, 2.4, 2.75);
  if (tOut > 0) {
    const l1 = easeOut(prog(t, .62, 1.0)), l2 = easeOut(prog(t, 1.42, 1.8));
    const s1 = fitSize(ctx, 'VERKAUF MIR', 900, 150, SERIF, 900, 4);
    const s2 = fitSize(ctx, 'DIESEN STIFT.', 900, 150, SERIF, 900, 4);
    ctx.save(); ctx.globalAlpha = l1 * tOut;
    ctx.font = `900 ${s1}px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillStyle = '#f6f1e6'; ctx.letterSpacing = '4px';
    ctx.fillText('VERKAUF MIR', W / 2, 1290 + (1 - l1) * 40); ctx.restore();
    ctx.save(); ctx.globalAlpha = l2 * tOut;
    goldText(ctx, 'DIESEN STIFT.', W / 2, 1290 + s1 * 1.05 + (1 - l2) * 40, s2, { glow: 1, spacing: 4 });
    ctx.restore();
  }
}

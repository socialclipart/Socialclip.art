import { prog, drawGrain } from '../lib.js';

export function draw(ctx, t, { W, H, TL }) {
  for (const [s, rgb, a, d] of TL.flashes) {
    const k = prog(t, s, s + d); if (k <= 0 || k >= 1) continue;
    ctx.fillStyle = `rgba(${rgb},${a * (1 - k) * (1 - k)})`; ctx.fillRect(0, 0, W, H);
  }
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .72);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.62)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  drawGrain(ctx, t, W, H, .07);
  const fi = 1 - prog(t, 0, .3);
  if (fi > 0) { ctx.fillStyle = `rgba(0,0,0,${fi})`; ctx.fillRect(0, 0, W, H); }
}
